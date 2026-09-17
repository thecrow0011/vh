import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  loadLicensesFromDb,
  saveOrUpdateLicenseInDb,
  deleteLicenseFromDb,
  saveAllLicensesToDb,
  getAuditLogs,
  getDatabaseMetadata,
  logAudit,
} from './server/licensesDb.ts';

const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2026';

app.use(express.json());

// License Types & Persistence
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

const DATA_DIR = path.join(process.cwd(), 'data');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin-config.json');
const APP_DATA_FILE = path.join(DATA_DIR, 'app-data.json');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');
const LICENSES_BACKUP_FILE = path.join(DATA_DIR, 'licenses.backup.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default application data initialized on server if app-data.json is not present
const DEFAULT_APP_DATA = {
  activeLicenseKey: 'DZ-AUTO-2026-ACTIVE',
  vehicle: {
    id: 'veh-01',
    make: 'Peugeot',
    model: '208 II',
    year: 2021,
    trim: 'GT Line 1.2 PureTech 130 EAT8',
    licensePlate: '01245-121-16',
    vin: 'VF3UPHNKMLS104829',
    fuelType: 'essence',
    tankCapacity: 44,
    currentMileage: 48250,
    purchaseDate: '2021-06-18',
    color: 'Bleu Vertigo',
    insuranceCompany: 'SAA Assurances',
    insurancePolicyNumber: 'SAA-78942-AUTO',
    emergencyPhone: '021 60 40 20',
  },
  fuelLogs: [
    {
      id: 'fuel-01',
      vehicleId: 'veh-01',
      date: '2026-06-12',
      mileage: 46210,
      liters: 39.4,
      pricePerLiter: 45.62,
      totalCost: 1797.43,
      isFullTank: true,
      station: 'Naftal Relais',
      fuelType: 'essence',
      notes: 'Plein Sans Plomb avant départ en week-end',
    },
    {
      id: 'fuel-02',
      vehicleId: 'veh-01',
      date: '2026-07-04',
      mileage: 46880,
      liters: 41.2,
      pricePerLiter: 45.62,
      totalCost: 1879.54,
      isFullTank: true,
      station: 'Naftal Sidi Fredj',
      fuelType: 'essence',
      notes: 'Plein Sans Plomb',
    },
    {
      id: 'fuel-03',
      vehicleId: 'veh-01',
      date: '2026-07-28',
      mileage: 47520,
      liters: 38.6,
      pricePerLiter: 45.62,
      totalCost: 1760.93,
      isFullTank: true,
      station: 'Naftal Autoroute Est-Ouest',
      fuelType: 'essence',
      notes: 'Trajet vacances autoroute',
    },
    {
      id: 'fuel-04',
      vehicleId: 'veh-01',
      date: '2026-08-22',
      mileage: 48190,
      liters: 40.5,
      pricePerLiter: 45.62,
      totalCost: 1847.61,
      isFullTank: true,
      station: 'Naftal Express',
      fuelType: 'essence',
      notes: 'Plein régulier',
    },
  ],
  maintenanceRecords: [
    {
      id: 'maint-01',
      vehicleId: 'veh-01',
      title: 'Vidange complète + Filtre à huile',
      category: 'vidange',
      date: '2026-01-15',
      mileage: 40100,
      cost: 6800,
      garage: 'Peugeot Pro Service Alger',
      invoiceNumber: 'FAC-2026-014',
      nextDueMileage: 55100,
      nextDueDate: '2027-01-15',
      completed: true,
      notes: 'Huile Total Quartz Ineo First 0W30 avec cartouche Purflux',
    },
    {
      id: 'maint-02',
      vehicleId: 'veh-01',
      title: 'Plaquettes de frein avant',
      category: 'freinage',
      date: '2025-11-10',
      mileage: 38200,
      cost: 9500,
      garage: 'Garage Spécialisé Freinage',
      invoiceNumber: 'FAC-2025-882',
      nextDueMileage: 73200,
      nextDueDate: '2027-11-10',
      completed: true,
      notes: 'Remplacement jeu de plaquettes Brembo',
    },
    {
      id: 'maint-03',
      vehicleId: 'veh-01',
      title: 'Contrôle Technique Périodique (ENACTA)',
      category: 'controle_technique',
      date: '2025-09-25',
      mileage: 35400,
      cost: 2500,
      garage: 'Centre Agréé ENACTA',
      invoiceNumber: 'CT-2025-99824',
      nextDueMileage: 55400,
      nextDueDate: '2026-09-25',
      completed: true,
      notes: 'Contrôle technique vierge sans défaut majeur',
    },
  ],
  documents: [
    {
      id: 'doc-01',
      vehicleId: 'veh-01',
      title: 'Contrôle Technique Périodique (ENACTA)',
      type: 'controle_technique',
      documentNumber: 'CT-2025-99824',
      provider: 'Centre Agréé ENACTA',
      issueDate: '2025-09-25',
      expiryDate: '2026-09-25',
      notifyDaysBefore: 45,
      notes: 'Centre agréé national. Penser à prendre rendez-vous pour le contrôle annuel.',
      emergencyContact: '023 50 12 34',
    },
    {
      id: 'doc-02',
      vehicleId: 'veh-01',
      title: 'Assurance Tous Risques + Dépannage',
      type: 'assurance',
      documentNumber: 'POL-SAA-2026-88',
      provider: 'SAA Assurances',
      issueDate: '2025-12-15',
      expiryDate: '2026-12-15',
      notifyDaysBefore: 30,
      notes: 'Franchise bris de glace 0 DA. Dépannage et remorquage inclus.',
      emergencyContact: '021 60 40 20',
    },
    {
      id: 'doc-03',
      vehicleId: 'veh-01',
      title: "Carte d'immatriculation (Carte Grise)",
      type: 'carte_grise',
      documentNumber: '16-123-45129',
      provider: "Daïra / Ministère de l'Intérieur",
      issueDate: '2021-06-20',
      expiryDate: '2036-06-20',
      notifyDaysBefore: 60,
      notes: 'Document officiel permanent conservé dans la boîte à gants.',
    },
    {
      id: 'doc-04',
      vehicleId: 'veh-01',
      title: 'Vignette Automobile Annuelle',
      type: 'critair',
      documentNumber: 'VIG-2026-782410',
      provider: 'Direction Générale des Impôts (DGI)',
      issueDate: '2026-03-01',
      expiryDate: '2027-03-31',
      notifyDaysBefore: 30,
      notes: 'Quittance et macaron officiel apposé sur le pare-brise avant droit.',
    },
    {
      id: 'doc-05',
      vehicleId: 'veh-01',
      title: 'Permis de Conduire Biométrique',
      type: 'permis',
      documentNumber: '16AF12894',
      provider: "Daïra / Ministère de l'Intérieur",
      issueDate: '2019-10-10',
      expiryDate: '2029-10-10',
      notifyDaysBefore: 90,
      notes: 'Permis de conduire biométrique à points national.',
    },
  ],
};

function loadAppData(): typeof DEFAULT_APP_DATA {
  try {
    if (fs.existsSync(APP_DATA_FILE)) {
      const raw = fs.readFileSync(APP_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.vehicle) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erreur lecture app-data.json:', err);
  }
  saveAppData(DEFAULT_APP_DATA);
  return DEFAULT_APP_DATA;
}

function saveAppData(data: any): boolean {
  try {
    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(APP_DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erreur écriture app-data.json:', err);
    return false;
  }
}

function getAdminPassword(): string {
  try {
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const data = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed.adminPassword === 'string' && parsed.adminPassword.length > 0) {
        return parsed.adminPassword;
      }
    }
  } catch (err) {
    console.error('Erreur lecture admin-config.json:', err);
  }
  return process.env.ADMIN_PASSWORD || 'admin2026';
}

function saveAdminPassword(newPassword: string): void {
  try {
    fs.writeFileSync(
      ADMIN_CONFIG_FILE,
      JSON.stringify({ adminPassword: newPassword, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('Erreur écriture admin-config.json:', err);
  }
}

function getInitialLicenses(): ServerLicense[] {
  const now = new Date();
  
  // 1 year in the future from now for active sample
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  // Expiring in 15 days
  const expiringSoon = new Date(now);
  expiringSoon.setDate(expiringSoon.getDate() + 15);

  // Expired 30 days ago
  const expiredDate = new Date(now);
  expiredDate.setDate(expiredDate.getDate() - 30);

  return [
    {
      id: 'lic-001',
      licenseKey: 'DZ-AUTO-2026-ACTIVE',
      clientName: 'Rachid F.',
      vehiclePlate: '01245-121-16',
      clientPhone: '0550 12 34 56',
      status: 'active',
      durationDays: 365,
      createdAt: now.toISOString(),
      activatedAt: now.toISOString(),
      expiresAt: oneYearLater.toISOString(),
      notes: 'Licence Pro Annuelle (1 an) - Véhicule Peugeot 208 II',
      renewalCount: 0,
      lastRenewalDate: undefined,
      isUsed: false,
    },
    {
      id: 'lic-002',
      licenseKey: 'DZ-AUTO-SOON-2026',
      clientName: 'Amine B.',
      vehiclePlate: '04512-122-31',
      clientPhone: '0770 45 67 89',
      status: 'expiring_soon',
      durationDays: 365,
      createdAt: new Date(now.getTime() - 350 * 86400000).toISOString(),
      activatedAt: new Date(now.getTime() - 350 * 86400000).toISOString(),
      expiresAt: expiringSoon.toISOString(),
      notes: 'Renouvellement annuel imminent (expire dans 15 jours)',
      renewalCount: 0,
      isUsed: true,
    },
    {
      id: 'lic-003',
      licenseKey: 'DZ-AUTO-EXP-DEMO',
      clientName: 'Mohamed K.',
      vehiclePlate: '02891-120-16',
      clientPhone: '0661 98 76 54',
      status: 'expired',
      durationDays: 365,
      createdAt: new Date(now.getTime() - 395 * 86400000).toISOString(),
      activatedAt: new Date(now.getTime() - 395 * 86400000).toISOString(),
      expiresAt: expiredDate.toISOString(),
      notes: 'Licence arrivée à terme - Nécessite validation de renouvellement par administrateur',
      renewalCount: 0,
      isUsed: true,
    },
    {
      id: 'lic-004',
      licenseKey: 'DZ-AUTO-NEW-DISPO',
      clientName: 'Client Libre',
      vehiclePlate: '',
      clientPhone: '',
      status: 'pending',
      durationDays: 365,
      createdAt: now.toISOString(),
      activatedAt: null,
      expiresAt: '',
      notes: 'Clé neuve à usage unique prête pour première activation client',
      renewalCount: 0,
      isUsed: false,
    }
  ];
}

function loadLicenses(): ServerLicense[] {
  return loadLicensesFromDb();
}

function saveLicenses(licenses: ServerLicense[]): boolean {
  return saveAllLicensesToDb(licenses, 'SYSTEM');
}

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `DZ-AUTO-${part1}-${part2}`;
}

// ----------------------------------------------------
// Public API Endpoints
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// App data synchronization endpoints (Server-side durable persistence for vehicle, fuel, maintenance, documents, and active license)
app.get('/api/app-data', (req, res) => {
  const data = loadAppData();
  res.json({ success: true, data });
});

app.post('/api/app-data', (req, res) => {
  const { vehicle, fuelLogs, maintenanceRecords, documents, activeLicenseKey } = req.body || {};
  const current = loadAppData();
  const updated = {
    ...current,
    vehicle: vehicle || current.vehicle,
    fuelLogs: Array.isArray(fuelLogs) ? fuelLogs : current.fuelLogs,
    maintenanceRecords: Array.isArray(maintenanceRecords) ? maintenanceRecords : current.maintenanceRecords,
    documents: Array.isArray(documents) ? documents : current.documents,
    activeLicenseKey: activeLicenseKey || current.activeLicenseKey,
  };
  saveAppData(updated);
  res.json({ success: true, message: 'Données enregistrées avec succès sur le serveur.' });
});

app.post('/api/license/set-active', (req, res) => {
  const { licenseKey } = req.body || {};
  if (!licenseKey) {
    return res.status(400).json({ success: false, message: 'Clé de licence manquante.' });
  }
  const normalizedKey = String(licenseKey).trim().toUpperCase();
  const licenses = loadLicenses();
  const found = licenses.find((l) => l.licenseKey.toUpperCase() === normalizedKey);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Cette clé de licence est introuvable sur le serveur.' });
  }
  res.json({ success: true, activeLicenseKey: found.licenseKey, license: found, message: `Licence ${found.licenseKey} sélectionnée.` });
});

// Verification endpoint for client app (Supports both POST and GET)
// STRICT HARDWARE / SINGLE-DEVICE LOCK : Une licence n'est valide QUE sur l'appareil où elle a été activée
function verifyLicenseHandler(req: express.Request, res: express.Response) {
  const licenses = loadLicenses();
  const now = new Date();

  // Client parameters
  const rawKey = (req.body?.licenseKey || req.query?.licenseKey || '').toString().trim();
  const vehiclePlate = (req.body?.vehiclePlate || req.query?.vehiclePlate || '').toString().trim();
  const deviceId = (req.body?.deviceId || req.query?.deviceId || '').toString().trim();
  const deviceName = (req.body?.deviceName || req.query?.deviceName || '').toString().trim();

  // 1. Without deviceId, reject
  if (!deviceId) {
    return res.json({
      valid: false,
      status: 'pending',
      daysRemaining: 0,
      message: 'Appareil non identifié. Veuillez réactualiser la page.',
    });
  }

  let found: ServerLicense | null = null;

  // 2. If client supplied a license key, look it up
  if (rawKey) {
    found = licenses.find((l) => l.licenseKey.toUpperCase() === rawKey.toUpperCase()) || null;
  }

  // 3. If no key was supplied, check if this specific device already has an active license bound
  if (!found) {
    found = licenses.find((l) => l.deviceId && l.deviceId === deviceId && (l.status === 'active' || l.status === 'expiring_soon')) || null;
  }

  // 4. If still not found: this phone does NOT have an active license!
  if (!found) {
    return res.json({
      valid: false,
      license: null,
      hasInstalledLicense: false,
      status: 'pending',
      daysRemaining: 0,
      deviceId,
      message: 'Aucune licence installée sur ce téléphone. Veuillez saisir votre clé de licence.',
    });
  }

  // 5. STRICT SINGLE DEVICE CHECK:
  // Is this license already bound to a DIFFERENT device?
  if (found.deviceId && found.deviceId !== deviceId) {
    const allowTransfer = Boolean(req.body?.allowDeviceTransfer || req.body?.rebindDevice || req.query?.rebindDevice);
    if (allowTransfer && found.status !== 'revoked') {
      found.deviceId = deviceId;
      if (deviceName) found.deviceName = deviceName;
      found.deviceActivatedAt = now.toISOString();
      saveLicenses(licenses);
    } else {
      return res.json({
        valid: false,
        license: found,
        hasInstalledLicense: true,
        status: 'device_mismatch',
        daysRemaining: 0,
        deviceId,
        message: `Cette licence est déjà activée sur un autre téléphone (${found.deviceName || found.deviceId}). Chaque licence est strictement réservée à un seul appareil.`,
      });
    }
  }

  // If license was previously active without a deviceId (e.g. legacy/initial migration), bind it to this first accessing device now
  if (!found.deviceId && (found.status === 'active' || found.status === 'expiring_soon')) {
    found.deviceId = deviceId;
    if (deviceName) found.deviceName = deviceName;
    found.deviceActivatedAt = now.toISOString();
    saveLicenses(licenses);
  }

  // 6. Calculate real calendar expiration
  const expiry = found.expiresAt ? new Date(found.expiresAt) : null;
  const diffDays = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  if (found.status === 'revoked') {
    return res.json({
      valid: false,
      license: found,
      hasInstalledLicense: true,
      status: 'revoked',
      daysRemaining: 0,
      deviceId,
      message: "Cette licence a été suspendue ou révoquée par l'administrateur.",
    });
  }

  if (found.status === 'pending') {
    return res.json({
      valid: false,
      license: found,
      hasInstalledLicense: true,
      status: 'pending',
      daysRemaining: found.durationDays || 365,
      deviceId,
      message: 'Licence neuve en attente d\'activation. Veuillez la valider pour démarrer la période de 1 an.',
    });
  }

  // True expiration: ONLY when real diffDays <= 0
  if (diffDays <= 0) {
    found.status = 'expired';
    found.durationDays = 0;
    saveLicenses(licenses);
    return res.json({
      valid: false,
      license: found,
      hasInstalledLicense: true,
      status: 'expired',
      daysRemaining: 0,
      deviceId,
      message: expiry
        ? `Votre licence annuelle a expiré le ${expiry.toLocaleDateString('fr-FR')}. Veuillez la renouveler pour continuer.`
        : 'Votre licence annuelle a expiré. Veuillez contacter votre administrateur.',
    });
  }

  // Active status
  if (diffDays <= 30) {
    found.status = 'expiring_soon';
  } else {
    found.status = 'active';
  }
  found.durationDays = diffDays;
  found.lastCheckedAt = now.toISOString();
  saveLicenses(licenses);

  return res.json({
    valid: true,
    license: found,
    hasInstalledLicense: true,
    status: found.status,
    daysRemaining: diffDays,
    deviceId,
    message: `Licence active sur cet appareil — valide jusqu'au ${expiry?.toLocaleDateString('fr-FR')} (${diffDays} jours restants).`,
  });
}

app.post('/api/license/verify', verifyLicenseHandler);
app.get('/api/license/verify', verifyLicenseHandler);

// Activation endpoint (Usage unique strict + Verrouillage exclusif sur le téléphone demandeur)
app.post('/api/license/activate', (req, res) => {
  const { licenseKey, vehiclePlate, clientName, deviceId, deviceName } = req.body;
  if (!licenseKey) {
    return res.json({ success: false, message: 'Clé de licence obligatoire.' });
  }

  if (!deviceId) {
    return res.json({
      success: false,
      message: 'Identifiant d\'appareil introuvable. Veuillez réactualiser et réessayer.',
    });
  }

  const licenses = loadLicenses();
  const normalizedKey = String(licenseKey).trim().toUpperCase();
  const index = licenses.findIndex((l) => l.licenseKey.toUpperCase() === normalizedKey);

  if (index === -1) {
    return res.json({
      success: false,
      message: 'Clé de licence inexistante sur le serveur. Veuillez vérifier votre saisie ou contacter l\'administrateur.',
    });
  }

  const lic = licenses[index];

  if (lic.status === 'revoked') {
    return res.json({ success: false, message: 'Cette licence a été révoquée par l\'administrateur.' });
  }

  const now = new Date();

  // VERROUILLAGE MACHINE / TÉLÉPHONE UNIQUE :
  // Si la licence est déjà liée à un AUTRE appareil, REFUS TOTAL
  if ((lic.deviceId && lic.deviceId !== deviceId) || (lic.isUsed && lic.status !== 'pending' && lic.activatedAt && !lic.deviceId)) {
    return res.json({
      success: false,
      code: 'device_mismatch',
      alreadyUsed: true,
      message: `Cette licence est déjà activée et verrouillée sur un autre téléphone (${lic.deviceName || lic.deviceId || 'Autre appareil'}). Chaque licence est strictement réservée à l'appareil unique où elle a été activée.`,
    });
  }

  // Si la licence a déjà été activée sur CE MÊME appareil :
  if (lic.deviceId === deviceId && (lic.activatedAt || lic.isUsed)) {
    if (lic.expiresAt) {
      const expiry = new Date(lic.expiresAt);
      const diffMs = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0 || lic.status === 'expired') {
        return res.json({
          success: false,
          message: `Cette licence sur votre téléphone a expiré le ${expiry.toLocaleDateString('fr-FR')}. Seul l'administrateur peut la renouveler.`,
        });
      }

      lic.lastCheckedAt = now.toISOString();
      if (vehiclePlate && !lic.vehiclePlate) {
        lic.vehiclePlate = vehiclePlate;
      }
      saveLicenses(licenses);

      return res.json({
        success: true,
        license: lic,
        message: `Licence déjà active sur ce téléphone jusqu'au ${expiry.toLocaleDateString('fr-FR')} (${diffDays} jours restants).`,
      });
    }
  }

  // PREMIÈRE ACTIVATION : Association exclusive et irrévocable à cet appareil
  const duration = lic.durationDays || 365;
  const expiry = lic.expiresAt && lic.expiresAt.length > 0 
    ? new Date(lic.expiresAt) 
    : new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

  lic.activatedAt = now.toISOString();
  lic.expiresAt = expiry.toISOString();
  lic.isUsed = true;
  lic.status = 'active';
  lic.deviceId = deviceId;
  lic.deviceName = deviceName || 'Téléphone Mobile';
  lic.deviceActivatedAt = now.toISOString();

  if (vehiclePlate) {
    lic.vehiclePlate = vehiclePlate;
  }
  if (clientName && (!lic.clientName || lic.clientName === 'Client Libre' || lic.clientName === 'Nouveau Client')) {
    lic.clientName = clientName;
  }
  lic.lastCheckedAt = now.toISOString();

  saveOrUpdateLicenseInDb(
    lic,
    'CLIENT',
    'ACTIVATE',
    `Première activation réussie par ${lic.clientName} sur l'appareil "${lic.deviceName || lic.deviceId}" (Validité jusqu'au ${expiry.toLocaleDateString('fr-FR')})`
  );

  return res.json({
    success: true,
    license: lic,
    message: `Licence activée avec succès EXCLUSIVEMENT pour ce téléphone jusqu'au ${expiry.toLocaleDateString('fr-FR')} !`,
  });
});

// Endpoint de renouvellement public : Seul l'administrateur peut modifier la date d'expiration
app.post('/api/license/renew', (req, res) => {
  return res.status(403).json({
    success: false,
    message: "La date d'expiration ne peut être modifiée que par l'administrateur. Veuillez contacter votre administrateur pour renouveler ou prolonger votre licence.",
  });
});

// ----------------------------------------------------
// Admin Management API Endpoints
// ----------------------------------------------------

// Admin Authentication check middleware
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token !== 'admin-authenticated-session') {
    return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
  }
  next();
};

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const currentAdminPassword = getAdminPassword();
  
  if (password === currentAdminPassword) {
    return res.json({
      success: true,
      token: 'admin-authenticated-session',
      message: 'Connexion administrateur réussie.',
    });
  }
  return res.status(401).json({ success: false, message: 'Mot de passe administrateur incorrect.' });
});

