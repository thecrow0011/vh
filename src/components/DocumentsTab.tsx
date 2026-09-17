import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Pencil,
  Phone, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  Info
} from 'lucide-react';
import { VehicleDocument } from '../types';
import { formatDateFr, getDocumentStatus } from '../utils/calculations';

interface DocumentsTabProps {
  documents: VehicleDocument[];
  onOpenAddDocument: () => void;
  onEditDocument: (doc: VehicleDocument) => void;
  onDeleteDocument: (id: string) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  onOpenAddDocument,
  onEditDocument,
  onDeleteDocument,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  // Compute status counts
  const expiredDocs = documents.filter((d) => getDocumentStatus(d).status === 'expired');
  const urgentDocs = documents.filter((d) => getDocumentStatus(d).status === 'urgent');
  const warningDocs = documents.filter((d) => getDocumentStatus(d).status === 'warning');
  const validDocs = documents.filter((d) => getDocumentStatus(d).status === 'valid');

  const filteredDocs = documents
    .filter((d) => {
      if (filterType === 'urgent') return getDocumentStatus(d).status === 'expired' || getDocumentStatus(d).status === 'urgent';
      if (filterType === 'warning') return getDocumentStatus(d).status === 'warning';
      if (filterType === 'valid') return getDocumentStatus(d).status === 'valid';
      return true;
    })
    .sort((a, b) => getDocumentStatus(a).daysLeft - getDocumentStatus(b).daysLeft);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 text-[#F0F0F0] pb-28 font-sans bg-[#0A0A0A]">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif italic text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D4AF37]" />
            Documents & Échéances
          </h2>
          <p className="text-xs text-[#888] mt-0.5">
            Rappels automatiques de contrôle technique & assurance
          </p>
        </div>

        <button
          onClick={onOpenAddDocument}
          className="px-3.5 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter document
        </button>
      </div>

      {/* Urgent Warning Box if any document is expired or expiring soon */}
      {(expiredDocs.length > 0 || urgentDocs.length > 0) && (
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#FF3B30]/40 space-y-1.5">
          <div className="flex items-center gap-2 text-[#FF3B30] font-semibold text-xs tracking-wide">
            <ShieldAlert className="w-4 h-4 text-[#FF3B30]" />
            <span className="uppercase text-[10px] tracking-[0.15em] font-bold">Alerte Prioritaire : {expiredDocs.length + urgentDocs.length} document(s) à renouveler</span>
          </div>
          <p className="text-xs text-[#888]">
            Le défaut de contrôle technique ou d'assurance vous expose à une immobilisation immédiate du véhicule et une forte amende.
          </p>
        </div>
      )}

      {/* Status Counters */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setFilterType(filterType === 'urgent' ? 'all' : 'urgent')}
          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
            filterType === 'urgent'
              ? 'bg-[#1E1414] border-[#FF3B30] text-[#FF3B30]'
              : 'bg-[#141414] border-[#2A2A2A] text-[#888] hover:border-[#444]'
          }`}
        >
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#FF3B30] block">Critique</span>
          <span className="text-xl font-light font-mono text-[#F0F0F0] mt-0.5 block">
            {expiredDocs.length + urgentDocs.length}
          </span>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'warning' ? 'all' : 'warning')}
          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
            filterType === 'warning'
              ? 'bg-[#1B1914] border-[#D4AF37] text-[#D4AF37]'
              : 'bg-[#141414] border-[#2A2A2A] text-[#888] hover:border-[#444]'
          }`}
        >
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block">À prévoir</span>
          <span className="text-xl font-light font-mono text-[#F0F0F0] mt-0.5 block">{warningDocs.length}</span>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'valid' ? 'all' : 'valid')}
          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
            filterType === 'valid'
              ? 'bg-[#141B15] border-[#00FF41] text-[#00FF41]'
              : 'bg-[#141414] border-[#2A2A2A] text-[#888] hover:border-[#444]'
          }`}
        >
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#00FF41] block">Conforme</span>
          <span className="text-xl font-light font-mono text-[#F0F0F0] mt-0.5 block">{validDocs.length}</span>
        </button>
      </div>

      {/* Document Cards List */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="p-8 text-center bg-[#141414] rounded-2xl border border-[#2A2A2A]">
            <FileText className="w-8 h-8 text-[#555] mx-auto mb-2" />
            <p className="text-sm font-serif italic text-[#CCC]">Aucun document dans cette catégorie</p>
            <p className="text-xs text-[#666] mt-1">
              Enregistrez vos certificats et contrats pour recevoir des alertes automatiques.
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const { status, daysLeft, label } = getDocumentStatus(doc);

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-2xl bg-[#141414] border transition-all flex flex-col gap-2.5 relative group ${
                  status === 'expired' || status === 'urgent'
                    ? 'border-[#FF3B30]/50'
                    : status === 'warning'
                    ? 'border-[#D4AF37]/50'
                    : 'border-[#2A2A2A] hover:border-[#D4AF37]/40'
                }`}
              >
                {/* Header of card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                        status === 'expired' || status === 'urgent'
                          ? 'bg-[#1B1B1B] text-[#FF3B30] border-[#FF3B30]/30'
                          : status === 'warning'
                          ? 'bg-[#1B1B1B] text-[#D4AF37] border-[#D4AF37]/30'
                          : 'bg-[#1B1B1B] text-[#00FF41] border-[#00FF41]/30'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-lg font-serif italic text-white leading-snug">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-[#888] mt-0.5">
                        {doc.provider ? `${doc.provider} ` : ''}
                        {doc.documentNumber && (
                          <span className="font-mono text-[#666]">
                            • N° {doc.documentNumber}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Expiry Pill */}
                  <span
                    className={`text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full whitespace-nowrap border ${
                      status === 'expired' || status === 'urgent'
                        ? 'bg-[#1B1B1B] text-[#FF3B30] border-[#FF3B30]/40'
                        : status === 'warning'
                        ? 'bg-[#1B1B1B] text-[#D4AF37] border-[#D4AF37]/40'
                        : 'bg-[#1B1B1B] text-[#00FF41] border-[#00FF41]/40'
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {/* Expiry Dates detail */}
                <div className="p-2.5 rounded-xl bg-[#0A0A0A] border border-[#222222] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#888]">
                    <Calendar className="w-3.5 h-3.5 text-[#666]" />
                    <span>Expire le :</span>
                    <span className="font-medium text-[#F0F0F0]">
                      {formatDateFr(doc.expiryDate)}
                    </span>
                  </div>

                  <span className="text-[10px] text-[#666] font-mono">
                    Alerte à J-{doc.notifyDaysBefore}
                  </span>
                </div>

                {/* Emergency assistance phone button if available */}
                {doc.emergencyContact && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0A0A0A] border border-[#222222]">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="text-xs text-[#DDD] font-mono">
                        Assistance : {doc.emergencyContact}
                      </span>
                    </div>
                    <a
                      href={`tel:${doc.emergencyContact}`}
                      className="px-3 py-1 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] text-xs font-medium text-[#D4AF37] border border-[#D4AF37]/40 transition-colors"
                    >
                      Appeler
                    </a>
                  </div>
                )}

                {doc.notes && (
                  <p className="text-[11px] text-[#888] italic px-1">
                    "{doc.notes}"
                  </p>
                )}

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    onClick={() => onEditDocument(doc)}
                    className="text-[#888] hover:text-[#D4AF37] text-xs flex items-center gap-1 p-1 transition-colors cursor-pointer"
                    title="Modifier ce document"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="text-[#666] hover:text-[#FF3B30] text-xs flex items-center gap-1 p-1 transition-colors cursor-pointer"
                    title="Supprimer ce document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legal Guidelines Tip Card - Réglementation Algérienne */}
      <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A] text-xs text-[#888] space-y-1.5">
        <div className="flex items-center gap-1.5 text-[#D4AF37] font-semibold text-[10px] uppercase tracking-[0.15em]">
          <Info className="w-3.5 h-3.5" />
          <span>Rappels réglementaires algériens :</span>
        </div>
        <ul className="list-disc list-inside space-y-1.5 text-[11px] text-[#888] pl-1">
          <li>
            <strong className="text-[#CCC]">Contrôle Technique :</strong> Obligatoire à partir de la 2ème année de mise en circulation pour les véhicules particuliers, puis renouvelable chaque année auprès d'un centre agréé (ENACTA).
          </li>
          <li>
            <strong className="text-[#CCC]">Vignette Automobile :</strong> Obligation fiscale annuelle (DGI), payable au cours de la période légale fixée et à apposer obligatoirement sur le pare-brise.
          </li>
          <li>
            <strong className="text-[#CCC]">Assurance Automobile :</strong> L'assurance (au minimum Responsabilité Civile) est légalement obligatoire pour tout véhicule en circulation sur le territoire national.
          </li>
        </ul>
      </div>
    </div>
  );
};
