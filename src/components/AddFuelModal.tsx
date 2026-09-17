import React, { useState, useEffect } from 'react';
import { X, Fuel, Check, Calendar, MapPin, Gauge } from 'lucide-react';
import { FuelLog, FuelType } from '../types';

interface AddFuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMileage: number;
  vehicleFuelType: FuelType;
  onAddFuel: (log: Omit<FuelLog, 'id'>) => void;
  onUpdateFuel?: (log: FuelLog) => void;
  editingLog?: FuelLog | null;
}

const COMMON_STATIONS = ['Naftal', 'TotalEnergies', 'Petroser', 'Station Privée', 'Autre'];

export const AddFuelModal: React.FC<AddFuelModalProps> = ({
  isOpen,
  onClose,
  currentMileage,
  vehicleFuelType,
  onAddFuel,
  onUpdateFuel,
  editingLog,
}) => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState<number>(currentMileage);
  const [liters, setLiters] = useState<string>('40.0');
  const [pricePerLiter, setPricePerLiter] = useState<string>('47.00');
  const [totalCost, setTotalCost] = useState<string>('1800.00');
  const [isFullTank, setIsFullTank] = useState<boolean>(true);
  const [station, setStation] = useState<string>('Naftal');
  const [fuelType, setFuelType] = useState<FuelType>(vehicleFuelType);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (editingLog) {
        setDate(editingLog.date);
        setMileage(editingLog.mileage);
        setLiters(String(editingLog.liters));
        setPricePerLiter(String(editingLog.pricePerLiter));
        setTotalCost(String(editingLog.totalCost));
        setIsFullTank(editingLog.isFullTank);
        setStation(editingLog.station || 'Naftal');
        setFuelType(editingLog.fuelType || vehicleFuelType);
        setNotes(editingLog.notes || '');
      } else {
        setMileage(currentMileage);
        setDate(new Date().toISOString().split('T')[0]);
        setLiters('40.0');
        setPricePerLiter('47.00');
        setTotalCost('1880.00');
        setIsFullTank(true);
        setStation('Naftal');
        setFuelType(vehicleFuelType);
        setNotes('');
      }
    }
  }, [isOpen, currentMileage, vehicleFuelType, editingLog]);

  if (!isOpen) return null;

  const handleLitersChange = (val: string) => {
    setLiters(val);
    const l = parseFloat(val);
    const ppl = parseFloat(pricePerLiter);
    if (!isNaN(l) && !isNaN(ppl) && l > 0) {
      setTotalCost((l * ppl).toFixed(2));
    }
  };

  const handlePricePerLiterChange = (val: string) => {
    setPricePerLiter(val);
    const l = parseFloat(liters);
    const ppl = parseFloat(val);
    if (!isNaN(l) && !isNaN(ppl) && l > 0) {
      setTotalCost((l * ppl).toFixed(2));
    }
  };

  const handleTotalCostChange = (val: string) => {
    setTotalCost(val);
    const total = parseFloat(val);
    const ppl = parseFloat(pricePerLiter);
    if (!isNaN(total) && !isNaN(ppl) && ppl > 0) {
      setLiters((total / ppl).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = Math.max(0.1, parseFloat(liters) || 0);
    const ppl = Math.max(0.1, parseFloat(pricePerLiter) || 0);
    const tot = Math.max(0.1, parseFloat(totalCost) || (l * ppl));
    const m = Math.max(0, Number(mileage) || currentMileage);

    if (editingLog && onUpdateFuel) {
      onUpdateFuel({
        ...editingLog,
        date: date || new Date().toISOString().split('T')[0],
        mileage: m,
        liters: Number(l.toFixed(2)),
        pricePerLiter: Number(ppl.toFixed(2)),
        totalCost: Number(tot.toFixed(2)),
        isFullTank,
        station: station.trim() || 'Station-service',
        fuelType,
        notes: notes.trim() || undefined,
      });
    } else {
      onAddFuel({
        vehicleId: 'veh-01',
        date: date || new Date().toISOString().split('T')[0],
        mileage: m,
        liters: Number(l.toFixed(2)),
        pricePerLiter: Number(ppl.toFixed(2)),
        totalCost: Number(tot.toFixed(2)),
        isFullTank,
        station: station.trim() || 'Station-service',
        fuelType,
        notes: notes.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A0A]/85 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-t-2xl md:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 font-sans">
        <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1B1B1B] text-[#D4AF37] border border-[#2A2A2A] flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif italic text-white">
                {editingLog ? 'Modifier le plein' : 'Enregistrer un plein'}
              </h3>
              <p className="text-[11px] text-[#888]">
                {editingLog ? 'Mettre à jour les informations du ravitaillement' : 'Suivi de la consommation & des coûts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#888] hover:text-white hover:bg-[#1B1B1B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* Date & Mileage */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Date du plein</label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-[#666]" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-[#F0F0F0] w-full outline-none font-medium text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Kilométrage (km)</label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
                <Gauge className="w-3.5 h-3.5 text-[#666]" />
                <input
                  type="number"
                  required
                  min="0"
                  value={mileage}
                  onChange={(e) => setMileage(Number(e.target.value))}
                  className="bg-transparent text-[#F0F0F0] w-full outline-none font-medium text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Liters & Price per liter */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Volume (Litres)</label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={liters}
                  onChange={(e) => handleLitersChange(e.target.value)}
                  className="bg-transparent text-[#F0F0F0] w-full outline-none font-mono font-medium text-sm"
                  placeholder="Ex: 42.5"
                />
                <span className="text-[#666] font-semibold">L</span>
              </div>
            </div>

            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Prix au Litre (DA/L)</label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={pricePerLiter}
                  onChange={(e) => handlePricePerLiterChange(e.target.value)}
                  className="bg-transparent text-[#F0F0F0] w-full outline-none font-mono font-medium text-sm"
                  placeholder="Ex: 45.00"
                />
                <span className="text-[#666] font-semibold text-xs">DA</span>
              </div>
            </div>
          </div>

          {/* Total Cost Highlight */}
          <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#888] font-semibold">Coût total calculé</span>
              <p className="text-xl font-light font-mono text-[#D4AF37]">
                {parseFloat(totalCost) ? `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(totalCost))} DA` : '0,00 DA'}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-[#141414] px-2.5 py-1.5 rounded-xl border border-[#2A2A2A]">
              <span className="text-[11px] text-[#888]">Ajuster :</span>
              <input
                type="number"
                step="1"
                value={totalCost}
                onChange={(e) => handleTotalCostChange(e.target.value)}
                className="w-24 bg-transparent text-right font-mono font-semibold text-[#D4AF37] outline-none"
              />
              <span className="text-[#D4AF37] font-semibold text-xs">DA</span>
            </div>
          </div>

          {/* Full Tank Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-[#0A0A0A] rounded-xl border border-[#2A2A2A]">
            <div>
              <span className="font-medium text-[#F0F0F0]">Plein complet (Réservoir rempli)</span>
              <p className="text-[10px] text-[#666]">
                Indispensable pour calculer la consommation exacte en L/100km
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFullTank(!isFullTank)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isFullTank ? 'bg-[#D4AF37]' : 'bg-[#2A2A2A]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black transition-transform ${
                  isFullTank ? 'translate-x-5' : 'translate-x-0.5'
                } top-0.5 absolute`}
              />
            </button>
          </div>

          {/* Station & Quick Chips */}
          <div>
            <label className="block text-[#888] mb-1 font-medium text-[11px]">Enseigne / Station-service</label>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#666]" />
              <input
                type="text"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                placeholder="Ex: TotalEnergies, Leclerc..."
                className="bg-transparent text-[#F0F0F0] w-full outline-none font-medium text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {COMMON_STATIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStation(s)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer ${
                    station === s
                      ? 'bg-[#141414] border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-[#0A0A0A] border-[#2A2A2A] text-[#888] hover:text-[#F0F0F0]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#888] mb-1 font-medium text-[11px]">Notes (optionnel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Trajet vacances, pression pneus vérifiée..."
              className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#1E1E1E] text-xs font-medium text-[#888] border border-[#2A2A2A] transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              id="save-fuel-btn"
              className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C5A028] text-xs font-semibold text-black flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {editingLog ? 'Enregistrer les modifications' : 'Valider le plein'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