app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Veuillez renseigner le mot de passe actuel et le nouveau mot de passe.',
    });
  }

  const currentAdminPassword = getAdminPassword();
  if (currentPassword !== currentAdminPassword) {
    return res.status(401).json({
      success: false,
      message: 'Le mot de passe actuel est incorrect.',
    });
  }

  if (typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Le nouveau mot de passe doit comporter au moins 4 caractères.',
    });
  }

  saveAdminPassword(newPassword.trim());

  return res.json({
    success: true,
    message: 'Le mot de passe administrateur a été modifié avec succès !',
  });
});

app.get('/api/admin/licenses', requireAdmin, (req, res) => {
  const licenses = loadLicenses();
  const now = new Date();

  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => l.status === 'active').length,
    expiringSoon: licenses.filter((l) => l.status === 'expiring_soon').length,
    expired: licenses.filter((l) => l.status === 'expired').length,
    revoked: licenses.filter((l) => l.status === 'revoked').length,
    pending: licenses.filter((l) => l.status === 'pending').length,
  };

  const databaseInfo = getDatabaseMetadata();

  res.json({ licenses, stats, databaseInfo, serverTime: now.toISOString() });
});

app.get('/api/admin/licenses/logs', requireAdmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 100, 500);
  const logs = getAuditLogs(limit);
  res.json({ success: true, logs });
});

