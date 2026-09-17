import React, { useState } from 'react';
import { Plus, X, Fuel, Wrench, FileText, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SpeedDialFABProps {
  onAddFuel: () => void;
  onAddMaintenance: () => void;
  onAddDocument: () => void;
  onUpdateMileage: () => void;
}

export const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({
  onAddFuel,
  onAddMaintenance,
  onAddDocument,
  onUpdateMileage,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Nouveau plein',
      icon: Fuel,
      color: 'bg-[#141414] hover:bg-[#1E1E1E] text-[#D4AF37] border border-[#D4AF37]/50 shadow-lg',
      onClick: () => {
        setIsOpen(false);
        onAddFuel();
      },
      id: 'fab-add-fuel-btn',
    },
    {
      label: 'Nouvel entretien',
      icon: Wrench,
      color: 'bg-[#141414] hover:bg-[#1E1E1E] text-[#00FF41] border border-[#00FF41]/40 shadow-lg',
      onClick: () => {
        setIsOpen(false);
        onAddMaintenance();
      },
      id: 'fab-add-maint-btn',
    },
    {
      label: 'Ajouter document',
      icon: FileText,
      color: 'bg-[#141414] hover:bg-[#1E1E1E] text-[#F0F0F0] border border-[#2A2A2A] shadow-lg',
      onClick: () => {
        setIsOpen(false);
        onAddDocument();
      },
      id: 'fab-add-doc-btn',
    },
    {
      label: 'Compteur km',
      icon: Gauge,
      color: 'bg-[#141414] hover:bg-[#1E1E1E] text-[#AAA] border border-[#2A2A2A] shadow-lg',
      onClick: () => {
        setIsOpen(false);
        onUpdateMileage();
      },
      id: 'fab-add-mileage-btn',
    },
  ];

  return (
    <>
      {/* Backdrop when FAB menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-[#0A0A0A]/85 backdrop-blur-xs z-40"
          />
        )}
      </AnimatePresence>

      <div className="absolute bottom-16 right-4 z-50 flex flex-col items-end gap-2.5 pointer-events-none">
        {/* Action Items */}
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col items-end gap-2.5 pointer-events-auto pb-1">
              {actions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    id={action.id}
                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{ delay: (actions.length - 1 - idx) * 0.04, duration: 0.18 }}
                    onClick={action.onClick}
                    className="flex items-center gap-2.5 group cursor-pointer"
                  >
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#141414] text-[#F0F0F0] shadow-md border border-[#2A2A2A] backdrop-blur font-sans">
                      {action.label}
                    </span>
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 ${action.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Button */}
        <button
          id="main-fab-trigger-btn"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer pointer-events-auto transition-all duration-200 active:scale-95 ${
            isOpen
              ? 'bg-[#1B1B1B] text-[#F0F0F0] rotate-90 border border-[#2A2A2A]'
              : 'bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] shadow-[0_8px_25px_rgba(212,175,55,0.3)] border border-[#E5C158]/40'
          }`}
          aria-label="Menu d'ajout rapide"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6 stroke-[2.5]" />}
        </button>
      </div>
    </>
  );
};
