import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Vehicle, FuelLog, MaintenanceRecord, VehicleDocument, TabType, AppNotification, License, LicenseStatus } from './types';
import { 
  INITIAL_VEHICLE, 
  INITIAL_FUEL_LOGS, 
  INITIAL_MAINTENANCE_RECORDS, 
  INITIAL_DOCUMENTS 
} from './data/initialData';
import { generateAppNotifications } from './utils/calculations';

import { AndroidFrame } from './components/AndroidFrame';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SpeedDialFAB } from './components/SpeedDialFAB';

import { DashboardTab } from './components/DashboardTab';
import { FuelTab } from './components/FuelTab';
import { MaintenanceTab } from './components/MaintenanceTab';
import { DocumentsTab } from './components/DocumentsTab';
import { StatsTab } from './components/StatsTab';

import { MileageModal } from './components/MileageModal';
import { AlertsModal } from './components/AlertsModal';
import { AddFuelModal } from './components/AddFuelModal';
import { AddMaintenanceModal } from './components/AddMaintenanceModal';
import { AddDocumentModal } from './components/AddDocumentModal';
import { VehicleModal } from './components/VehicleModal';
import { OfflineIndicator } from './components/OfflineIndicator';

import { 
  loadAllFromLocalDB, 
  saveVehicleToDB, 
  saveFuelLogsToDB, 
  saveMaintenanceToDB, 
  saveDocumentsToDB,
  setMetaKey,
  getMetaKey,
  requestPersistentStorage
} from './services/localDatabase';

import { 
  verifyLicense, 
  activateLicense, 
  renewLicense, 
  LS_LICENSE_KEY, 
  DEFAULT_LICENSE_KEY,
  getOrCreateDeviceId,
  hasInstalledLicenseOnDevice,
  uninstallLicenseFromDevice,
  LICENSE_CHECK_INTERVAL_MS,
} from './services/licenseService';
import { LicenseLockModal } from './components/LicenseLockModal';
import { LicenseDetailsModal } from './components/LicenseDetailsModal';
import { AdminLicensesView } from './components/AdminLicensesView';
import { PullToRefresh } from './components/PullToRefresh';

// Clés de persistance LocalStorage
const LS_VEHICLE = 'autogestion_vehicle';
const LS_FUEL = 'autogestion_fuel_logs';
const LS_MAINT = 'autogestion_maint_records';
const LS_DOCS = 'autogestion_documents';
const LS_CACHED_LICENSE = 'autogestion_cached_license_data';
const LS_ACTIVE_TAB = 'autogestion_active_tab';

/**
 * Helper de récupération des données de licence mises en cache
 */
