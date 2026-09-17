import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';

export interface ServerLicense {
  id: string;
  licenseKey: string;
  clientName: string;
  vehiclePlate: string;
  clientPhone?: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'revoked' | 'pending' | 'device_mismatch';
  durationDays: number;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string;
  notes?: string;
  renewalCount: number;
  lastRenewalDate?: string;
  lastCheckedAt?: string;
  isUsed?: boolean;
  deviceId?: string;
  deviceName?: string;
  deviceActivatedAt?: string;
}

export interface LicenseAuditLog {
  id: string | number;
  licenseId?: string;
  licenseKey?: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');
const LICENSES_BACKUP_FILE = path.join(DATA_DIR, 'licenses.backup.json');
const FIREBASE_CONFIG_FILE = path.join(process.cwd(), 'firebase-applet-config.json');

// In-memory cache of licenses & audit logs for lightning-fast, synchronous access in routes
let licensesCache: ServerLicense[] = [];
let auditLogsCache: LicenseAuditLog[] = [];
let firestoreDb: Firestore | null = null;
let isCloudConnected = false;
let lastCloudSyncTime: string | null = null;
let firebaseConfig: any = null;

// Initialize Firebase App & Cloud Firestore
export function getCloudFirestore(): Firestore | null {
  if (firestoreDb) return firestoreDb;

  try {
    if (!fs.existsSync(FIREBASE_CONFIG_FILE)) {
      console.warn('Fichier firebase-applet-config.json introuvable.');
      return null;
    }

    const rawConfig = fs.readFileSync(FIREBASE_CONFIG_FILE, 'utf-8');
    firebaseConfig = JSON.parse(rawConfig);

    let app: FirebaseApp;
    if (getApps().length === 0) {
      app = initializeApp({
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey,
        appId: firebaseConfig.appId,
      });
    } else {
      app = getApp();
    }

    const databaseId = firebaseConfig.firestoreDatabaseId;
    firestoreDb = databaseId ? initializeFirestore(app, {}, databaseId) : getFirestore(app);
    isCloudConnected = true;
    console.log(
      `[Cloud Firestore] Connecté au projet ${firebaseConfig.projectId} (Base: ${databaseId || '(default)'})`
    );
    return firestoreDb;
  } catch (err) {
    console.error('[Cloud Firestore] Erreur initialisation Firestore:', err);
    isCloudConnected = false;
    return null;
  }
}

// Load initial licenses from disk into memory cache
function loadLocalFallbackLicenses(): ServerLicense[] {
  try {
    if (fs.existsSync(LICENSES_FILE)) {
      const raw = fs.readFileSync(LICENSES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erreur lecture licenses.json:', e);
  }

  try {
    if (fs.existsSync(LICENSES_BACKUP_FILE)) {
      const raw = fs.readFileSync(LICENSES_BACKUP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return [];
}

function syncLocalJsonBackup(licenses: ServerLicense[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const jsonStr = JSON.stringify(licenses, null, 2);
    fs.writeFileSync(LICENSES_FILE, jsonStr, 'utf-8');
    try {
      fs.writeFileSync(LICENSES_BACKUP_FILE, jsonStr, 'utf-8');
    } catch {}
  } catch (err) {
    console.warn('Avertissement synchronisation locale JSON:', err);
  }
}

// Full bidirectional sync with Cloud Firestore
export async function syncLicensesWithCloud(): Promise<void> {
  const db = getCloudFirestore();
  if (!db) {
    if (licensesCache.length === 0) {
      licensesCache = loadLocalFallbackLicenses();
    }
    return;
  }

  try {
    const licensesCol = collection(db, 'licenses');
    const snapshot = await getDocs(licensesCol);

    if (snapshot.empty) {
      console.log('[Cloud Firestore] Base distante vide : amorçage depuis le cache local...');
      const local = licensesCache.length > 0 ? licensesCache : loadLocalFallbackLicenses();
      for (const lic of local) {
        const cleanLic: any = { ...lic };
        Object.keys(cleanLic).forEach((k) => cleanLic[k] === undefined && delete cleanLic[k]);
        await setDoc(doc(db, 'licenses', lic.id), cleanLic);
      }
      licensesCache = [...local];
      await addDoc(collection(db, 'license_audit_logs'), {
        action: 'CLOUD_INIT',
        performedBy: 'SYSTEM',
        details: `Initialisation Cloud Firestore avec ${local.length} licences`,
        timestamp: new Date().toISOString(),
      });
    } else {
      const cloudLicenses: ServerLicense[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        cloudLicenses.push({
          id: docSnap.id,
          licenseKey: data.licenseKey,
          clientName: data.clientName || 'Client Inconnu',
          vehiclePlate: data.vehiclePlate || '',
          clientPhone: data.clientPhone || '',
          status: data.status || 'pending',
          durationDays: typeof data.durationDays === 'number' ? data.durationDays : 365,
          createdAt: data.createdAt || new Date().toISOString(),
          activatedAt: data.activatedAt || null,
          expiresAt: data.expiresAt || '',
          deviceId: data.deviceId || undefined,
          deviceName: data.deviceName || undefined,
          deviceActivatedAt: data.deviceActivatedAt || undefined,
          lastCheckedAt: data.lastCheckedAt || undefined,
          renewalCount: typeof data.renewalCount === 'number' ? data.renewalCount : 0,
          lastRenewalDate: data.lastRenewalDate || undefined,
          notes: data.notes || '',
          isUsed: Boolean(data.isUsed),
        });
      });

      // Sort by creation date descending
      cloudLicenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      licensesCache = cloudLicenses;
      syncLocalJsonBackup(cloudLicenses);
      console.log(`[Cloud Firestore] Synchronisation réussie : ${cloudLicenses.length} licences chargées.`);
    }

    // Refresh audit logs cache from Cloud
    try {
      const logsCol = collection(db, 'license_audit_logs');
      const q = query(logsCol, orderBy('timestamp', 'desc'), firestoreLimit(100));
      const logSnap = await getDocs(q);
      const logs: LicenseAuditLog[] = [];
      logSnap.forEach((d) => {
        const val = d.data();
        logs.push({
          id: d.id,
          licenseId: val.licenseId,
          licenseKey: val.licenseKey,
          action: val.action,
          performedBy: val.performedBy,
          details: val.details,
          timestamp: val.timestamp,
        });
      });
      auditLogsCache = logs;
    } catch (logErr) {
      console.warn('[Cloud Firestore] Avertissement lecture logs audit:', logErr);
    }

    isCloudConnected = true;
    lastCloudSyncTime = new Date().toISOString();
  } catch (err) {
    console.error('[Cloud Firestore] Erreur lors de la synchronisation:', err);
    if (licensesCache.length === 0) {
      licensesCache = loadLocalFallbackLicenses();
    }
  }
}

// Initial bootstrap call
getCloudFirestore();
licensesCache = loadLocalFallbackLicenses();
syncLicensesWithCloud().catch((e) => console.error('Initial sync error:', e));

// Update expired/expiring statuses on active licenses
function evaluateLicenseStatuses(licenses: ServerLicense[]): { updated: ServerLicense[]; changed: boolean } {
  const now = new Date();
  let changed = false;

  const updated = licenses.map((lic) => {
    if (lic.status === 'revoked' || lic.status === 'pending' || lic.status === 'device_mismatch') {
      return lic;
    }
    if (!lic.expiresAt) {
      return lic;
    }
    const expiry = new Date(lic.expiresAt);
    if (isNaN(expiry.getTime())) {
      return lic;
    }
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let newStatus = lic.status;
    if (diffDays <= 0) {
      newStatus = 'expired';
    } else if (diffDays <= 30) {
      newStatus = 'expiring_soon';
    } else {
      newStatus = 'active';
    }

    const calculatedDays = diffDays > 0 ? diffDays : 0;
    if (newStatus !== lic.status || lic.durationDays !== calculatedDays) {
      changed = true;
      const updatedLic: ServerLicense = { ...lic, status: newStatus, durationDays: calculatedDays };
      
      // Async update in Cloud Firestore
      const db = getCloudFirestore();
      if (db) {
        setDoc(doc(db, 'licenses', lic.id), { status: newStatus, durationDays: calculatedDays }, { merge: true }).catch(
          (e) => console.warn('Erreur mise à jour statut Cloud:', e)
        );
      }

      return updatedLic;
    }
    return lic;
  });

  return { updated, changed };
}

export function loadLicensesFromDb(): ServerLicense[] {
  if (licensesCache.length === 0) {
    licensesCache = loadLocalFallbackLicenses();
  }

  const { updated, changed } = evaluateLicenseStatuses(licensesCache);
  if (changed) {
    licensesCache = updated;
    syncLocalJsonBackup(updated);
  }

  // Fire a non-blocking background refresh from Cloud Firestore to keep memory updated
  syncLicensesWithCloud().catch(() => {});

  return licensesCache;
}

export function saveOrUpdateLicenseInDb(
  lic: ServerLicense,
  performedBy: string = 'ADMIN',
  actionType?: string,
  details?: string
): boolean {
  try {
    const existingIndex = licensesCache.findIndex((l) => l.id === lic.id);
    const isNew = existingIndex === -1;

    if (isNew) {
      licensesCache.unshift(lic);
    } else {
      licensesCache[existingIndex] = { ...lic };
    }

    // Save to local backup file
    syncLocalJsonBackup(licensesCache);

    // Save to Cloud Firestore
    const db = getCloudFirestore();
    const action = actionType || (isNew ? 'CREATE' : 'UPDATE');
    const desc = details || (isNew ? `Création licence ${lic.licenseKey}` : `Mise à jour licence ${lic.licenseKey}`);
    const timestamp = new Date().toISOString();

    const newLog: LicenseAuditLog = {
      id: 'log-' + Date.now().toString(36),
      licenseId: lic.id,
      licenseKey: lic.licenseKey,
      action,
      performedBy,
      details: desc,
      timestamp,
    };
    auditLogsCache.unshift(newLog);

    if (db) {
      const cleanLic: any = { ...lic };
      Object.keys(cleanLic).forEach((k) => cleanLic[k] === undefined && delete cleanLic[k]);

      // Execute firestore writes
      Promise.all([
        setDoc(doc(db, 'licenses', lic.id), cleanLic),
        addDoc(collection(db, 'license_audit_logs'), {
          licenseId: lic.id,
          licenseKey: lic.licenseKey,
          action,
          performedBy,
          details: desc,
          timestamp,
        }),
      ]).catch((e) => console.error('[Cloud Firestore] Erreur écriture distante:', e));
    }

    return true;
  } catch (err) {
    console.error('Erreur sauvegarde licence:', err);
    return false;
  }
}

export function deleteLicenseFromDb(id: string, performedBy: string = 'ADMIN'): boolean {
  try {
    const existing = licensesCache.find((l) => l.id === id);
    if (!existing) return false;

    licensesCache = licensesCache.filter((l) => l.id !== id);
    syncLocalJsonBackup(licensesCache);

    const timestamp = new Date().toISOString();
    const log: LicenseAuditLog = {
      id: 'log-' + Date.now().toString(36),
      licenseId: id,
      licenseKey: existing.licenseKey,
      action: 'DELETE',
      performedBy,
      details: `Suppression de la licence ${existing.licenseKey}`,
      timestamp,
    };
    auditLogsCache.unshift(log);

    const db = getCloudFirestore();
    if (db) {
      Promise.all([
        deleteDoc(doc(db, 'licenses', id)),
        addDoc(collection(db, 'license_audit_logs'), {
          licenseId: id,
          licenseKey: existing.licenseKey,
          action: 'DELETE',
          performedBy,
          details: `Suppression de la licence ${existing.licenseKey}`,
          timestamp,
        }),
      ]).catch((e) => console.error('[Cloud Firestore] Erreur suppression distante:', e));
    }

    return true;
  } catch (err) {
    console.error('Erreur suppression licence:', err);
    return false;
  }
}

export function saveAllLicensesToDb(licenses: ServerLicense[], performedBy: string = 'SYSTEM'): boolean {
  try {
    licensesCache = [...licenses];
    syncLocalJsonBackup(licensesCache);

    const db = getCloudFirestore();
    if (db) {
      for (const lic of licenses) {
        const cleanLic: any = { ...lic };
        Object.keys(cleanLic).forEach((k) => cleanLic[k] === undefined && delete cleanLic[k]);
        setDoc(doc(db, 'licenses', lic.id), cleanLic).catch((e) => console.warn('Sync license error:', e));
      }
    }
    return true;
  } catch (err) {
    console.error('Erreur sauvegarde globale licences:', err);
    return false;
  }
}

export function logAudit(
  licenseId: string | null,
  licenseKey: string | null,
  action: string,
  performedBy: string,
  details: string
) {
  const timestamp = new Date().toISOString();
  const newLog: LicenseAuditLog = {
    id: 'log-' + Date.now().toString(36),
    licenseId: licenseId || undefined,
    licenseKey: licenseKey || undefined,
    action,
    performedBy,
    details,
    timestamp,
  };
  auditLogsCache.unshift(newLog);

  const db = getCloudFirestore();
  if (db) {
    addDoc(collection(db, 'license_audit_logs'), {
      licenseId: licenseId || null,
      licenseKey: licenseKey || null,
      action,
      performedBy,
      details,
      timestamp,
    }).catch((e) => console.error('[Cloud Firestore] Erreur audit log:', e));
  }
}

export function getAuditLogs(limitCount: number = 100): LicenseAuditLog[] {
  return auditLogsCache.slice(0, limitCount);
}

export function getDatabaseMetadata(): {
  databaseType: string;
  cloudProvider: string;
  cloudProjectId: string;
  databaseId: string;
  region: string;
  totalLicenses: number;
  totalAuditLogs: number;
  cloudActive: boolean;
  sqliteActive: boolean;
  lastSync: string;
} {
  return {
    databaseType: 'Google Cloud Firestore (Base NoSQL Cloud Distribuée)',
    cloudProvider: 'Google Cloud Platform (GCP / Firebase)',
    cloudProjectId: firebaseConfig?.projectId || 'herculian-gear-9xjsq',
    databaseId: firebaseConfig?.firestoreDatabaseId || 'ai-studio-autogestioncarne-230abe20-5cf9-45bd-afef-e2c08c80ea57',
    region: 'europe-west2 (Londres)',
    totalLicenses: licensesCache.length,
    totalAuditLogs: auditLogsCache.length,
    cloudActive: isCloudConnected,
    sqliteActive: false,
    lastSync: lastCloudSyncTime || new Date().toISOString(),
  };
}
