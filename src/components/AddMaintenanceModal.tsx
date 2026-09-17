import React, { useState, useEffect } from 'react';
import { X, Wrench, Check, Calendar, Building2, FileText, Sparkles, Gauge } from 'lucide-react';
import { MaintenanceRecord, MaintenanceCategory } from '../types';
import { MAINTENANCE_PRESETS } from '../data/initialData';

interface AddMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMileage: number;
  onAddMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  onUpdateMaintenance?: (record: MaintenanceRecord) => void;
  editingRecord?: MaintenanceRecord | null;
}

const CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: 'vidange', label: 'Vidange & Huile' },
  { value: 'freinage', label: 'Freinage' },
  { value: 'pneus', label: 'Pneumatiques' },
  { value: 'filtres', label: 'Filtres' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'batterie', label: 'Batterie' },
  { value: 'controle_technique', label: 'Contrôle Technique' },
  { value: 'autre', label: 'Autre intervention' },
];

export const AddMaintenanceModal: React.FC<AddMaintenanceModalProps> = ({
  isOpen,
  onClose,
  currentMileage,
  onAddMaintenance,
  onUpdateMaintenance,
  editingRecord,
}) => {
  const [title, setTitle] = useState<string>('Vidange moteur & filtre à huile');
  const [category, setCategory] = useState<MaintenanceCategory>('vidange');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState<number>(currentMileage);
  const [cost, setCost] = useState<string>('6500');
  const [garage, setGarage] = useState<string>('Garage Auto Service');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [nextDueMileage, setNextDueMileage] = useState<string>(String(currentMileage + 15000));
  const [nextDueDate, setNextDueDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        setTitle(editingRecord.title);
        setCategory(editingRecord.category);
        setDate(editingRecord.date);
        setMileage(editingRecord.mileage);
        setCost(String(editingRecord.cost));
        setGarage(editingRecord.garage);
        setInvoiceNumber(editingRecord.invoiceNumber || '');
        setNotes(editingRecord.notes || '');
        setNextDueMileage(editingRecord.nextDueMileage ? String(editingRecord.nextDueMileage) : '');
        setNextDueDate(editingRecord.nextDueDate || '');
      } else {
        setTitle('Vidange moteur & filtre à huile');
        setCategory('vidange');
        setDate(new Date().toISOString().split('T')[0]);
        setMileage(currentMileage);
        setCost('6500');
        setGarage('Garage Auto Service');
        setInvoiceNumber('');
        setNotes('');
        setNextDueMileage(String(currentMileage + 15000));
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        setNextDueDate(d.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, currentMileage, editingRecord]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    const preset = MAINTENANCE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setTitle(preset.name);
    setCategory(preset.category);
    setNotes(preset.description);

    // Compute next due mileage & date
    setNextDueMileage(String(mileage + preset.intervalKm));
    const d = new Date(date);
    d.setMonth(d.getMonth() + preset.intervalMonths);
    setNextDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord && onUpdateMaintenance) {
      onUpdateMaintenance({
        ...editingRecord,
        title: title.trim(),
        category,
        date,
        mileage: Number(mileage),
        cost: parseFloat(cost) || 0,
        garage: garage.trim() || 'Garage indépendant',
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        nextDueMileage: nextDueMileage ? Number(nextDueMileage) : undefined,
        nextDueDate: nextDueDate || undefined,
        completed: true,
      });
    } else {
      onAddMaintenance({
        vehicleId: 'veh-01',
        title: title.trim(),
        category,
        date,
        mileage: Number(mileage),
        cost: parseFloat(cost) || 0,
        garage: garage.trim() || 'Garage indépendant',
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        nextDueMileage: nextDueMileage ? Number(nextDueMileage) : undefined,
        nextDueDate: nextDueDate || undefined,
        completed: true,
      });
    }
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A0A]/85 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-t-2xl md:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 font-sans">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1B1B1B] text-[#D4AF37] border border-[#2A2A2A] flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif italic text-white">
                {editingRecord ? "Modifier l'intervention" : 'Enregistrer un entretien'}
              </h3>
              <p className="text-[11px] text-[#888]">
                {editingRecord ? 'Mettre à jour cette révision ou réparation' : 'Carnet de révision & factures'}
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
          {/* Quick Preset Selector */}
          <div>
            <div className="flex items-center gap-1 text-[#888] font-medium text-[11px] mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Modèles d'opérations courantes :</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {MAINTENANCE_PRESETS.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#0A0A0A] hover:bg-[#1C1C1C] text-[#888] hover:text-[#D4AF37] border border-[#2A2A2A] text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {p.name.split('&')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Category */}
          <div className="space-y-2">
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Libellé de l'intervention</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Vidange moteur 5W30 + filtre"
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs font-serif italic text-sm"
              />
            </div>

            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-[#141414] text-[#F0F0F0]">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Mileage, Cost */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Kilométrage</label>
              <input
                type="number"
                required
                min="0"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full px-2 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Coût (DA)</label>
              <input
                type="number"
                step="1"
                required
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Ex: 6500"
                className="w-full px-2 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#D4AF37] outline-none text-xs font-mono font-semibold"
              />
            </div>
          </div>

          {/* Garage & Invoice Number */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Garage / Établissement</label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
                <Building2 className="w-3.5 h-3.5 text-[#666]" />
                <input
                  type="text"
                  value={garage}
                  onChange={(e) => setGarage(e.target.value)}
                  placeholder="Ex: Concessionnaire, Speedy..."
                  className="bg-transparent text-[#F0F0F0] w-full outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">N° de Facture</label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
                <FileText className="w-3.5 h-3.5 text-[#666]" />
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex: FAC-2026-09"
                  className="bg-transparent text-[#F0F0F0] w-full outline-none text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Prochaine échéance calculée */}
          <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 space-y-2">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              Prochaine échéance recommandée (Rappels)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[#888]">Prochain km :</span>
                <input
                  type="number"
                  value={nextDueMileage}
                  onChange={(e) => setNextDueMileage(e.target.value)}
                  placeholder="Ex: 63000"
                  className="w-full mt-0.5 px-2.5 py-1.5 bg-[#141414] border border-[#2A2A2A] rounded-lg text-[#F0F0F0] font-mono font-medium outline-none text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#888]">Prochaine date :</span>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full mt-0.5 px-2.5 py-1.5 bg-[#141414] border border-[#2A2A2A] rounded-lg text-[#F0F0F0] outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#888] mb-1 font-medium text-[11px]">Observations / Pièces</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pression des pneus effectuée, huile 5W30 préconisée..."
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
              id="save-maintenance-btn"
              className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C5A028] text-xs font-semibold text-black flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {editingRecord ? 'Enregistrer les modifications' : "Enregistrer l'entretien"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
