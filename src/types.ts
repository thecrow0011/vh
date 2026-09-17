export type FuelType = 'essence' | 'diesel' | 'hybride' | 'electrique' | 'gpl' | 'e85';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  licensePlate: string;
  vin: string;
  fuelType: FuelType;
  tankCapacity: number; // in Liters or kWh
  currentMileage: number; // in km
  purchaseDate: string;
  color: string;
  insuranceCompany: string;
  insurancePolicyNumber?: string;
  emergencyPhone?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  mileage: number; // Odometer reading in km
  liters: number; // Liters refueled
  pricePerLiter: number; // DA/L
  totalCost: number; // DA
  isFullTank: boolean;
  station: string; // e.g. "TotalEnergies", "Leclerc", "Shell"
  fuelType: FuelType;
  notes?: string;
  // Calculated dynamically:
  consumption?: number; // L/100km
  distanceSinceLast?: number; // km
}

export type MaintenanceCategory = 
  | 'vidange'
  | 'freinage'
  | 'pneus'
  | 'distribution'
  | 'filtres'
  | 'climatisation'
  | 'batterie'
  | 'suspension'
  | 'controle_technique'
  | 'autre';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  title: string;
  category: MaintenanceCategory;
  date: string; // YYYY-MM-DD
  mileage: number; // km
  cost: number; // DA
  garage: string; // e.g. "Garage du Centre", "Norauto"
  invoiceNumber?: string;
  notes?: string;
  nextDueMileage?: number; // km
  nextDueDate?: string; // YYYY-MM-DD
  completed: boolean;
}

export interface MaintenanceIntervalPreset {
  id: string;
  category: MaintenanceCategory;
  name: string;
  intervalKm: number;
  intervalMonths: number;
  description: string;
}

export type DocumentType = 
  | 'controle_technique'
  | 'assurance'
  | 'carte_grise'
  | 'critair'
  | 'permis'
  | 'garantie'
  | 'assistance'
  | 'autre';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  title: string;
  type: DocumentType;
  documentNumber?: string;
  provider?: string; // e.g., "Dekra", "AXA Assurances", "ANTS"
  issueDate?: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  notifyDaysBefore: number; // e.g., 30
  notes?: string;
  emergencyContact?: string;
}

export type TabType = 'dashboard' | 'carburant' | 'entretien' | 'documents' | 'statistiques' | 'vehicule' | 'admin_licenses';

export interface AppNotification {
  id: string;
  type: 'document_expiry' | 'maintenance_due' | 'maintenance_overdue' | 'mileage_reminder' | 'license_expiry';
  title: string;
  message: string;
  severity: 'urgent' | 'warning' | 'info';
  dueDate?: string;
  targetTab?: TabType;
  targetId?: string;
}

export type LicenseStatus = 'active' | 'expiring_soon' | 'expired' | 'revoked' | 'pending' | 'device_mismatch';

export interface License {
  id: string;
  licenseKey: string;
  clientName: string;
  vehiclePlate: string;
  clientPhone?: string;
  status: LicenseStatus;
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

export interface LicenseCheckResult {
  valid: boolean;
  license: License | null;
  status: LicenseStatus;
  daysRemaining: number;
  message: string;
  deviceId?: string;
  hasInstalledLicense?: boolean;
}

export interface DatabaseInfo {
  databaseType: string;
  cloudProvider?: string;
  cloudProjectId?: string;
  databaseId?: string;
  region?: string;
  path?: string;
  totalLicenses: number;
  totalAuditLogs: number;
  sizeBytes?: number;
  cloudActive: boolean;
  sqliteActive?: boolean;
  lastSync?: string;
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

export interface AdminStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  revoked: number;
  pending: number;
}

export interface AppData {
  activeLicenseKey?: string;
  vehicle: Vehicle;
  fuelLogs: FuelLog[];
  maintenanceRecords: MaintenanceRecord[];
  documents: VehicleDocument[];
  updatedAt?: string;
}
