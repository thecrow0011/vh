import { Vehicle, FuelLog, MaintenanceRecord, VehicleDocument } from '../types';
import { INITIAL_VEHICLE, INITIAL_FUEL_LOGS, INITIAL_MAINTENANCE_RECORDS, INITIAL_DOCUMENTS } from '../data/initialData';

const DB_NAME = 'AutoGestion_LocalDB';
const DB_VERSION = 1;

const STORES = {
  VEHICLE: 'vehicle',
  FUEL_LOGS: 'fuel_logs',
  MAINTENANCE: 'maintenance_records',
  DOCUMENTS: 'documents',
  META: 'meta',
};

// Open and initialize the IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non supporté par ce navigateur.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.VEHICLE)) {
        db.createObjectStore(STORES.VEHICLE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.FUEL_LOGS)) {
        const fuelStore = db.createObjectStore(STORES.FUEL_LOGS, { keyPath: 'id' });
        fuelStore.createIndex('date', 'date', { unique: false });
        fuelStore.createIndex('mileage', 'mileage', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MAINTENANCE)) {
        const maintStore = db.createObjectStore(STORES.MAINTENANCE, { keyPath: 'id' });
        maintStore.createIndex('date', 'date', { unique: false });
        maintStore.createIndex('mileage', 'mileage', { unique: false });
        maintStore.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
        const docStore = db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('type', 'type', { unique: false });
        docStore.createIndex('expiryDate', 'expiryDate', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Erreur ouverture IndexedDB'));
    };
  });
}

// Request persistent storage from the browser so IndexedDB is never wiped on cache clear
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log('Stockage persistant IndexedDB accordé:', isPersisted);
      return isPersisted;
    }
  } catch (err) {
    console.warn('Impossible de demander le stockage persistant:', err);
  }
  return false;
}

// Generic transaction helper
async function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    let req: IDBRequest<T> | void;
    try {
      req = callback(store);
    } catch (e) {
      reject(e);
      return;
    }

    tx.oncomplete = () => {
      if (req && 'result' in req) {
        resolve(req.result);
      } else {
        resolve(undefined as unknown as T);
      }
    };

    tx.onerror = () => {
      reject(tx.error);
    };

    tx.onabort = () => {
      reject(new Error('Transaction IndexedDB interrompue.'));
    };
  });
}

// =================================================================
// VEHICLE OPERATIONS
// =================================================================

export async function saveVehicleToDB(vehicle: Vehicle): Promise<void> {
  try {
    await runTransaction(STORES.VEHICLE, 'readwrite', (store) => {
      store.put(vehicle);
    });
    await setMetaKey('has_user_data', true);
    await setMetaKey('last_saved_vehicle', new Date().toISOString());
  } catch (err) {
    console.error('Erreur sauvegarde véhicule dans IndexedDB:', err);
  }
}

export async function getVehicleFromDB(): Promise<Vehicle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.VEHICLE, 'readonly');
      const store = tx.objectStore(STORES.VEHICLE);
      const req = store.openCursor();

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          resolve(cursor.value as Vehicle);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// =================================================================
// FUEL LOGS OPERATIONS
// =================================================================

export async function saveFuelLogsToDB(logs: FuelLog[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.FUEL_LOGS, 'readwrite');
      const store = tx.objectStore(STORES.FUEL_LOGS);
      store.clear();
      for (const log of logs) {
        store.put(log);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await setMetaKey('last_saved_fuel', new Date().toISOString());
  } catch (err) {
    console.error('Erreur sauvegarde carburant dans IndexedDB:', err);
  }
}

