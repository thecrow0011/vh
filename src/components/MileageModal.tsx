import React, { useState } from 'react';
import { X, Gauge, Check, Plus, Minus } from 'lucide-react';
import { formatKm } from '../utils/calculations';

interface MileageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMileage: number;
  onSave: (newMileage: number) => void;
}

export const MileageModal: React.FC<MileageModalProps> = ({
  isOpen,
  onClose,
  currentMileage,
  onSave,
}) => {
  const [mileage, setMileage] = useState<number>(currentMileage);

  // Sync state if modal opens
  React.useEffect(() => {
    setMileage(currentMileage);
  }, [currentMileage, isOpen]);

  if (!isOpen) return null;

  const handleQuickAdd = (amount: number) => {
    setMileage((prev) => Math.max(0, prev + amount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mileage >= 0) {
      onSave(mileage);
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A0A]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1B1B1B] text-[#D4AF37] border border-[#2A2A2A] flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif italic text-white">Mettre à jour le compteur</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#888] hover:text-white hover:bg-[#1B1B1B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="text-center py-3 bg-[#0A0A0A] rounded-xl border border-[#222222]">
            <span className="text-[10px] uppercase font-semibold tracking-[0.2em] text-[#888] block">
              Kilométrage actuel
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <input
                id="mileage-input-field"
                type="number"
                min="0"
                step="1"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="font-mono text-3xl font-light text-center text-[#D4AF37] bg-transparent outline-none w-48"
                autoFocus
              />
              <span className="text-sm font-medium text-[#888]">km</span>
            </div>
            <p className="text-[11px] text-[#666] mt-1 font-mono">
              Précédent : {formatKm(currentMileage)}
            </p>
          </div>

          {/* Quick Increment Buttons */}
          <div className="space-y-1.5">
            <span className="text-xs text-[#888]">Ajustement rapide :</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[+50, +100, +250, +500].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleQuickAdd(step)}
                  className="py-1.5 px-2 rounded-xl bg-[#0A0A0A] hover:bg-[#1C1C1C] text-xs font-mono text-[#DDD] border border-[#2A2A2A] transition-colors cursor-pointer"
                >
                  +{step}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#1C1C1C] text-xs font-medium text-[#888] border border-[#2A2A2A] transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              id="save-mileage-btn"
              className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C5A028] text-xs font-semibold text-black flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