function getCachedLicenseData() {
  try {
    const cached = localStorage.getItem(LS_CACHED_LICENSE);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    const myDeviceId = getOrCreateDeviceId();
    if (!parsed.deviceId || parsed.deviceId === myDeviceId) {
      if (parsed.license?.expiresAt) {
        const isExp = new Date(parsed.license.expiresAt).getTime() <= Date.now();
        if (isExp) {
          parsed.valid = false;
          parsed.status = 'expired';
          parsed.daysRemaining = 0;
        } else {
          const diffDays = Math.ceil((new Date(parsed.license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          parsed.valid = true;
          parsed.status = diffDays <= 30 ? 'expiring_soon' : 'active';
          parsed.daysRemaining = diffDays;
        }
      }
      return parsed;
    }
  } catch {
    // Ignorer les erreurs de JSON malformé
  }
  return null;
}

export default function App() {
  // Licence State (Verrouillage strict par appareil)
  const [licenseKey, setLicenseKey] = useState<string>(() => {
    return localStorage.getItem(LS_LICENSE_KEY) || DEFAULT_LICENSE_KEY;
  });

  const [currentLicense, setCurrentLicense] = useState<License | null>(() => {
    const cached = getCachedLicenseData();
    return cached && cached.valid ? cached.license : null;
  });

  const [licenseDaysRemaining, setLicenseDaysRemaining] = useState<number>(() => {
    const cached = getCachedLicenseData();
    return cached && cached.valid && typeof cached.daysRemaining === 'number' ? cached.daysRemaining : 365;
  });

  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>(() => {
    const cached = getCachedLicenseData();
    return cached && cached.status ? cached.status : 'active';
  });

  const [licenseMessage, setLicenseMessage] = useState<string>('Vérification de la licence...');

  const [hasInstalledLicense, setHasInstalledLicense] = useState<boolean>(() => {
    return hasInstalledLicenseOnDevice();
  });

  const [isLicenseLocked, setIsLicenseLocked] = useState<boolean>(() => {
    const cached = getCachedLicenseData();
    if (cached) {
      return !(cached.valid && cached.daysRemaining > 0);
    }
    // Par défaut, ne pas bloquer avant la première vérification serveur
    return false;
  });

  const [isLicenseDetailsOpen, setIsLicenseDetailsOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Initialisation des données véhicule et historique
  const [vehicle, setVehicle] = useState<Vehicle>(() => {
    const saved = localStorage.getItem(LS_VEHICLE);
    if (!saved) return INITIAL_VEHICLE;
    try {
      const v = JSON.parse(saved);
      if (v.licensePlate === 'FX-842-ZP') {
        return {
          ...v,
          licensePlate: '01245-121-16',
          insuranceCompany: 'SAA Assurances',
          insurancePolicyNumber: 'SAA-78942-AUTO',
          emergencyPhone: '021 60 40 20',
        };
      }
      return v;
    } catch {
      return INITIAL_VEHICLE;
    }
  });

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => {
    const saved = localStorage.getItem(LS_FUEL);
    return saved ? JSON.parse(saved) : INITIAL_FUEL_LOGS;
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem(LS_MAINT);
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_RECORDS;
  });

  const [documents, setDocuments] = useState<VehicleDocument[]>(() => {
    const saved = localStorage.getItem(LS_DOCS);
    if (!saved) return INITIAL_DOCUMENTS;
    try {
      const docs = JSON.parse(saved) as VehicleDocument[];
      return docs.map((doc) => {
        if (doc.title.includes("Crit'Air")) {
          return {
            ...doc,
            title: 'Vignette Automobile Annuelle',
            provider: 'Direction Générale des Impôts (DGI)',
            notes: 'Quittance et macaron officiel apposé sur le pare-brise avant droit.',
          };
        }
        if (doc.provider === 'Dekra Automotive') {
          return {
            ...doc,
            title: 'Contrôle Technique Périodique (ENACTA)',
            provider: 'Centre Agréé ENACTA',
            notes: 'Centre agréé national. Penser à prendre rendez-vous pour le contrôle annuel.',
          };
        }
        if (doc.provider === "ANTS Ministère de l'Intérieur") {
          return {
            ...doc,
            provider: "Daïra / Ministère de l'Intérieur",
          };
        }
        if (doc.title.includes('Carte Européenne')) {
          return {
            ...doc,
            title: 'Permis de Conduire Biométrique',
            provider: "Daïra / Ministère de l'Intérieur",
            notes: 'Permis de conduire biométrique à points national.',
          };
        }
        return doc;
      });
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem(LS_ACTIVE_TAB) as TabType | null;
      if (saved && ['dashboard', 'carburant', 'entretien', 'documents', 'statistiques'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'dashboard';
  });

  const handleNavigateTab = (tab: TabType) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(LS_ACTIVE_TAB, tab);
    } catch {}
  };

  // État des fenêtres modales
  const [isMileageModalOpen, setIsMileageModalOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isAddFuelOpen, setIsAddFuelOpen] = useState<boolean>(false);
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState<boolean>(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState<boolean>(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);

  // Édition des enregistrements
  const [editingFuelLog, setEditingFuelLog] = useState<FuelLog | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);
  const [editingDocument, setEditingDocument] = useState<VehicleDocument | null>(null);

  // Indicateur de chargement initial de la base de données locale
  const isInitialLocalDbLoadDone = useRef<boolean>(false);
  const verificationReqIdRef = useRef<number>(0);

  // Vérification de la licence auprès du serveur
  const checkLicenseVerification = useCallback(async (keyToCheck?: string) => {
    const currentReqId = ++verificationReqIdRef.current;
    try {
      const activeKey = (keyToCheck !== undefined ? keyToCheck : (licenseKey || DEFAULT_LICENSE_KEY)).trim();
      if (!activeKey) {
        setIsLicenseLocked(true);
        setLicenseStatus('pending');
        setLicenseMessage('Veuillez activer une clé de licence pour cet appareil.');
        setCurrentLicense(null);
        return;
      }

      const result = await verifyLicense(activeKey, vehicle.licensePlate);
      if (currentReqId !== verificationReqIdRef.current) return;

      setLicenseDaysRemaining(result.daysRemaining);
      setLicenseStatus(result.status);

      if (typeof result.hasInstalledLicense === 'boolean') {
        setHasInstalledLicense(result.hasInstalledLicense);
      } else {
        setHasInstalledLicense(hasInstalledLicenseOnDevice());
      }

      if (result.valid) {
        if (result.license) {
          setCurrentLicense(result.license);
        }
        setIsLicenseLocked(false);
        setLicenseMessage('');
        if (result.license?.licenseKey && result.license.licenseKey !== licenseKey) {
          setLicenseKey(result.license.licenseKey);
          localStorage.setItem(LS_LICENSE_KEY, result.license.licenseKey);
          setMetaKey('active_license_key', result.license.licenseKey).catch(() => {});
        }
      } else {
        // Only lock if status is truly revoked/device_mismatch OR if expiration date is actually passed
        const cached = getCachedLicenseData();
        const hasValidFutureDate = Boolean(cached?.expiresAt && new Date(cached.expiresAt).getTime() > Date.now());

        if (hasValidFutureDate && result.status !== 'revoked' && result.status !== 'device_mismatch') {
          // Keep app active in offline grace mode
          setIsLicenseLocked(false);
          if (result.license) setCurrentLicense(result.license);
        } else {
          setCurrentLicense(result.license || null);
          setIsLicenseLocked(true);
          setIsLicenseDetailsOpen(false);
          setLicenseMessage(result.message);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification de licence :', err);
    }
  }, [vehicle.licensePlate, licenseKey]);

  // Chargement des données IndexedDB au démarrage
  useEffect(() => {
    let isMounted = true;

    async function initializeFromLocalDB() {
      try {
        await requestPersistentStorage();
        const localData = await loadAllFromLocalDB();
        if (!isMounted) return;

        if (localData.vehicle) {
          setVehicle(localData.vehicle);
          localStorage.setItem(LS_VEHICLE, JSON.stringify(localData.vehicle));
        }
        if (Array.isArray(localData.fuelLogs)) {
          setFuelLogs(localData.fuelLogs);
          localStorage.setItem(LS_FUEL, JSON.stringify(localData.fuelLogs));
        }
        if (Array.isArray(localData.maintenanceRecords)) {
          setMaintenanceRecords(localData.maintenanceRecords);
          localStorage.setItem(LS_MAINT, JSON.stringify(localData.maintenanceRecords));
        }
        if (Array.isArray(localData.documents)) {
          setDocuments(localData.documents);
          localStorage.setItem(LS_DOCS, JSON.stringify(localData.documents));
        }

        const savedKey = await getMetaKey<string>('active_license_key');
        if (savedKey && isMounted) {
          setLicenseKey(savedKey);
          localStorage.setItem(LS_LICENSE_KEY, savedKey);
        }
        const savedCachedLicense = await getMetaKey<License>('cached_license_data');
        if (savedCachedLicense && isMounted) {
          setCurrentLicense(savedCachedLicense);
        }
      } catch (err) {
        console.warn('Erreur lors de l’initialisation IndexedDB :', err);
      } finally {
        if (isMounted) {
          isInitialLocalDbLoadDone.current = true;
        }
      }
    }

    initializeFromLocalDB();

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronisation avec IndexedDB & LocalStorage à chaque modification
  useEffect(() => {
    localStorage.setItem(LS_VEHICLE, JSON.stringify(vehicle));
    if (isInitialLocalDbLoadDone.current) {
      saveVehicleToDB(vehicle);
    }
  }, [vehicle]);

  useEffect(() => {
    localStorage.setItem(LS_FUEL, JSON.stringify(fuelLogs));
    if (isInitialLocalDbLoadDone.current) {
      saveFuelLogsToDB(fuelLogs);
    }
  }, [fuelLogs]);

  useEffect(() => {
    localStorage.setItem(LS_MAINT, JSON.stringify(maintenanceRecords));
    if (isInitialLocalDbLoadDone.current) {
      saveMaintenanceToDB(maintenanceRecords);
    }
  }, [maintenanceRecords]);

  useEffect(() => {
    localStorage.setItem(LS_DOCS, JSON.stringify(documents));
    if (isInitialLocalDbLoadDone.current) {
      saveDocumentsToDB(documents);
    }
  }, [documents]);

  const handleReloadLocalData = useCallback(async () => {
    try {
      const localData = await loadAllFromLocalDB();
      if (localData.vehicle) setVehicle(localData.vehicle);
      if (Array.isArray(localData.fuelLogs)) setFuelLogs(localData.fuelLogs);
      if (Array.isArray(localData.maintenanceRecords)) setMaintenanceRecords(localData.maintenanceRecords);
      if (Array.isArray(localData.documents)) setDocuments(localData.documents);
    } catch (err) {
      console.error('Erreur lors du rechargement des données locales :', err);
    }
  }, []);

  // Vérification de la licence installée : au démarrage, chaque 10 minutes et lors des reconnexions
  useEffect(() => {
    // 1. Vérification immédiate au montage ou au changement de clé
    checkLicenseVerification(licenseKey);

    // 2. Vérification automatique périodique chaque 10 minutes (600 000 ms)
    const intervalId = setInterval(() => {
      checkLicenseVerification(licenseKey);
    }, LICENSE_CHECK_INTERVAL_MS);

    // 3. Re-vérification lors du retour de la connexion réseau
    const handleOnline = () => {
      checkLicenseVerification(licenseKey);
    };

    // 4. Re-vérification lors du retour sur l'onglet/application
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkLicenseVerification(licenseKey);
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [licenseKey, checkLicenseVerification]);

  const handleActivateLicenseKey = async (newKey: string): Promise<{ success: boolean; message: string; isUsedConflict?: boolean }> => {
    const res = await activateLicense(newKey, vehicle.licensePlate, 'Rachid F.');
    if (res.success && res.license) {
      setLicenseKey(newKey);
      localStorage.setItem(LS_LICENSE_KEY, newKey);
      setMetaKey('active_license_key', newKey).catch(() => {});
      setCurrentLicense(res.license);
      setHasInstalledLicense(true);
      setIsLicenseLocked(false);
      await checkLicenseVerification(newKey);
      return { success: true, message: res.message };
    }

    const isConflict =
      (res as any).code === 'device_mismatch' ||
      (res as any).alreadyUsed === true ||
      res.message?.toLowerCase().includes('autre') ||
      res.message?.toLowerCase().includes('verrouillée') ||
      res.message?.toLowerCase().includes('déjà activée') ||
      res.message?.toLowerCase().includes('déjà utilisée');

    if (isConflict) {
      setLicenseStatus('device_mismatch');
    }
    return {
      success: false,
      message: res.message || 'Clé de licence invalide ou expirée.',
      isUsedConflict: isConflict,
    };
  };

  const handleRemoveLicenseFromDevice = useCallback(() => {
    uninstallLicenseFromDevice();
    setLicenseKey('');
    setCurrentLicense(null);
    setHasInstalledLicense(false);
    setLicenseDaysRemaining(0);
    setLicenseStatus('pending');
    setLicenseMessage('Aucune licence installée sur ce téléphone. Veuillez saisir votre clé de licence.');
    setIsLicenseLocked(true);
    setIsLicenseDetailsOpen(false);
  }, []);

  const handleSetActiveLicense = async (newKey: string) => {
    setLicenseKey(newKey);
    localStorage.setItem(LS_LICENSE_KEY, newKey);
    setMetaKey('active_license_key', newKey).catch(() => {});
    await checkLicenseVerification(newKey);
  };

  const handleRenewLicenseDirect = async (code?: string): Promise<boolean> => {
    const res = await renewLicense(licenseKey, code, vehicle.licensePlate);
    if (res.success) {
      await checkLicenseVerification(licenseKey);
      return true;
    }
    return false;
  };

  // Calcul des notifications de l'application
  const baseNotifications = generateAppNotifications(vehicle, documents, maintenanceRecords);
  const licenseNotification: AppNotification | null =
    licenseDaysRemaining <= 15 && licenseDaysRemaining > 0 && licenseStatus === 'expiring_soon'
      ? {
          id: 'notif-license-expiry',
          type: 'license_expiry',
          title: 'Licence Annuelle',
          message: `Votre licence AutoGestion expire dans ${licenseDaysRemaining} jour(s). Pensez à renouveler pour 1 an.`,
          severity: licenseDaysRemaining <= 7 ? 'urgent' : 'warning',
          targetTab: 'statistiques',
        }
      : null;

  const notifications = [
    ...(licenseNotification ? [licenseNotification] : []),
    ...baseNotifications,
  ];

  // Handlers Métier
  const handleUpdateMileage = (newMileage: number) => {
    setVehicle((prev) => ({ ...prev, currentMileage: newMileage }));
  };

  const handleOpenAddFuel = () => {
    setEditingFuelLog(null);
    setIsAddFuelOpen(true);
  };

  const handleOpenEditFuelLog = (log: FuelLog) => {
    setEditingFuelLog(log);
    setIsAddFuelOpen(true);
  };

  const handleAddFuel = (newLog: Omit<FuelLog, 'id'>) => {
    const log: FuelLog = {
      ...newLog,
      id: `fuel-${Date.now()}`,
    };
    setFuelLogs((prev) => [log, ...prev]);

    if (newLog.mileage > vehicle.currentMileage) {
      setVehicle((prev) => ({ ...prev, currentMileage: newLog.mileage }));
    }
  };

  const handleUpdateFuelLog = (updated: FuelLog) => {
    setFuelLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    if (updated.mileage > vehicle.currentMileage) {
      setVehicle((prev) => ({ ...prev, currentMileage: updated.mileage }));
    }
  };

  const handleDeleteFuelLog = (id: string) => {
    setFuelLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleOpenAddMaintenance = () => {
    setEditingMaintenance(null);
    setIsAddMaintenanceOpen(true);
  };

  const handleOpenEditMaintenance = (record: MaintenanceRecord) => {
    setEditingMaintenance(record);
    setIsAddMaintenanceOpen(true);
  };

  const handleAddMaintenance = (newMaint: Omit<MaintenanceRecord, 'id'>) => {
    const record: MaintenanceRecord = {
      ...newMaint,
      id: `maint-${Date.now()}`,
    };
    setMaintenanceRecords((prev) => [record, ...prev]);

    if (newMaint.mileage > vehicle.currentMileage) {
      setVehicle((prev) => ({ ...prev, currentMileage: newMaint.mileage }));
    }
  };

  const handleUpdateMaintenance = (updated: MaintenanceRecord) => {
    setMaintenanceRecords((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    if (updated.mileage > vehicle.currentMileage) {
      setVehicle((prev) => ({ ...prev, currentMileage: updated.mileage }));
    }
  };

  const handleDeleteMaintenance = (id: string) => {
    setMaintenanceRecords((prev) => prev.filter((m) => m.id !== id));
  };

  const handleOpenAddDocument = () => {
    setEditingDocument(null);
    setIsAddDocumentOpen(true);
  };

  const handleOpenEditDocument = (doc: VehicleDocument) => {
    setEditingDocument(doc);
    setIsAddDocumentOpen(true);
  };

  const handleAddDocument = (newDoc: Omit<VehicleDocument, 'id'>) => {
    const doc: VehicleDocument = {
      ...newDoc,
      id: `doc-${Date.now()}`,
    };
    setDocuments((prev) => [doc, ...prev]);
  };

  const handleUpdateDocument = (updated: VehicleDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateVehicle = (updated: Vehicle) => {
    setVehicle(updated);
  };

  const handleExportData = () => {
    const fullBackup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      vehicle,
      fuelLogs,
      maintenanceRecords,
      documents,
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autogestion-backup-${vehicle.licensePlate || 'vehicule'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (data: any) => {
    if (data.vehicle && Array.isArray(data.fuelLogs) && Array.isArray(data.documents)) {
      setVehicle(data.vehicle);
      setFuelLogs(data.fuelLogs);
      setMaintenanceRecords(data.maintenanceRecords || []);
      setDocuments(data.documents);
      alert('Données importées avec succès !');
    } else {
      alert('Format de fichier de sauvegarde invalide.');
    }
  };

  const handleResetDemoData = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données avec le profil de démonstration ?')) {
      setVehicle(INITIAL_VEHICLE);
      setFuelLogs(INITIAL_FUEL_LOGS);
      setMaintenanceRecords(INITIAL_MAINTENANCE_RECORDS);
      setDocuments(INITIAL_DOCUMENTS);
    }
  };

  const handlePullRefresh = async () => {
    try {
      localStorage.setItem(LS_ACTIVE_TAB, activeTab);
      // Synchroniser les données locales et vérifier la licence avec le serveur
      await Promise.allSettled([
        checkLicenseVerification(licenseKey),
        handleReloadLocalData(),
      ]);
    } catch (err) {
      console.error('Erreur rafraîchissement:', err);
    }

    // Brève temporisation pour laisser le temps d'observer le retour visuel
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Recharger la page web
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <AndroidFrame>
      {isAdminOpen ? (
        <AdminLicensesView
          onBackToApp={() => setIsAdminOpen(false)}
          onRefreshClientLicense={() => checkLicenseVerification(licenseKey)}
          currentActiveKey={licenseKey}
          onSetActiveLicense={handleSetActiveLicense}
        />
      ) : (
        <>
          <Header
            vehicle={vehicle}
            notifications={notifications}
            license={currentLicense}
            daysRemaining={licenseDaysRemaining}
            onOpenNotifications={() => setIsAlertsModalOpen(true)}
            onOpenMileageModal={() => setIsMileageModalOpen(true)}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
            onOpenLicenseModal={() => setIsLicenseDetailsOpen(true)}
          />

          <OfflineIndicator />

          <PullToRefresh onRefresh={handlePullRefresh}>
            <main className="flex-1 flex flex-col overflow-hidden relative min-h-0 w-full">
              {activeTab === 'dashboard' && (
                <DashboardTab
                  vehicle={vehicle}
                  fuelLogs={fuelLogs}
                  maintenanceRecords={maintenanceRecords}
                  documents={documents}
                  notifications={notifications}
                  onNavigateTab={handleNavigateTab}
                  onOpenAddFuel={handleOpenAddFuel}
                  onOpenAddMaintenance={handleOpenAddMaintenance}
                  onOpenAddDocument={handleOpenAddDocument}
                  onOpenMileageModal={() => setIsMileageModalOpen(true)}
                  onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
                />
              )}

              {activeTab === 'carburant' && (
                <FuelTab
                  fuelLogs={fuelLogs}
                  onOpenAddFuel={handleOpenAddFuel}
                  onEditFuelLog={handleOpenEditFuelLog}
                  onDeleteFuelLog={handleDeleteFuelLog}
                />
              )}

              {activeTab === 'entretien' && (
                <MaintenanceTab
                  maintenanceRecords={maintenanceRecords}
                  currentMileage={vehicle.currentMileage}
                  onOpenAddMaintenance={handleOpenAddMaintenance}
                  onEditMaintenance={handleOpenEditMaintenance}
                  onDeleteMaintenance={handleDeleteMaintenance}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentsTab
                  documents={documents}
                  onOpenAddDocument={handleOpenAddDocument}
                  onEditDocument={handleOpenEditDocument}
                  onDeleteDocument={handleDeleteDocument}
                />
              )}

              {activeTab === 'statistiques' && (
                <StatsTab
                  vehicle={vehicle}
                  fuelLogs={fuelLogs}
                  maintenanceRecords={maintenanceRecords}
                  documents={documents}
                  onExportData={handleExportData}
                  onImportData={handleImportData}
                  onResetDemoData={handleResetDemoData}
                  onOpenLicense={() => setIsLicenseDetailsOpen(true)}
                  onOpenAdmin={() => setIsAdminOpen(true)}
                  licenseDaysRemaining={licenseDaysRemaining}
                  licenseStatus={licenseStatus}
                  onRefreshLicense={() => checkLicenseVerification(licenseKey)}
                />
              )}

              <SpeedDialFAB
                onAddFuel={handleOpenAddFuel}
                onAddMaintenance={handleOpenAddMaintenance}
                onAddDocument={handleOpenAddDocument}
                onUpdateMileage={() => setIsMileageModalOpen(true)}
              />
            </main>
          </PullToRefresh>

          <BottomNav
            activeTab={activeTab}
            onChangeTab={handleNavigateTab}
            notifications={notifications}
          />
        </>
      )}

      {/* Fenêtres Modales */}
      <MileageModal
        isOpen={isMileageModalOpen}
        onClose={() => setIsMileageModalOpen(false)}
        currentMileage={vehicle.currentMileage}
        onSave={handleUpdateMileage}
      />

      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        notifications={notifications}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      <AddFuelModal
        isOpen={isAddFuelOpen}
        onClose={() => {
          setIsAddFuelOpen(false);
          setEditingFuelLog(null);
        }}
        currentMileage={vehicle.currentMileage}
        vehicleFuelType={vehicle.fuelType}
        onAddFuel={handleAddFuel}
        onUpdateFuel={handleUpdateFuelLog}
        editingLog={editingFuelLog}
      />

      <AddMaintenanceModal
        isOpen={isAddMaintenanceOpen}
        onClose={() => {
          setIsAddMaintenanceOpen(false);
          setEditingMaintenance(null);
        }}
        currentMileage={vehicle.currentMileage}
        onAddMaintenance={handleAddMaintenance}
        onUpdateMaintenance={handleUpdateMaintenance}
        editingRecord={editingMaintenance}
      />

      <AddDocumentModal
        isOpen={isAddDocumentOpen}
        onClose={() => {
          setIsAddDocumentOpen(false);
          setEditingDocument(null);
        }}
        onAddDocument={handleAddDocument}
        onUpdateDocument={handleUpdateDocument}
        editingDoc={editingDocument}
      />

      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        vehicle={vehicle}
        onSave={handleUpdateVehicle}
        onDataReloaded={handleReloadLocalData}
      />

      <LicenseDetailsModal
        isOpen={isLicenseDetailsOpen}
        onClose={() => setIsLicenseDetailsOpen(false)}
        license={currentLicense}
        daysRemaining={licenseDaysRemaining}
        vehiclePlate={vehicle.licensePlate}
        onRenew={handleRenewLicenseDirect}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onRefresh={() => checkLicenseVerification(licenseKey)}
        onActivate={handleActivateLicenseKey}
        onRemoveLicense={handleRemoveLicenseFromDevice}
      />

      <LicenseLockModal
        isOpen={isLicenseLocked && !isAdminOpen}
        currentLicense={currentLicense}
        hasInstalledLicense={hasInstalledLicense}
        installedLicenseKey={licenseKey}
        daysRemaining={licenseDaysRemaining}
        vehiclePlate={vehicle.licensePlate}
        status={licenseStatus}
        message={licenseMessage}
        onActivate={handleActivateLicenseKey}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onRemoveLicense={handleRemoveLicenseFromDevice}
      />
    </AndroidFrame>
  );
}