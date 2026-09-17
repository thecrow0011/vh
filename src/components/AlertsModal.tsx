import React from 'react';
import { X, Bell, AlertTriangle, Info, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AppNotification, TabType } from '../types';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onNavigateTab: (tab: TabType) => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const urgentAlerts = notifications.filter((n) => n.severity === 'urgent');
  const warningAlerts = notifications.filter((n) => n.severity === 'warning');

  const handleActionClick = (targetTab?: TabType) => {
    if (targetTab) {
      onNavigateTab(targetTab);
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A0A]/85 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-t-2xl md:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 font-sans">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1B1B1B] text-[#D4AF37] border border-[#2A2A2A] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif italic text-white">Centre de rappels & alertes</h3>
              <p className="text-[11px] text-[#888]">
                {notifications.length} alerte{notifications.length > 1 ? 's' : ''} active{notifications.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#888] hover:text-white hover:bg-[#1B1B1B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-[#141B15] border border-[#00FF41]/40 text-[#00FF41] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-serif italic text-white">Tout est parfaitement conforme</p>
              <p className="text-xs text-[#666] mt-1">
                Aucun document expiré ni entretien en retard.
              </p>
            </div>
          ) : (
            <>
              {urgentAlerts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#FF3B30] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Urgences prioritaires ({urgentAlerts.length})
                  </span>
                  {urgentAlerts.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3.5 rounded-xl bg-[#1E1414] border border-[#FF3B30]/40 flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-serif italic text-white leading-tight">
                          {notif.title}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#141414] text-[#FF3B30] border border-[#FF3B30]/40">
                          Critique
                        </span>
                      </div>
                      <p className="text-xs text-[#AAA] leading-relaxed">{notif.message}</p>
                      {notif.targetTab && (
                        <button
                          onClick={() => handleActionClick(notif.targetTab)}
                          className="mt-1 self-start text-[11px] font-medium text-[#D4AF37] hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          Consulter la fiche
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {warningAlerts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    À prévoir prochainement ({warningAlerts.length})
                  </span>
                  {warningAlerts.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3.5 rounded-xl bg-[#1B1914] border border-[#D4AF37]/40 flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-serif italic text-white leading-tight">
                          {notif.title}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#141414] text-[#D4AF37] border border-[#D4AF37]/40">
                          À prévoir
                        </span>
                      </div>
                      <p className="text-xs text-[#AAA] leading-relaxed">{notif.message}</p>
                      {notif.targetTab && (
                        <button
                          onClick={() => handleActionClick(notif.targetTab)}
                          className="mt-1 self-start text-[11px] font-medium text-[#D4AF37] hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          Gérer cette échéance
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2A2A2A] bg-[#0A0A0A]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-xs font-medium text-[#D4AF37] border border-[#D4AF37]/30 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
