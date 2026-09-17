import React, { useRef, useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Download, 
  Upload, 
  RotateCcw, 
  TrendingUp, 
  Fuel, 
  Wrench, 
  DollarSign, 
  Check, 
  Sparkles,
  Car,
  Shield,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Vehicle, FuelLog, MaintenanceRecord, VehicleDocument } from '../types';
import { formatCurrency, formatKm, calculateFuelMetrics } from '../utils/calculations';

interface StatsTabProps {
  vehicle: Vehicle;
  fuelLogs: FuelLog[];
  maintenanceRecords: MaintenanceRecord[];
  documents: VehicleDocument[];
  onExportData: () => void;
  onImportData: (data: any) => void;
  onResetDemoData: () => void;
  onOpenLicense?: () => void;
  onOpenAdmin?: () => void;
  licenseDaysRemaining?: number;
  licenseStatus?: string;
  onRefreshLicense?: () => void;
}

export const StatsTab: React.FC<StatsTabProps> = ({
  vehicle,
  fuelLogs,
  maintenanceRecords,
  documents,
  onExportData,
  onImportData,
  onResetDemoData,
  onOpenLicense,
  onOpenAdmin,
  licenseDaysRemaining = 365,
  licenseStatus = 'active',
  onRefreshLicense,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const handleSyncClick = async () => {
    if (!onRefreshLicense || isSyncing) return;
    setIsSyncing(true);
    setJustSynced(false);
    try {
      await Promise.resolve(onRefreshLicense());
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2000);
    } catch {
      // Background sync handled gracefully
    } finally {
      setIsSyncing(false);
    }
  };

  const fuelMetrics = calculateFuelMetrics(fuelLogs);
  const totalFuelCost = fuelMetrics.totalSpent;
  const totalMaintCost = maintenanceRecords.reduce((sum, m) => sum + m.cost, 0);
  const totalGlobalCost = totalFuelCost + totalMaintCost;

  const fuelPercent = totalGlobalCost > 0 ? Math.round((totalFuelCost / totalGlobalCost) * 100) : 0;
  const maintPercent = totalGlobalCost > 0 ? 100 - fuelPercent : 0;

  // Cost per km calculation
  const costPerKm =
    fuelMetrics.totalDistanceTracked > 0
      ? totalGlobalCost / fuelMetrics.totalDistanceTracked
      : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportData(parsed);
      } catch (err) {
        alert("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 text-[#F0F0F0] pb-28 font-sans bg-[#0A0A0A]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-serif italic text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
          Budget & Synthèse des Coûts
        </h2>
        <p className="text-xs text-[#888] mt-0.5">
          Coût total de possession (TCO) & répartition analytique
        </p>
      </div>

      {/* Global Cost Highlight */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888] block">
          Dépenses Totales Cumulées
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-light font-mono text-[#D4AF37]">
            {formatCurrency(totalGlobalCost)}
          </span>
          <span className="text-xs text-[#666] font-medium">tous postes</span>
        </div>

        {/* Cost per km */}
        <div className="p-2.5 rounded-xl bg-[#0A0A0A] border border-[#222222] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#888]">Coût estimé au kilomètre :</span>
            <span className="font-mono font-medium text-[#F0F0F0]">
              {costPerKm > 0 ? `${costPerKm.toFixed(2)} DA / km` : '—'}
            </span>
          </div>
          <span className="text-[10px] text-[#666] font-mono">
            {formatKm(fuelMetrics.totalDistanceTracked || 1980)} suivis
          </span>
        </div>

        {/* Distribution Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#D4AF37] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] inline-block"></span>
              Carburant {fuelPercent}% ({formatCurrency(totalFuelCost)})
            </span>
            <span className="text-[#AAA] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#888] inline-block"></span>
              Entretien {maintPercent}% ({formatCurrency(totalMaintCost)})
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#222222] overflow-hidden flex">
            <div
              className="bg-[#D4AF37] h-full transition-all duration-500"
              style={{ width: `${fuelPercent}%` }}
            />
            <div
              className="bg-[#666] h-full transition-all duration-500"
              style={{ width: `${maintPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-1">
          <div className="flex items-center gap-1.5 text-[#D4AF37]">
            <Fuel className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888]">Carburant</span>
          </div>
          <span className="text-xl font-light font-mono text-[#F0F0F0] block">
            {formatCurrency(totalFuelCost)}
          </span>
          <span className="text-[10px] text-[#666] block">
            {fuelLogs.length} pleins • {fuelMetrics.totalLiters} L
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-1">
          <div className="flex items-center gap-1.5 text-[#D4AF37]">
            <Wrench className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888]">Entretien</span>
          </div>
          <span className="text-xl font-light font-mono text-[#F0F0F0] block">
            {formatCurrency(totalMaintCost)}
          </span>
          <span className="text-[10px] text-[#666] block">
            {maintenanceRecords.length} interventions
          </span>
        </div>
      </div>

      {/* Vehicle Summary Specs */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-3">
        <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#888] flex items-center gap-2 border-b border-[#2A2A2A] pb-2">
          <Car className="w-4 h-4 text-[#D4AF37]" />
          Fiche synthétique du véhicule
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#0A0A0A] border border-[#222222]">
            <span className="text-[10px] text-[#666] uppercase tracking-wider block">Modèle & Moteur</span>
            <span className="font-serif italic text-white text-sm">{vehicle.make} {vehicle.model}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0A0A0A] border border-[#222222]">
            <span className="text-[10px] text-[#666] uppercase tracking-wider block">Immatriculation</span>
            <span className="font-mono text-sm font-semibold text-[#D4AF37]">{vehicle.licensePlate}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0A0A0A] border border-[#222222]">
            <span className="text-[10px] text-[#666] uppercase tracking-wider block">Carburant</span>
            <span className="font-medium text-[#DDD] capitalize">{vehicle.fuelType} ({vehicle.tankCapacity}L)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0A0A0A] border border-[#222222]">
            <span className="text-[10px] text-[#666] uppercase tracking-wider block">Kilométrage total</span>
            <span className="font-mono text-sm font-semibold text-[#F0F0F0]">{formatKm(vehicle.currentMileage)}</span>
          </div>
        </div>
      </div>

      {/* Data Management & Backup (Export / Import / Reset) */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888] block">
          Sauvegarde & Gestion des données
        </span>

        <p className="text-xs text-[#666]">
          Toutes vos données sont stockées de façon sécurisée localement sur cet appareil.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onExportData}
            className="py-2 px-3 rounded-xl bg-[#0A0A0A] hover:bg-[#1E1E1E] text-[#D4AF37] text-xs font-medium flex items-center justify-center gap-1.5 border border-[#D4AF37]/30 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            Exporter JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2 px-3 rounded-xl bg-[#0A0A0A] hover:bg-[#1E1E1E] text-[#D4AF37] text-xs font-medium flex items-center justify-center gap-1.5 border border-[#D4AF37]/30 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#D4AF37]" />
            Importer JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <button
          onClick={onResetDemoData}
          className="w-full py-2 px-3 rounded-xl bg-[#0A0A0A] hover:bg-[#1A1414] text-[#888] hover:text-[#FF3B30] text-xs font-medium flex items-center justify-center gap-1.5 border border-[#222222] transition-colors cursor-pointer mt-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurer les données initiales
        </button>
      </div>

      {/* License & Administration Section */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] block">
            Licence & Gestion Système (Mode Connecté)
          </span>
          <div className="flex items-center gap-1.5">
            {onRefreshLicense && (
              <button
                onClick={handleSyncClick}
                disabled={isSyncing}
                title="Synchroniser avec le serveur"
                className="px-2 py-1 rounded-lg bg-[#0A0A0A] hover:bg-[#222] text-[#888] hover:text-[#D4AF37] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5 text-[10px]"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#D4AF37]' : justSynced ? 'text-[#34C759]' : ''}`} />
                {justSynced && <span className="text-[#34C759] font-medium">À jour</span>}
              </button>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                licenseDaysRemaining > 30
                  ? 'bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40'
                  : licenseDaysRemaining > 0
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                  : 'bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/40'
              }`}
            >
              {licenseDaysRemaining}j restants
            </span>
          </div>
        </div>
        <p className="text-xs text-[#777]">
          Statut serveur synchronisé : <strong className="text-white">{licenseDaysRemaining} jours</strong> de validité restante.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {onOpenLicense && (
            <button
              onClick={onOpenLicense}
              className="py-2 px-3 rounded-xl bg-[#0A0A0A] hover:bg-[#1E1E1E] text-[#D4AF37] text-xs font-medium flex items-center justify-center gap-1.5 border border-[#D4AF37]/30 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Ma Licence</span>
            </button>
          )}

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="py-2 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Shield className="w-4 h-4" />
              <span>Console Admin</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