app.get('/api/admin/database-info', requireAdmin, (req, res) => {
  res.json(getDatabaseMetadata());
});

app.post('/api/admin/licenses', requireAdmin, (req, res) => {
  const { clientName, vehiclePlate, clientPhone, durationDays, notes, customKey } = req.body;

  const licenseKey = customKey && customKey.trim().length > 0 
    ? customKey.trim().toUpperCase() 
    : generateLicenseKey();

  const now = new Date();
  const duration = parseInt(durationDays, 10) || 365;
  const expiry = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

  const newLicense: ServerLicense = {
    id: 'lic-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    licenseKey,
    clientName: clientName?.trim() || 'Nouveau Client',
    vehiclePlate: vehiclePlate?.trim() || '',
    clientPhone: clientPhone?.trim() || '',
    status: 'active',
    durationDays: duration,
    createdAt: now.toISOString(),
    activatedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    notes: notes?.trim() || `Créée par l'administrateur pour 1 an (${duration} jours)`,
    renewalCount: 0,
  };

  saveOrUpdateLicenseInDb(
    newLicense,
    'ADMIN',
    'CREATE',
    `Création de la licence ${newLicense.licenseKey} pour ${newLicense.clientName}`
  );

  res.status(201).json({ success: true, license: newLicense, message: 'Nouvelle licence enregistrée dans Google Cloud Firestore avec succès.' });
});

