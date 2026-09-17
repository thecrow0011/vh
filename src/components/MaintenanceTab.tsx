import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Pencil,
  Calendar, 
  Building2, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { MaintenanceRecord, MaintenanceCategory } from '../types';
import { MAINTENANCE_PRESETS } from '../data/initialData';
import { formatKm, formatCurrency, formatDateFr, computeMaintenanceStatus } from '../utils/calculations';

const CATEGORY_LABELS: Record<string, string> = {
  vidange: 'Vidange',
  freinage: 'Freins',
  filtres: 'Filtres',
  pneus: 'Pneus',
  distribution: 'Distribution',
  climatisation: 'Climatisation',
  batterie: 'Batterie',
  suspension: 'Suspension',
  controle_technique: 'Contrôle Tech.',
  autre: 'Autre',
};

interface MaintenanceTabProps {
  maintenanceRecords: MaintenanceRecord[];
  currentMileage: number;
  onOpenAddMaintenance: () => void;
  onEditMaintenance: (record: MaintenanceRecord) => void;
  onDeleteMaintenance: (id: string) => void;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
  maintenanceRecords,
  currentMileage,
  onOpenAddMaintenance,
  onEditMaintenance,
  onDeleteMaintenance,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dynamic categories extracted from existing records
  const availableCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    maintenanceRecords.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });

    const categoryList = Object.keys(counts).map((catKey) => ({
      id: catKey,
      label: CATEGORY_LABELS[catKey] || (catKey.charAt(0).toUpperCase() + catKey.slice(1)),
      count: counts[catKey],
    }));

    categoryList.sort((a, b) => a.label.localeCompare(b.label, 'fr'));

    return [
      { id: 'all', label: 'Tous', count: maintenanceRecords.length },
      ...categoryList,
    ];
  }, [maintenanceRecords]);

  // Reset category to 'all' if selected category is deleted/no longer exists
  useEffect(() => {
    if (selectedCategory !== 'all' && !maintenanceRecords.some((m) => m.category === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [maintenanceRecords, selectedCategory]);

  // Total maintenance spend
  const totalCost = maintenanceRecords.reduce((sum, m) => sum + m.cost, 0);

  // Filter records
  const filteredRecords = maintenanceRecords
    .filter((m) => {
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
      const matchesSearch =
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.garage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.invoiceNumber && m.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Compute preset statuses based on history
  const presetTrackers = MAINTENANCE_PRESETS.slice(0, 4).map((preset) => {
    // Find latest record for this category
    const lastRecord = maintenanceRecords
      .filter((m) => m.category === preset.category)
      .sort((a, b) => b.mileage - a.mileage)[0];

    const lastKm = lastRecord ? lastRecord.mileage : Math.max(0, currentMileage - (preset.intervalKm * 0.7));
    const kmSinceLast = currentMileage - lastKm;
    const kmRemaining = preset.intervalKm - kmSinceLast;
    const percentUsed = Math.min(100, Math.max(0, Math.round((kmSinceLast / preset.intervalKm) * 100)));

    const isOverdue = kmRemaining <= 0;
    const isSoon = kmRemaining <= 1500;

    return {
      preset,
      lastRecord,
      kmRemaining,
      percentUsed,
      isOverdue,
      isSoon,
    };
  });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 text-[#F0F0F0] pb-28 font-sans bg-[#0A0A0A]">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif italic text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#D4AF37]" />
            Carnet d'Entretien
          </h2>
          <p className="text-xs text-[#888] mt-0.5">
            {maintenanceRecords.length} intervention{maintenanceRecords.length > 1 ? 's' : ''} enregistrée{maintenanceRecords.length > 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={onOpenAddMaintenance}
          className="px-3.5 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvel entretien
        </button>
      </div>

      {/* Summary Stat Card */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888] block">
            Budget Entretien Total
          </span>
          <span className="text-2xl font-light font-mono text-[#D4AF37] mt-0.5 block">
            {formatCurrency(totalCost)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888] block">
            Compteur actuel
          </span>
          <span className="text-base font-light font-mono text-[#F0F0F0] mt-0.5 block">
            {formatKm(currentMileage)}
          </span>
        </div>
      </div>

      {/* Preventive Maintenance Interval Gauges */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-3">
        <div className="flex items-center gap-2 border-b border-[#2A2A2A] pb-2">
          <Clock className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#888]">
            Échéances Préventives (Intervalles)
          </h3>
        </div>

        <div className="space-y-3">
          {presetTrackers.map(({ preset, kmRemaining, percentUsed, isOverdue, isSoon }) => (
            <div key={preset.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-serif italic text-white text-sm">
                  {preset.name.split('&')[0]}
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider font-semibold ${
                    isOverdue
                      ? 'text-[#FF3B30]'
                      : isSoon
                      ? 'text-[#D4AF37]'
                      : 'text-[#00FF41]'
                  }`}
                >
                  {isOverdue
                    ? `Retard de ${formatKm(Math.abs(kmRemaining))}`
                    : `Dans ${formatKm(kmRemaining)}`}
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full h-1.5 rounded-full bg-[#222222] overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverdue
                      ? 'bg-[#FF3B30]'
                      : isSoon
                      ? 'bg-[#D4AF37]'
                      : 'bg-[#00FF41]'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[#666] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher pièce, garage, facture..."
            className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs text-[#F0F0F0] placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>

        {/* Dynamic Category Filter Pills */}
        {availableCategories.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {availableCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#D4AF37] text-black font-semibold shadow-sm'
                      : 'bg-[#141414] text-[#888] hover:text-[#CCC] border border-[#2A2A2A]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isSelected
                        ? 'bg-black/20 text-black font-bold'
                        : 'bg-[#222222] text-[#888]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888] block px-1">
          Historique des interventions ({filteredRecords.length})
        </span>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center bg-[#141414] rounded-2xl border border-[#2A2A2A]">
            <Wrench className="w-8 h-8 text-[#555] mx-auto mb-2" />
            <p className="text-sm font-serif italic text-[#CCC]">Aucune intervention</p>
            <p className="text-xs text-[#666] mt-1">
              Notez vos vidanges et réparations pour conserver une preuve d'entretien.
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const matchingPreset = MAINTENANCE_PRESETS.find((p) => p.category === record.category);
            const fallbackInterval = matchingPreset ? matchingPreset.intervalKm : 15000;
            const status = computeMaintenanceStatus(record, currentMileage, fallbackInterval);

            return (
              <div
                key={record.id}
                className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] hover:border-[#D4AF37]/40 transition-all flex flex-col gap-2.5 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#1B1B1B] text-[#D4AF37] border border-[#2A2A2A] flex items-center justify-center shrink-0 mt-0.5">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif italic text-white leading-snug">
                        {record.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#888] mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#666]" />
                          {formatDateFr(record.date)}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[#AAA]">{formatKm(record.mileage)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-light font-mono text-[#D4AF37]">
                      {formatCurrency(record.cost)}
                    </span>
                  </div>
                </div>

                {/* Details row: Garage, Invoice */}
                <div className="flex flex-wrap items-center justify-between text-xs text-[#888] pt-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#666]" />
                    <span>{record.garage}</span>
                    {record.invoiceNumber && (
                      <span className="font-mono text-[10px] text-[#666]">
                        (Réf: {record.invoiceNumber})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditMaintenance(record)}
                      className="text-[#888] hover:text-[#D4AF37] p-1 rounded transition-colors cursor-pointer"
                      title="Modifier cet entretien"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteMaintenance(record.id)}
                      className="text-[#666] hover:text-[#FF3B30] p-1 rounded transition-colors cursor-pointer"
                      title="Supprimer cette ligne"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar on ALL records replacing the previous prochaine échéance box */}
                <div className="mt-1 p-2.5 rounded-xl bg-[#0A0A0A] border border-[#222222] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#888] flex items-center gap-1.5 truncate pr-2">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span className="truncate">{status.targetLabel}</span>
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider font-semibold shrink-0 ${
                        status.isOverdue
                          ? 'text-[#FF3B30]'
                          : status.isSoon
                          ? 'text-[#D4AF37]'
                          : 'text-[#00FF41]'
                      }`}
                    >
                      {status.statusLabel}
                    </span>
                  </div>

                  {/* Progress track - identical to preventive interval gauges */}
                  <div className="w-full h-1.5 rounded-full bg-[#222222] overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status.isOverdue
                          ? 'bg-[#FF3B30]'
                          : status.isSoon
                          ? 'bg-[#D4AF37]'
                          : 'bg-[#00FF41]'
                      }`}
                      style={{ width: `${status.percentUsed}%` }}
                    />
                  </div>

                  {/* Details row: mileage elapsed & percentage of wear */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#666]">
                    <span className="truncate pr-2">{status.subLabel}</span>
                    <span
                      className={`shrink-0 ${
                        status.isOverdue
                          ? 'text-[#FF3B30] font-semibold'
                          : status.isSoon
                          ? 'text-[#D4AF37]'
                          : 'text-[#888]'
                      }`}
                    >
                      {status.percentUsed}% d'usure
                    </span>
                  </div>
                </div>

                {record.notes && (
                  <p className="text-[11px] text-[#888] italic bg-[#0A0A0A] px-2.5 py-1.5 rounded-lg border border-[#222222]">
                    "{record.notes}"
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