export async function getFuelLogsFromDB(): Promise<FuelLog[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.FUEL_LOGS, 'readonly');
      const store = tx.objectStore(STORES.FUEL_LOGS);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve(req.result && req.result.length > 0 ? (req.result as FuelLog[]) : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// =================================================================
// MAINTENANCE RECORDS OPERATIONS
// =================================================================

export async function saveMaintenanceToDB(records: MaintenanceRecord[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.MAINTENANCE, 'readwrite');
      const store = tx.objectStore(STORES.MAINTENANCE);
      store.clear();
      for (const rec of records) {
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await setMetaKey('last_saved_maintenance', new Date().toISOString());
  } catch (err) {
    console.error('Erreur sauvegarde entretien dans IndexedDB:', err);
  }
}

export async function getMaintenanceFromDB(): Promise<MaintenanceRecord[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.MAINTENANCE, 'readonly');
      const store = tx.objectStore(STORES.MAINTENANCE);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve(req.result && req.result.length > 0 ? (req.result as MaintenanceRecord[]) : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// =================================================================
// DOCUMENTS OPERATIONS
// =================================================================

export async function saveDocumentsToDB(documents: VehicleDocument[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.DOCUMENTS, 'readwrite');
      const store = tx.objectStore(STORES.DOCUMENTS);
      store.clear();
      for (const doc of documents) {
        store.put(doc);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await setMetaKey('last_saved_documents', new Date().toISOString());
  } catch (err) {
    console.error('Erreur sauvegarde documents dans IndexedDB:', err);
  }
}

export async function getDocumentsFromDB(): Promise<VehicleDocument[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.DOCUMENTS, 'readonly');
      const store = tx.objectStore(STORES.DOCUMENTS);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve(req.result && req.result.length > 0 ? (req.result as VehicleDocument[]) : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// =================================================================
// META & SETTINGS
// =================================================================

export async function setMetaKey(key: string, value: any): Promise<void> {
  try {
    await runTransaction(STORES.META, 'readwrite', (store) => {
      store.put({ key, value, updatedAt: new Date().toISOString() });
    });
  } catch (err) {
    console.warn('Erreur méta IndexedDB:', err);
  }
}

export async function getMetaKey<T>(key: string): Promise<T | null> {
  try {
    const res = await runTransaction<{ key: string; value: T }>(STORES.META, 'readonly', (store) => {
      return store.get(key);
    });
    return res ? res.value : null;
  } catch {
    return null;
  }
}

// =================================================================
// COMPLETE LOCAL DATABASE INITIALIZATION & RESTORATION
// =================================================================

export interface LocalAppData {
  vehicle: Vehicle;
  fuelLogs: FuelLog[];
  maintenanceRecords: MaintenanceRecord[];
  documents: VehicleDocument[];
  isFromDB: boolean;
}

/**
 * Loads all data from the local IndexedDB database.
 * If IndexedDB is empty (first ever launch), falls back to localStorage or initial demo data.
 * Once loaded, subsequent changes are reliably stored in IndexedDB and never wiped on browser refresh or cache clear.
 */
export async function loadAllFromLocalDB(): Promise<LocalAppData> {
  await requestPersistentStorage();

  const [dbVehicle, dbFuel, dbMaint, dbDocs] = await Promise.all([
    getVehicleFromDB(),
    getFuelLogsFromDB(),
    getMaintenanceFromDB(),
    getDocumentsFromDB(),
  ]);

  if (dbVehicle || dbFuel || dbMaint || dbDocs) {
    return {
      vehicle: dbVehicle || INITIAL_VEHICLE,
      fuelLogs: dbFuel || [],
      maintenanceRecords: dbMaint || [],
      documents: dbDocs || [],
      isFromDB: true,
    };
  }

  // If IndexedDB had nothing, check localStorage as fallback before resorting to defaults
  let vehicle = INITIAL_VEHICLE;
  let fuelLogs = INITIAL_FUEL_LOGS;
  let maintenanceRecords = INITIAL_MAINTENANCE_RECORDS;
  let documents = INITIAL_DOCUMENTS;

  try {
    const lsVeh = localStorage.getItem('autogestion_vehicle');
    if (lsVeh) vehicle = JSON.parse(lsVeh);
    const lsFuel = localStorage.getItem('autogestion_fuel_logs');
    if (lsFuel) fuelLogs = JSON.parse(lsFuel);
    const lsMaint = localStorage.getItem('autogestion_maintenance');
    if (lsMaint) maintenanceRecords = JSON.parse(lsMaint);
    const lsDocs = localStorage.getItem('autogestion_documents');
    if (lsDocs) documents = JSON.parse(lsDocs);
  } catch (err) {
    console.warn('Erreur lecture localStorage:', err);
  }

  // Seed into IndexedDB so it's permanently stored locally
  await Promise.all([
    saveVehicleToDB(vehicle),
    saveFuelLogsToDB(fuelLogs),
    saveMaintenanceToDB(maintenanceRecords),
    saveDocumentsToDB(documents),
  ]);

  return {
    vehicle,
    fuelLogs,
    maintenanceRecords,
    documents,
    isFromDB: false,
  };
}

// =================================================================
// BACKUP & RESTORE UTILITIES (JSON FILE EXPORT/IMPORT)
// =================================================================

export async function exportDatabaseBackup(): Promise<string> {
  const [vehicle, fuelLogs, maintenanceRecords, documents] = await Promise.all([
    getVehicleFromDB(),
    getFuelLogsFromDB(),
    getMaintenanceFromDB(),
    getDocumentsFromDB(),
  ]);

  const payload = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    app: 'AutoGestion DZ',
    data: {
      vehicle: vehicle || INITIAL_VEHICLE,
      fuelLogs: fuelLogs || [],
      maintenanceRecords: maintenanceRecords || [],
      documents: documents || [],
    },
  };

  return JSON.stringify(payload, null, 2);
}

export async function importDatabaseBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    const data = parsed.data || parsed;

    if (!data.vehicle) {
      return { success: false, message: 'Format de fichier de sauvegarde invalide (véhicule manquant).' };
    }

    if (data.vehicle) await saveVehicleToDB(data.vehicle);
    if (Array.isArray(data.fuelLogs)) await saveFuelLogsToDB(data.fuelLogs);
    if (Array.isArray(data.maintenanceRecords)) await saveMaintenanceToDB(data.maintenanceRecords);
    if (Array.isArray(data.documents)) await saveDocumentsToDB(data.documents);

    // Also update localStorage
    try {
      if (data.vehicle) localStorage.setItem('autogestion_vehicle', JSON.stringify(data.vehicle));
      if (data.fuelLogs) localStorage.setItem('autogestion_fuel_logs', JSON.stringify(data.fuelLogs));
      if (data.maintenanceRecords) localStorage.setItem('autogestion_maintenance', JSON.stringify(data.maintenanceRecords));
      if (data.documents) localStorage.setItem('autogestion_documents', JSON.stringify(data.documents));
    } catch {}

    return { success: true, message: 'Base de données locale restaurée avec succès !' };
  } catch (err: any) {
    return { success: false, message: `Erreur lors de l'importation: ${err?.message || 'Fichier non lisible'}` };
  }
}
