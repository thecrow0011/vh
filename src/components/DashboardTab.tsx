import React from 'react';
import { 
  Fuel, 
  Wrench, 
  FileText, 
  AlertTriangle, 
  ChevronRight, 
  Gauge, 
  Calendar, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  PlusCircle, 
  Droplet,
  Clock
} from 'lucide-react';
import { Vehicle, FuelLog, MaintenanceRecord, VehicleDocument, TabType, AppNotification } from '../types';
import { formatKm, formatCurrency, formatDateFr, getDocumentStatus, computeMaintenanceStatus, calculateFuelMetrics } from '../utils/calculations';

interface DashboardTabProps {
  vehicle: Vehicle;
  fuelLogs: FuelLog[];
  maintenanceRecords: MaintenanceRecord[];
  documents: VehicleDocument[];
  notifications: AppNotification[];
  onNavigateTab: (tab: TabType) => void;
  onOpenAddFuel: () => void;
  onOpenAddMaintenance: () => void;
  onOpenAddDocument: () => void;
  onOpenMileageModal: () => void;
  onOpenAlertsModal: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  vehicle,
  fuelLogs,
  maintenanceRecords,
  documents,
  notifications,
  onNavigateTab,
  onOpenAddFuel,
  onOpenAddMaintenance,
  onOpenAddDocument,
  onOpenMileageModal,
  onOpenAlertsModal,
}) => {
  const fuelMetrics = calculateFuelMetrics(fuelLogs);
  const urgentAlerts = notifications.filter((n) => n.severity === 'urgent');
  const latestFuel = fuelMetrics.processedLogs[0];

  // Calculate upcoming deadlines (combining documents and maintenance)
  const upcomingDeadlines: {
    id: string;
    title: string;
    type: 'document' | 'maintenance';
    dateStr: string;
    daysRemaining: number;
    kmRemaining?: number;
    severity: 'urgent' | 'warning' | 'info';
    targetTab: TabType;
  }[] = [];

  documents.forEach((doc) => {
    const status = getDocumentStatus(doc);
    upcomingDeadlines.push({
      id: doc.id,
      title: doc.title,
      type: 'document',
      dateStr: doc.expiryDate,
      daysRemaining: status.daysLeft,
      severity: status.status === 'expired' || status.status === 'urgent' ? 'urgent' : status.status === 'warning' ? 'warning' : 'info',
      targetTab: 'documents',
    });
  });

  maintenanceRecords.forEach((m) => {
    if (m.nextDueDate || m.nextDueMileage) {
      const status = computeMaintenanceStatus(m, vehicle.currentMileage);
      upcomingDeadlines.push({
        id: m.id,
        title: m.title,
        type: 'maintenance',
        dateStr: m.nextDueDate || 'Prochain entretien',
        daysRemaining: status.daysRemaining ?? 999,
        kmRemaining: status.kmRemaining,
        severity: status.isOverdue ? 'urgent' : status.isDue ? 'warning' : 'info',
        targetTab: 'entretien',
      });
    }
  });

  // Sort deadlines by days remaining
  upcomingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Vehicle health status score
  const hasUrgent = urgentAlerts.length > 0;
  const healthScore = hasUrgent ? 74 : notifications.length > 0 ? 88 : 98;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 text-[#F0F0F0] pb-28 font-sans bg-[#0A0A0A]">
      {/* Alert Banner if urgent issues */}
      {urgentAlerts.length > 0 ? (
        <div
          onClick={onOpenAlertsModal}
          className="p-3.5 rounded-2xl bg-[#141414] border-l-4 border-l-[#FF3B30] border-y border-r border-[#2A2A2A] shadow-lg flex items-center justify-between cursor-pointer hover:border-[#FF3B30]/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF3B30]/15 text-[#FF3B30] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#FF3B30] uppercase tracking-wider">
                  {urgentAlerts.length} urgence{urgentAlerts.length > 1 ? 's' : ''} active{urgentAlerts.length > 1 ? 's' : ''}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-ping"></span>
              </div>
              <p className="text-[11px] text-[#888] line-clamp-1">
                {urgentAlerts[0].title} — {urgentAlerts[0].message}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#888] shrink-0" />
        </div>
      ) : notifications.length > 0 ? (
        <div
          onClick={onOpenAlertsModal}
          className="p-3 rounded-2xl bg-[#141414] border-l-4 border-l-[#D4AF37] border-y border-r border-[#2A2A2A] flex items-center justify-between cursor-pointer hover:border-[#D4AF37]/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <p className="text-xs text-[#AAA]">
              <span className="font-semibold text-[#D4AF37]">{notifications.length} échéance(s)</span> à surveiller prochainement.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#888]" />
        </div>
      ) : null}

      {/* Hero Vehicle Status Card (Cockpit Style) */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#2A2A2A] shadow-xl relative overflow-hidden space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <p className="text-[#888] uppercase tracking-[0.2em] text-[10px] font-semibold">
              Véhicule Actuel
            </p>
            <h2 className="text-2xl font-serif italic text-white tracking-wide">
              {vehicle.make} {vehicle.model}{' '}
              <span className="text-sm font-sans not-italic text-[#D4AF37] ml-1">
                • {vehicle.trim ? vehicle.trim.split(' ')[0] : vehicle.year}
              </span>
            </h2>
            <p className="text-xs text-[#666] italic">
              {vehicle.trim || 'Motorisation thermique / hybride'}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-light font-mono tracking-tight text-[#F0F0F0]">
              {vehicle.currentMileage.toLocaleString('fr-FR')}{' '}
              <span className="text-xs text-[#888] font-sans">KM</span>
            </p>
            {hasUrgent ? (
              <p className="text-[10px] text-[#FF3B30] uppercase tracking-widest font-semibold flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] shadow-[0_0_6px_#FF3B30]"></span>
                Attention
              </p>
            ) : (
              <p className="text-[10px] text-[#00FF41] uppercase tracking-widest font-semibold flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] shadow-[0_0_6px_#00FF41]"></span>
                Systèmes OK
              </p>
            )}
          </div>
        </div>

        {/* Slender Gauge / Odometer Adjustment Bar */}
        <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs text-[#888] font-medium">Relevé compteur :</span>
            <span className="font-mono text-xs font-semibold text-[#F0F0F0]">{formatKm(vehicle.currentMileage)}</span>
          </div>

          <button
            onClick={onOpenMileageModal}
            className="px-2.5 py-1 rounded-lg bg-[#1B1B1B] hover:bg-[#252525] text-[#D4AF37] border border-[#2A2A2A] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            Ajuster
          </button>
        </div>
      </div>

      {/* 2 Metric Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Fuel Consumption card */}
        <div 
          onClick={() => onNavigateTab('carburant')}
          className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] hover:border-[#D4AF37]/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#888] mb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">Consommation</span>
            <Droplet className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light font-mono text-[#D4AF37]">
                {fuelMetrics.avgConsumption > 0 ? fuelMetrics.avgConsumption : '—'}
              </span>
              <span className="text-xs font-medium text-[#888]">L/100</span>
            </div>
            <span className="text-[10px] text-[#666] italic mt-1 block">
              {latestFuel ? `${latestFuel.liters}L (${latestFuel.station.split(' ')[0]})` : 'Aucun plein'}
            </span>
          </div>
        </div>

        {/* Maintenance cost card */}
        <div 
          onClick={() => onNavigateTab('statistiques')}
          className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] hover:border-[#D4AF37]/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#888] mb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">Dépense Totale</span>
            <TrendingUp className="w-4 h-4 text-[#AAA] group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light font-mono text-[#F0F0F0]">
                {formatCurrency(
                  fuelMetrics.totalSpent +
                  maintenanceRecords.reduce((sum, m) => sum + m.cost, 0)
                )}
              </span>
            </div>
            <span className="text-[10px] text-[#666] italic mt-1 block">
              Carburant + Entretien
            </span>
          </div>
        </div>
      </div>

      {/* Prochaines Échéances / Rappels (Design HTML style with clean vertical accent borders) */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <h3 className="text-xs uppercase tracking-[0.2em] text-[#888] font-semibold">
            Documents & Rappels
          </h3>
          <button
            onClick={() => onNavigateTab('documents')}
            className="text-[11px] font-medium text-[#D4AF37] hover:text-[#E5C158] flex items-center gap-0.5 cursor-pointer"
          >
            Voir tout
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          {upcomingDeadlines.slice(0, 3).map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => onNavigateTab(item.targetTab)}
              className={`relative pl-3.5 border-l-2 py-0.5 flex items-center justify-between cursor-pointer group transition-colors ${
                item.severity === 'urgent'
                  ? 'border-[#FF3B30]'
                  : item.severity === 'warning'
                  ? 'border-[#D4AF37]'
                  : 'border-[#333333]'
              }`}
            >
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    item.severity === 'urgent'
                      ? 'text-[#FF3B30]'
                      : item.severity === 'warning'
                      ? 'text-[#D4AF37]'
                      : 'text-[#888]'
                  }`}
                >
                  {item.severity === 'urgent' ? 'Urgent' : item.severity === 'warning' ? 'Attention' : 'À Venir'}
                </p>
                <h4 className="text-base font-serif italic text-white group-hover:text-[#D4AF37] transition-colors leading-tight">
                  {item.title}
                </h4>
                <p className="text-xs text-[#888] mt-0.5">
                  {item.kmRemaining !== undefined
                    ? `Dans ${item.kmRemaining} km • ${formatDateFr(item.dateStr)}`
                    : `Échéance : ${formatDateFr(item.dateStr)}`}
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                    item.daysRemaining < 0
                      ? 'bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/40'
                      : item.daysRemaining <= 30
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                      : 'bg-[#1B1B1B] text-[#AAA] border border-[#2A2A2A]'
                  }`}
                >
                  {item.daysRemaining < 0
                    ? `+${Math.abs(item.daysRemaining)}j retard`
                    : `${item.daysRemaining} jours`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="pt-1">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#888] font-semibold block mb-2 px-1">
          Actions rapides
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={onOpenAddFuel}
            className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A] hover:border-[#D4AF37]/50 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#1B1B1B] text-[#D4AF37] border border-[#2A2A2A] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Fuel className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-[#DDD] group-hover:text-white">+ Plein</span>
          </button>

          <button
            onClick={onOpenAddMaintenance}
            className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A] hover:border-[#00FF41]/50 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#1B1B1B] text-[#00FF41] border border-[#2A2A2A] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-[#DDD] group-hover:text-white">+ Entretien</span>
          </button>

          <button
            onClick={onOpenAddDocument}
            className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A] hover:border-[#D4AF37]/50 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#1B1B1B] text-[#F0F0F0] border border-[#2A2A2A] flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-[#DDD] group-hover:text-white">+ Document</span>
          </button>
        </div>
      </div>
    </div>
  );
};
