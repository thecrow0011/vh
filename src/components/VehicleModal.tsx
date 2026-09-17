import React, { useState } from 'react';
import { X, Car, Check, Fuel, Shield, Hash, Calendar, Palette, Database, Download, Upload, CheckCircle2 } from 'lucide-react';
import { Vehicle, FuelType } from '../types';
import { exportDatabaseBackup, importDatabaseBackup } from '../services/localDatabase';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onSave: (updated: Vehicle) => void;
  onDataReloaded?: () => void;
}

const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: 'essence', label: 'Essence (SP95 / SP98 / E10)' },
  { value: 'diesel', label: 'Diesel / Gazole (B7 / B10)' },
  { value: 'hybride', label: 'Hybride (HEV / PHEV)' },
  { value: 'electrique', label: '100% Électrique' },
  { value: 'e85', label: 'Superéthanol E85' },
  { value: 'gpl', label: 'GPL' },
];

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSave,
  onDataReloaded,
}) => {
  const [formData, setFormData] = useState<Vehicle>(vehicle);
  const [dbStatusMsg, setDbStatusMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setFormData(vehicle);
  }, [vehicle, isOpen]);

  const handleExportBackup = async () => {
    try {
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autogestion_sauvegarde_${vehicle.licensePlate || 'donnees'}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDbStatusMsg('Sauvegarde exportée avec succès.');
      setTimeout(() => setDbStatusMsg(null), 4000);
    } catch {
      setDbStatusMsg('Erreur lors de l\'exportation de la sauvegarde.');
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await importDatabaseBackup(text);
      if (res.success) {
        setDbStatusMsg('Données locales restaurées avec succès !');
        if (onDataReloaded) {
          onDataReloaded();
        }
        setTimeout(() => {
          setDbStatusMsg(null);
          onClose();
        }, 1200);
      } else {
        setDbStatusMsg(res.message);
      }
    } catch {
      setDbStatusMsg('Impossible de lire le fichier de sauvegarde sélectionné.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A0A]/85 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-t-2xl md:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 font-sans">
        <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1B1B1B] text-[#D4AF37] border border-[#2A2A2A] flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif italic text-white">Fiche du véhicule</h3>
              <p className="text-[11px] text-[#888]">Modifier les caractéristiques</p>
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
          {/* Make & Model */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Marque</label>
              <input
                type="text"
                required
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs font-serif italic text-sm"
                placeholder="Ex: Peugeot, Renault..."
              />
            </div>
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Modèle</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs font-serif italic text-sm"
                placeholder="Ex: 208, Clio, Golf..."
              />
            </div>
          </div>

          {/* Trim / Version & Year */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Finition / Moteur</label>
              <input
                type="text"
                value={formData.trim}
                onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs"
                placeholder="Ex: GT Line 1.2 130ch"
              />
            </div>
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Année</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* License Plate & VIN */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Immatriculation</label>
              <input
                type="text"
                required
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#D4AF37] outline-none text-xs font-mono font-bold tracking-wider"
                placeholder="Ex: AA-123-BB"
              />
            </div>
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">N° de Série (VIN)</label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs font-mono"
                placeholder="VF3..."
              />
            </div>
          </div>

          {/* Fuel type & Tank capacity */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Motorisation / Carburant</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs font-medium"
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f.value} value={f.value} className="bg-[#141414] text-[#F0F0F0]">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Capacité Réservoir (L)</label>
              <input
                type="number"
                value={formData.tankCapacity}
                onChange={(e) => setFormData({ ...formData, tankCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* Insurance details */}
          <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 space-y-2">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              Assurance & Assistance d'urgence
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#888] mb-1 font-medium text-[11px]">Compagnie d'assurance</label>
                <input
                  type="text"
                  value={formData.insuranceCompany}
                  onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })}
                  placeholder="Ex: AXA, Macif..."
                  className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#2A2A2A] rounded-lg text-[#F0F0F0] outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-[#888] mb-1 font-medium text-[11px]">Téléphone d'urgence</label>
                <input
                  type="tel"
                  value={formData.emergencyPhone || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="Ex: 01 40 25 50 00"
                  className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#2A2A2A] rounded-lg text-[#F0F0F0] outline-none text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Local Database (IndexedDB) & Backup Status */}
          <div className="p-3 rounded-xl bg-[#0F0F0F] border border-[#2D2D2D] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white">
                <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[11px] font-semibold">Base de données locale (IndexedDB)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Active & Persistante
              </span>
            </div>
            <p className="text-[10px] text-[#888] leading-relaxed">
              Vos informations (véhicule, carburant, entretiens et documents) sont enregistrées localement dans votre navigateur et ne sont pas réinitialisées lors d'un rafraîchissement ou d'un vidage de cache.
            </p>

            {dbStatusMsg && (
              <p className="text-[11px] text-[#D4AF37] font-medium bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/30">
                {dbStatusMsg}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 py-2 px-2.5 rounded-lg bg-[#1A1A1A] hover:bg-[#222] border border-[#333] hover:border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Exporter sauvegarde (JSON)</span>
              </button>

              <label className="flex-1 py-2 px-2.5 rounded-lg bg-[#1A1A1A] hover:bg-[#222] border border-[#333] hover:border-[#D4AF37]/40 text-[#DDD] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Importer sauvegarde</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFileChange}
                  className="hidden"
                />
              </label>
            </div>
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
              id="save-vehicle-profile-btn"
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
