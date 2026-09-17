import React, { useState } from 'react';
import { 
  Fuel, 
  Plus, 
  Trash2, 
  Pencil,
  TrendingUp, 
  MapPin, 
  Calendar, 
  Gauge, 
  CheckCircle2, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { FuelLog } from '../types';
import { formatKm, formatCurrency, formatDateFr, calculateFuelMetrics } from '../utils/calculations';

interface FuelTabProps {
  fuelLogs: FuelLog[];
  onOpenAddFuel: () => void;
  onEditFuelLog: (log: FuelLog) => void;
  onDeleteFuelLog: (id: string) => void;
}

export const FuelTab: React.FC<FuelTabProps> = ({
  fuelLogs,
  onOpenAddFuel,
  onEditFuelLog,
  onDeleteFuelLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    processedLogs,
    avgConsumption,
    totalSpent,
    totalLiters,
    avgPricePerLiter,
    totalDistanceTracked,
  } = calculateFuelMetrics(fuelLogs);

  const filteredLogs = processedLogs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.station.toLowerCase().includes(searchLower) ||
      (log.notes && log.notes.toLowerCase().includes(searchLower)) ||
      log.date.includes(searchLower)
    );
  });

  // Calculate chart points (chronological)
  const chartLogs = [...processedLogs]
    .filter((l) => l.consumption && l.consumption > 0)
    .reverse();

  const maxConsumption = chartLogs.length > 0 ? Math.max(...chartLogs.map((l) => l.consumption || 6), 9) : 9;
  const minConsumption = chartLogs.length > 0 ? Math.min(...chartLogs.map((l) => l.consumption || 5), 4) : 4;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 text-[#F0F0F0] pb-28 font-sans bg-[#0A0A0A]">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif italic text-white flex items-center gap-2">
            <Fuel className="w-5 h-5 text-[#D4AF37]" />
            Suivi Carburant
          </h2>
          <p className="text-xs text-[#888] mt-0.5">
            {fuelLogs.length} plein{fuelLogs.length > 1 ? 's' : ''} enregistré{fuelLogs.length > 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={onOpenAddFuel}
          className="px-3.5 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau plein
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A]">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888] block">
            Consommation
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-light font-mono text-[#D4AF37]">
              {avgConsumption > 0 ? avgConsumption : '—'}
            </span>
            <span className="text-xs font-medium text-[#888]">L/100km</span>
          </div>
          <span className="text-[10px] text-[#666] italic mt-0.5 block">
            {avgConsumption > 0 ? 'Moyenne globale' : 'Calcul dès 2 pleins'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A]">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888] block">
            Total Dépensé
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-light font-mono text-[#F0F0F0]">
              {formatCurrency(totalSpent)}
            </span>
          </div>
          <span className="text-[10px] text-[#666] italic mt-0.5 block">
            {totalLiters} L cumulés
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A]">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888] block">
            Prix moyen / L
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-light font-mono text-[#F0F0F0]">
              {avgPricePerLiter > 0 ? `${avgPricePerLiter.toFixed(2)} DA` : '—'}
            </span>
          </div>
          <span className="text-[10px] text-[#666] italic mt-0.5 block">
            Moyenne globale
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A]">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888] block">
            Distance suivie
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-light font-mono text-[#F0F0F0]">
              {formatKm(totalDistanceTracked)}
            </span>
          </div>
          <span className="text-[10px] text-[#666] italic mt-0.5 block">
            Entre ravitaillements
          </span>
        </div>
      </div>

      {/* Consumption Trend Chart (SVG) with Gold Line & Minimalist Dark Grid */}
      {chartLogs.length >= 2 && (
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-2">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-serif italic text-white">
                Évolution de la consommation
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#D4AF37]">
              Moy: {avgConsumption} L/100
            </span>
          </div>

          {/* SVG Chart */}
          <div className="h-32 w-full pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* Reference Grid lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#222222" strokeDasharray="2,2" strokeWidth="0.8" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#222222" strokeDasharray="2,2" strokeWidth="0.8" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#222222" strokeDasharray="2,2" strokeWidth="0.8" />

              {/* Area gradient */}
              <defs>
                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Draw area and line */}
              {(() => {
                const points = chartLogs.map((log, idx) => {
                  const x = (idx / (chartLogs.length - 1)) * 280 + 10;
                  const val = log.consumption || avgConsumption;
                  const range = maxConsumption - minConsumption || 1;
                  const y = 85 - ((val - minConsumption) / range) * 65;
                  return { x, y, val, date: log.date };
                });

                const polyPoints = [
                  `10,95`,
                  ...points.map((p) => `${p.x},${p.y}`),
                  `${points[points.length - 1].x},95`,
                ].join(' ');

                const pathData = points.reduce(
                  (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
                  ''
                );

                return (
                  <>
                    <polygon points={polyPoints} fill="url(#fuelGrad)" />
                    <path d={pathData} fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3" fill="#141414" stroke="#D4AF37" strokeWidth="2" />
                        <text
                          x={p.x}
                          y={p.y - 7}
                          fill="#F0F0F0"
                          fontSize="9"
                          fontWeight="normal"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {p.val}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-[#666] font-mono pt-1">
            <span>{formatDateFr(chartLogs[0].date)}</span>
            <span>{formatDateFr(chartLogs[chartLogs.length - 1].date)}</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#666] absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher station, date, note..."
          className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs text-[#F0F0F0] placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
        />
      </div>

      {/* Logs List */}
      <div className="space-y-2.5">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#888] block px-1">
          Historique des ravitaillements ({filteredLogs.length})
        </span>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-[#141414] rounded-2xl border border-[#2A2A2A]">
            <Fuel className="w-8 h-8 text-[#555] mx-auto mb-2" />
            <p className="text-sm font-serif italic text-[#CCC]">Aucun plein trouvé</p>
            <p className="text-xs text-[#666] mt-1">
              Enregistrez vos passages à la pompe pour analyser votre consommation.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A] hover:border-[#D4AF37]/40 transition-all flex flex-col gap-2 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1B1B1B] text-[#D4AF37] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-serif italic text-white flex items-center gap-1.5">
                      {log.station}
                      {log.isFullTank ? (
                        <span className="text-[9px] font-sans not-italic font-medium px-1.5 py-0.5 rounded bg-[#1B1B1B] text-[#00FF41] border border-[#00FF41]/30">
                          Plein complet
                        </span>
                      ) : (
                        <span className="text-[9px] font-sans not-italic font-medium px-1.5 py-0.5 rounded bg-[#1B1B1B] text-[#D4AF37] border border-[#D4AF37]/30">
                          Plein partiel
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-[#888] mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3 text-[#666]" />
                        {formatDateFr(log.date)}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[#AAA]">{formatKm(log.mileage)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-sm font-light font-mono text-[#D4AF37]">
                    {formatCurrency(log.totalCost)}
                  </span>
                  <span className="text-[10px] font-mono text-[#888]">
                    {log.liters} L @ {(Number(log.pricePerLiter) || 0).toFixed(2)} DA/L
                  </span>
                </div>
              </div>

              {/* Sub metrics: consumption & distance */}
              <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {log.consumption ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#888]">Conso :</span>
                      <span className="font-mono font-medium text-[#00FF41]">
                        {log.consumption} L/100km
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#666] italic">
                      1er relevé (point de départ)
                    </span>
                  )}

                  {log.distanceSinceLast && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#888]">Parcouru :</span>
                      <span className="font-mono font-medium text-[#DDD]">
                        +{log.distanceSinceLast} km
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditFuelLog(log)}
                    className="text-[#888] hover:text-[#D4AF37] p-1 rounded transition-colors cursor-pointer"
                    title="Modifier ce plein"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteFuelLog(log.id)}
                    className="text-[#666] hover:text-[#FF3B30] p-1 rounded transition-colors cursor-pointer"
                    title="Supprimer ce plein"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {log.notes && (
                <p className="text-[11px] text-[#888] italic bg-[#0A0A0A] px-2 py-1 rounded-lg border border-[#222222]">
                  "{log.notes}"
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
