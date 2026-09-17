import { Vehicle, FuelLog, MaintenanceRecord, VehicleDocument, MaintenanceIntervalPreset } from '../types';

export const MAINTENANCE_PRESETS: MaintenanceIntervalPreset[] = [
  {
    id: 'vidange_moteur',
    category: 'vidange',
    name: 'Vidange moteur & filtre à huile',
    intervalKm: 15000,
    intervalMonths: 12,
    description: 'Remplacement de l\'huile moteur 5W30 synthétique et de la cartouche filtrante.',
  },
  {
    id: 'filtre_habitacle',
    category: 'filtres',
    name: 'Filtre habitacle (pollen)',
    intervalKm: 15000,
    intervalMonths: 12,
    description: 'Purification de l\'air de ventilation et élimination des allergènes.',
  },
  {
    id: 'filtre_air',
    category: 'filtres',
    name: 'Filtre à air moteur',
    intervalKm: 30000,
    intervalMonths: 24,
    description: 'Protection de l\'admission d\'air et maintien du rendement moteur.',
  },
  {
    id: 'liquide_frein',
    category: 'freinage',
    name: 'Purge du liquide de frein (DOT 4)',
    intervalKm: 40000,
    intervalMonths: 24,
    description: 'Évite l\'ébullition et maintient l\'efficacité du freinage d\'urgence.',
  },
  {
    id: 'plaquettes_frein',
    category: 'freinage',
    name: 'Plaquettes de frein avant/arrière',
    intervalKm: 35000,
    intervalMonths: 24,
    description: 'Vérification de l\'épaisseur des garnitures de friction.',
  },
  {
    id: 'bougies_allumage',
    category: 'autre',
    name: 'Bougies d\'allumage (essence)',
    intervalKm: 40000,
    intervalMonths: 36,
    description: 'Garantit une étincelle optimale et évite les ratés d\'injection.',
  },
  {
    id: 'recharge_clim',
    category: 'climatisation',
    name: 'Recharge fluide clim & désinfection',
    intervalKm: 50000,
    intervalMonths: 24,
    description: 'Nettoyage du circuit et contrôle du compresseur frigorifique.',
  },
  {
    id: 'courroie_distribution',
    category: 'distribution',
    name: 'Kit courroie de distribution & pompe à eau',
    intervalKm: 100000,
    intervalMonths: 72,
    description: 'Élément critique : à remplacer impérativement selon préconisation constructeur.',
  },
  {
    id: 'pneus_rotation',
    category: 'pneus',
    name: 'Permutation & géométrie des trains',
    intervalKm: 20000,
    intervalMonths: 18,
    description: 'Usure régulière et contrôle du parallélisme.',
  }
];

export const INITIAL_VEHICLE: Vehicle = {
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
};

export const INITIAL_DOCUMENTS: VehicleDocument[] = [
  {
    id: 'doc-01',
    vehicleId: 'veh-01',
    title: 'Contrôle Technique Périodique (ENACTA)',
    type: 'controle_technique',
    documentNumber: 'CT-2025-99824',
    provider: 'Centre Agréé ENACTA',
    issueDate: '2025-09-25',
    expiryDate: '2026-09-25', // Expiring in ~22 days from current date 2026-09-03
    notifyDaysBefore: 45,
    notes: 'Centre agréé national. Penser à prendre rendez-vous pour le contrôle annuel.',
    emergencyContact: '023 50 12 34'
  },
  {
    id: 'doc-02',
    vehicleId: 'veh-01',
    title: 'Assurance Tous Risques + Dépannage',
    type: 'assurance',
    documentNumber: 'POL-SAA-2026-88',
    provider: 'SAA Assurances',
    issueDate: '2025-12-15',
    expiryDate: '2026-12-15', // Due in 3+ months
    notifyDaysBefore: 30,
    notes: 'Franchise bris de glace 0 DA. Dépannage et remorquage inclus.',
    emergencyContact: '021 60 40 20'
  },
  {
    id: 'doc-03',
    vehicleId: 'veh-01',
    title: 'Carte d\'immatriculation (Carte Grise)',
    type: 'carte_grise',
    documentNumber: '16-123-45129',
    provider: 'Daïra / Ministère de l\'Intérieur',
    issueDate: '2021-06-20',
    expiryDate: '2036-06-20',
    notifyDaysBefore: 60,
    notes: 'Document officiel permanent conservé dans la boîte à gants.'
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
    notes: 'Quittance et macaron officiel apposé sur le pare-brise avant droit.'
  },
  {
    id: 'doc-05',
    vehicleId: 'veh-01',
    title: 'Permis de Conduire Biométrique',
    type: 'permis',
    documentNumber: '16AF12894',
    provider: 'Daïra / Ministère de l\'Intérieur',
    issueDate: '2019-10-10',
    expiryDate: '2029-10-10',
    notifyDaysBefore: 90,
    notes: 'Permis de conduire biométrique à points national.'
  }
];

export const INITIAL_FUEL_LOGS: FuelLog[] = [
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
    notes: 'Plein Sans Plomb avant départ en week-end'
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
    notes: 'Plein Sans Plomb'
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
    notes: 'Trajet vacances autoroute'
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
    notes: 'Plein régulier'
  }
];

export const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'maint-01',
    vehicleId: 'veh-01',
    title: 'Vidange complète + Filtre à huile',
    category: 'vidange',
    date: '2025-09-10',
    mileage: 33500,
    cost: 7500.00,
    garage: 'Service Auto Agréé',
    invoiceNumber: 'FAC-2025-084',
    notes: 'Huile synthétique 5W30 et cartouche filtrante. Contrôle des 25 points de sécurité.',
    nextDueMileage: 48500, // Approaching! current is 48250 (250 km left!)
    nextDueDate: '2026-09-10', // Reached in 7 days!
    completed: true,
  },
  {
    id: 'maint-02',
    vehicleId: 'veh-01',
    title: 'Remplacement plaquettes de frein avant',
    category: 'freinage',
    date: '2026-01-20',
    mileage: 39800,
    cost: 9500.00,
    garage: 'Atelier Freinage Express',
    invoiceNumber: 'FAC-99321',
    notes: 'Plaquettes neuves. Disques contrôlés en bon état.',
    nextDueMileage: 74800,
    nextDueDate: '2028-01-20',
    completed: true,
  },
  {
    id: 'maint-03',
    vehicleId: 'veh-01',
    title: 'Filtre habitacle & traitement antibactérien',
    category: 'filtres',
    date: '2026-04-14',
    mileage: 43200,
    cost: 2800.00,
    garage: 'Speedy Auto Service',
    invoiceNumber: 'SPD-48190',
    notes: 'Filtre charbon actif anti-odeurs et purificateur clim.',
    nextDueMileage: 58200,
    nextDueDate: '2027-04-14',
    completed: true,
  }
];