app.post('/api/admin/licenses/:id/renew', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { additionalDays } = req.body;
  const licenses = loadLicenses();
  const index = licenses.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Licence introuvable.' });
  }

  const lic = licenses[index];
  const now = new Date();
  const daysToAdd = parseInt(additionalDays, 10) || 365;

  let baseDate = lic.expiresAt ? new Date(lic.expiresAt) : now;
  if (baseDate.getTime() < now.getTime()) {
    baseDate = now;
  }
  const newExpiry = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

  lic.expiresAt = newExpiry.toISOString();
  lic.status = 'active';
  lic.renewalCount = (lic.renewalCount || 0) + 1;
  lic.lastRenewalDate = now.toISOString();

  saveOrUpdateLicenseInDb(
    lic,
    'ADMIN',
    'RENEW',
    `Renouvellement annuel : prolongation de ${daysToAdd} jours jusqu'au ${newExpiry.toLocaleDateString('fr-FR')}`
  );

  res.json({
    success: true,
    license: lic,
    message: `Licence prolongée de ${daysToAdd} jours (jusqu'au ${newExpiry.toLocaleDateString('fr-FR')}).`,
  });
});

app.put('/api/admin/licenses/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { clientName, vehiclePlate, clientPhone, expiresAt, status, notes, licenseKey, durationDays } = req.body;
  const licenses = loadLicenses();
  const index = licenses.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Licence introuvable.' });
  }

  const lic = licenses[index];
  if (licenseKey !== undefined && typeof licenseKey === 'string' && licenseKey.trim().length > 0) {
    lic.licenseKey = licenseKey.trim().toUpperCase();
  }
  if (clientName !== undefined) lic.clientName = clientName;
  if (vehiclePlate !== undefined) lic.vehiclePlate = vehiclePlate;
  if (clientPhone !== undefined) lic.clientPhone = clientPhone;
  if (durationDays !== undefined && !isNaN(Number(durationDays))) lic.durationDays = Number(durationDays);
  if (expiresAt !== undefined) {
    lic.expiresAt = expiresAt;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    lic.durationDays = diffDays > 0 ? diffDays : 0;
    if (status === undefined && lic.status !== 'revoked' && lic.status !== 'pending') {
      if (diffDays <= 0) {
        lic.status = 'expired';
      } else if (diffDays <= 30) {
        lic.status = 'expiring_soon';
      } else {
        lic.status = 'active';
      }
    }
  }
  if (status !== undefined) lic.status = status;
  if (notes !== undefined) lic.notes = notes;

  saveOrUpdateLicenseInDb(
    lic,
    'ADMIN',
    'UPDATE',
    `Mise à jour des informations administrateur (Client: ${lic.clientName}, Statut: ${lic.status})`
  );

  res.json({
    success: true,
    license: lic,
    message: 'Licence mise à jour avec succès dans Google Cloud Firestore.',
  });
});

