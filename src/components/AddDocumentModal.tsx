import React, { useState, useEffect } from 'react';
import { X, FileText, Check, Calendar, Phone, ShieldCheck, Tag } from 'lucide-react';
import { VehicleDocument, DocumentType } from '../types';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (doc: Omit<VehicleDocument, 'id'>) => void;
  onUpdateDocument?: (doc: VehicleDocument) => void;
  editingDoc?: VehicleDocument | null;
}

const DOC_TYPES: { type: DocumentType; label: string; defaultDays: number; defaultTitle: string }[] = [
  { type: 'controle_technique', label: 'Contrôle Technique', defaultDays: 45, defaultTitle: 'Contrôle Technique Périodique (ENACTA)' },
  { type: 'assurance', label: 'Assurance Auto', defaultDays: 30, defaultTitle: 'Assurance Automobile' },
  { type: 'carte_grise', label: 'Carte Grise (Immatriculation)', defaultDays: 60, defaultTitle: 'Carte Grise' },
  { type: 'critair', label: 'Vignette Automobile', defaultDays: 30, defaultTitle: 'Vignette Automobile Annuelle (DGI)' },
  { type: 'permis', label: 'Permis de Conduire', defaultDays: 90, defaultTitle: 'Permis de Conduire Biométrique' },
  { type: 'garantie', label: 'Garantie Constructeur', defaultDays: 30, defaultTitle: 'Extension de Garantie' },
  { type: 'assistance', label: 'Assistance Dépannage', defaultDays: 30, defaultTitle: 'Assistance Panne / Remorquage' },
  { type: 'autre', label: 'Autre Document', defaultDays: 30, defaultTitle: 'Document officiel' },
];

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  onAddDocument,
  onUpdateDocument,
  editingDoc,
}) => {
  const [docType, setDocType] = useState<DocumentType>('controle_technique');
  const [title, setTitle] = useState<string>('Contrôle Technique Périodique (ENACTA)');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [provider, setProvider] = useState<string>('Centre Agréé ENACTA');
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1); // 1 an pour le contrôle technique périodique
    return d.toISOString().split('T')[0];
  });
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<number>(45);
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (editingDoc) {
        setDocType(editingDoc.type);
        setTitle(editingDoc.title);
        setDocumentNumber(editingDoc.documentNumber || '');
        setProvider(editingDoc.provider || '');
        setIssueDate(editingDoc.issueDate || '');
        setExpiryDate(editingDoc.expiryDate);
        setNotifyDaysBefore(editingDoc.notifyDaysBefore || 30);
        setEmergencyContact(editingDoc.emergencyContact || '');
        setNotes(editingDoc.notes || '');
      } else {
        setDocType('controle_technique');
        setTitle('Contrôle Technique Périodique (ENACTA)');
        setDocumentNumber('');
        setProvider('Centre Agréé ENACTA');
        setIssueDate(new Date().toISOString().split('T')[0]);
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        setExpiryDate(d.toISOString().split('T')[0]);
        setNotifyDaysBefore(45);
        setEmergencyContact('');
        setNotes('');
      }
    }
  }, [isOpen, editingDoc]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: DocumentType) => {
    setDocType(newType);
    const found = DOC_TYPES.find((d) => d.type === newType);
    if (found) {
      setTitle(found.defaultTitle);
      setNotifyDaysBefore(found.defaultDays);

      // Default reasonable expiry date
      const d = new Date();
      if (newType === 'controle_technique') {
        d.setFullYear(d.getFullYear() + 2);
      } else if (newType === 'assurance') {
        d.setFullYear(d.getFullYear() + 1);
      } else if (newType === 'carte_grise' || newType === 'critair') {
        d.setFullYear(d.getFullYear() + 10);
      } else {
        d.setFullYear(d.getFullYear() + 1);
      }
      setExpiryDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoc && onUpdateDocument) {
      onUpdateDocument({
        ...editingDoc,
        title: title.trim(),
        type: docType,
        documentNumber: documentNumber.trim() || undefined,
        provider: provider.trim() || undefined,
        issueDate: issueDate || undefined,
        expiryDate,
        notifyDaysBefore,
        notes: notes.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
      });
    } else {
      onAddDocument({
        vehicleId: 'veh-01',
        title: title.trim(),
        type: docType,
        documentNumber: documentNumber.trim() || undefined,
        provider: provider.trim() || undefined,
        issueDate: issueDate || undefined,
        expiryDate,
        notifyDaysBefore,
        notes: notes.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
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
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif italic text-white">
                {editingDoc ? 'Modifier le document' : 'Ajouter un document'}
              </h3>
              <p className="text-[11px] text-[#888]">
                {editingDoc ? 'Mettre à jour les dates et informations' : "Rappels d'échéances et conformité"}
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
          {/* Document Type Selector */}
          <div>
            <label className="block text-[#888] mb-1 font-medium text-[11px]">Type de document officiel</label>
            <select
              value={docType}
              onChange={(e) => handleTypeChange(e.target.value as DocumentType)}
              className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs font-serif italic text-sm"
            >
              {DOC_TYPES.map((d) => (
                <option key={d.type} value={d.type} className="bg-[#141414] text-[#F0F0F0]">
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title & Document Number */}
          <div className="space-y-2">
            <div>
              <label className="block text-[#888] mb-1 font-medium text-[11px]">Intitulé du document</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Contrôle technique, Assurance..."
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#888] mb-1 font-medium text-[11px]">N° de police / dossier</label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Ex: CT-9824, POL-123..."
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[#888] mb-1 font-medium text-[11px]">Organisme / Émetteur</label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="Ex: SAA, CAAT, CIAR, ENACTA, DGI..."
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-[#F0F0F0] outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Expiry Date & Reminder Threshold */}
          <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 space-y-2.5">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              Dates & Alertes d'expiration
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#888] mb-1 font-medium text-[11px]">Date d'émission</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#2A2A2A] rounded-lg text-[#F0F0F0] outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 text-[11px]">Date d'expiration *</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#D4AF37]/40 rounded-lg text-[#D4AF37] font-medium outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#888] mb-1 text-[11px]">Rappel d'alerte à l'avance :</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[15, 30, 45, 60].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setNotifyDaysBefore(days)}
                    className={`py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                      notifyDaysBefore === days
                        ? 'bg-[#141414] text-[#D4AF37] border-[#D4AF37]'
                        : 'bg-[#141414] text-[#888] border-[#2A2A2A] hover:text-[#F0F0F0]'
                    }`}
                  >
                    {days} jours
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assistance / Emergency phone */}
          <div>
            <label className="block text-[#888] mb-1 font-medium text-[11px]">
              Numéro d'urgence / Assistance en cas de panne
            </label>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl">
              <Phone className="w-3.5 h-3.5 text-[#666]" />
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Ex: 01 45 16 43 00"
                className="bg-transparent text-[#F0F0F0] w-full outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#888] mb-1 font-medium text-[11px]">Commentaires ou consignes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Franchise bris de glace 0 DA, double des clés chez le notaire..."
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
              id="save-document-btn"
              className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C5A028] text-xs font-semibold text-black flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {editingDoc ? 'Enregistrer les modifications' : 'Ajouter le document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