app.get('/api/admin/licenses/export-file', requireAdmin, (req, res) => {
  try {
    const licenses = loadLicenses();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="licenses.json"');
    return res.json(licenses);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de l\'export des licences' });
  }
});

app.post('/api/admin/licenses/:id/toggle', requireAdmin, (req, res) => {
  const { id } = req.params;
  const licenses = loadLicenses();
  const index = licenses.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Licence introuvable.' });
  }

  const lic = licenses[index];
  if (lic.status === 'revoked') {
    lic.status = 'active';
  } else {
    lic.status = 'revoked';
  }

  saveOrUpdateLicenseInDb(
    lic,
    'ADMIN',
    'TOGGLE_STATUS',
    `Basculement de statut de la licence vers "${lic.status}"`
  );

  res.json({ success: true, license: lic, message: `Statut modifié dans Google Cloud Firestore : ${lic.status}` });
});

app.post('/api/admin/licenses/:id/unbind-device', requireAdmin, (req, res) => {
  const { id } = req.params;
  const licenses = loadLicenses();
  const index = licenses.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Licence introuvable.' });
  }

  const prevDevice = licenses[index].deviceName || licenses[index].deviceId || 'Inconnu';
  licenses[index].deviceId = undefined;
  licenses[index].deviceName = undefined;
  licenses[index].deviceActivatedAt = undefined;

  saveOrUpdateLicenseInDb(
    licenses[index],
    'ADMIN',
    'UNBIND_DEVICE',
    `Déliaison de l'appareil (${prevDevice}) pour réactivation sur un autre téléphone`
  );

  res.json({
    success: true,
    license: licenses[index],
    message: `Appareil (${prevDevice}) délié avec succès. Cette licence peut maintenant être activée sur un autre téléphone.`,
  });
});

app.delete('/api/admin/licenses/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const success = deleteLicenseFromDb(id, 'ADMIN');

  if (!success) {
    return res.status(404).json({ error: 'Licence introuvable.' });
  }

  res.json({ success: true, message: 'Licence supprimée de Google Cloud Firestore avec succès.' });
});

// Endpoint de synchronisation de sauvegarde maître depuis le panneau d'administration
app.post('/api/admin/licenses/sync', requireAdmin, (req, res) => {
  const { licenses: incomingLicenses } = req.body;
  if (!Array.isArray(incomingLicenses) || incomingLicenses.length === 0) {
    return res.status(400).json({ success: false, message: 'Liste de licences fournie invalide.' });
  }

  const current = loadLicenses();
  const currentMap = new Map(current.map((l) => [l.id, l]));

  // Merge incoming licenses with current, giving precedence to incoming admin data
  for (const lic of incomingLicenses) {
    if (lic && lic.id && lic.licenseKey) {
      const existing = currentMap.get(lic.id);
      currentMap.set(lic.id, {
        ...(existing || {}),
        ...lic,
      });
    }
  }

  const merged = Array.from(currentMap.values());
  saveLicenses(merged);

  res.json({
    success: true,
    licenses: merged,
    message: `${merged.length} licences synchronisées et sauvegardées avec succès sur le serveur.`,
  });
});

// All unhandled /api/* routes MUST return JSON, NEVER fall through to HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint API introuvable', valid: false });
});

// ----------------------------------------------------
// Vite Middleware / Static Serving
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
