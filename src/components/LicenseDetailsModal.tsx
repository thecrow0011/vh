import React, { useState } from 'react';
import { X, ShieldCheck, KeyRound, Calendar, Copy, Check, RefreshCw, Car, User, AlertTriangle, Shield, ShieldAlert, Clock } from 'lucide-react';
import { License } from '../types';

interface LicenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: License | null;
  daysRemaining: number;
  vehiclePlate: string;
  onRenew?: (code?: string) => Promise<boolean>;
  onOpenAdmin: () => void;
  onRefresh?: () => Promise<void>;
  onActivate?: (newKey: string) => Promise<{ success: boolean; message: string }>;
  onRemoveLicense?: () => void;
}

export const LicenseDetailsModal: React.FC<LicenseDetailsModalProps> = ({
  isOpen,
  onClose,
  license,
  daysRemaining,
  vehiclePlate,
  onOpenAdmin,
  onRefresh,
  onActivate,
  onRemoveLicense,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showSwitchForm, setShowSwitchForm] = useState<boolean>(false);
  const [switchKeyInput, setSwitchKeyInput] = useState<string>('');
  const [switchLoading, setSwitchLoading] = useState<boolean>(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Auto-refresh from server whenever the modal is opened
  React.useEffect(() => {
    if (isOpen && onRefresh) {
      setRefreshing(true);
      onRefresh().finally(() => setRefreshing(false));
    }
  }, [isOpen, onRefresh]);

  if (!isOpen) return null;

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    setMessage(null);
    try {
      await onRefresh();
      // If the license is expired, invalid, or daysRemaining <= 0, close this modal so the lock modal takes over immediately!
      if (daysRemaining <= 0 || license?.status === 'expired' || license?.status === 'revoked') {
        onClose();
        return;
      }
      setMessage(`Statut synchronisé avec succès : ${daysRemaining} jour(s) restants.`);
    } catch {
      setMessage('Impossible de contacter le serveur. Mode autonome actif.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSwitchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchKeyInput.trim() || !onActivate) return;
    setSwitchLoading(true);
    setSwitchError(null);
    try {
      const res = await onActivate(switchKeyInput.trim().toUpperCase());
      if (res.success) {
        setShowSwitchForm(false);
        setSwitchKeyInput('');
        setMessage(res.message);
      } else {
        setSwitchError(res.message || 'Clé de licence invalide ou expirée.');
      }
    } catch {
      setSwitchError('Erreur de communication.');
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleCopy = () => {
    if (license?.licenseKey) {
      navigator.clipboard.writeText(license.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const percentLeft = Math.min(100, Math.max(0, (daysRemaining / 365) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#121212] border border-[#2A2A2A] rounded-3xl p-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif italic text-white leading-tight">Licence AutoGestion</h3>
              <p className="text-[10px] uppercase font-mono tracking-wider text-[#888]">
                Mode Connecté • Licence à usage unique
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#1A1A1A] text-[#888] hover:text-white border border-[#2A2A2A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* License Main Status Card */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-[#181818] to-[#0F0F0F] border border-[#2D2D2D] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-mono tracking-wider text-[#888] font-semibold">
              Statut du Contrat
            </span>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  title="Actualiser avec le serveur"
                  className="p-1 rounded-lg bg-[#222] hover:bg-[#333] text-[#AAA] hover:text-[#D4AF37] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 text-[10px]"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
                  <span className="hidden sm:inline">Synchro</span>
                </button>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  daysRemaining > 30
                    ? 'bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40'
                    : daysRemaining > 0
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                    : 'bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/40'
                }`}
              >
                {daysRemaining > 0 ? 'Active' : 'Expirée'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-2 mb-1">
            <div>
              <span className="text-3xl font-light font-mono text-white tracking-tight">{daysRemaining}</span>
              <span className="text-xs text-[#888] ml-1.5 font-sans">jours restants</span>
            </div>
            <span className="text-xs font-mono text-[#D4AF37]">
              {license?.expiresAt ? new Date(license.expiresAt).toLocaleDateString('fr-FR') : '—'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden mt-3 mb-1">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                daysRemaining > 30 ? 'bg-[#34C759]' : daysRemaining > 7 ? 'bg-[#D4AF37]' : 'bg-[#FF3B30]'
              }`}
              style={{ width: `${percentLeft}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-[#666] font-mono">
            <span>Activation (1 an)</span>
            <span>Échéance</span>
          </div>
        </div>

        {/* License details list */}
        <div className="space-y-2 text-xs">
          {/* License Key with copy */}
          <div className="p-2.5 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#D4AF37]" />
              <div>
                <span className="text-[10px] text-[#777] block leading-tight">Clé de Licence</span>
                <span className="font-mono text-white font-medium text-xs tracking-wider">
                  {license?.licenseKey || 'DZ-AUTO-XXXX-XXXX'}
                </span>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-[#222] hover:bg-[#333] border border-[#3A3A3A] text-[11px] text-[#CCC] flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié' : 'Copier'}</span>
            </button>
          </div>

          {/* Client & Vehicle */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#262626]">
              <div className="flex items-center gap-1.5 text-[#777] text-[10px] mb-0.5">
                <User className="w-3 h-3 text-[#D4AF37]" />
                <span>Titulaire</span>
              </div>
              <span className="font-medium text-white text-xs truncate block">
                {license?.clientName || 'Utilisateur'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#262626]">
              <div className="flex items-center gap-1.5 text-[#777] text-[10px] mb-0.5">
                <Car className="w-3 h-3 text-[#D4AF37]" />
                <span>Immatriculation</span>
              </div>
              <span className="font-mono font-medium text-white text-xs truncate block">
                {license?.vehiclePlate || vehiclePlate || '—'}
              </span>
            </div>
          </div>

          {/* Single-Use & Expiry notice */}
          <div className="p-2.5 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-between">
            <span className="text-[#888]">Type d'utilisation :</span>
            <span className="font-mono font-semibold text-[#34C759] px-2 py-0.5 rounded bg-[#1B281E] border border-[#34C759]/30 text-[11px]">
              Usage unique (Actif)
            </span>
          </div>

          {/* Periodic check notice */}
          <div className="p-2.5 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#888] text-xs">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Contrôle de l'état :</span>
            </div>
            <span className="text-[11px] font-medium text-[#CCC] bg-[#202020] px-2 py-0.5 rounded border border-[#333]">
              Automatique (toutes les 10 min)
            </span>
          </div>

          {/* Switch License Option */}
          {onActivate && (
            <div className="pt-1">
              {!showSwitchForm ? (
                <button
                  type="button"
                  onClick={() => setShowSwitchForm(true)}
                  className="w-full py-2 px-3 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-xs font-medium text-[#D4AF37] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Activer ou changer de clé de licence</span>
                </button>
              ) : (
                <form onSubmit={handleSwitchSubmit} className="p-3 rounded-xl bg-[#181818] border border-[#2D2D2D] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Activer une nouvelle licence</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSwitchForm(false);
                        setSwitchError(null);
                      }}
                      className="text-[#888] hover:text-white text-[11px]"
                    >
                      Annuler
                    </button>
                  </div>
                  <input
                    type="text"
                    value={switchKeyInput}
                    onChange={(e) => setSwitchKeyInput(e.target.value.toUpperCase())}
                    placeholder="DZ-AUTO-XXXX-XXXX"
                    className="w-full px-3 py-2 rounded-lg bg-[#0F0F0F] border border-[#333] text-white font-mono text-xs focus:border-[#D4AF37] outline-none"
                    autoFocus
                  />
                  {switchError && (
                    <div className="p-2.5 rounded-lg bg-[#FF3B30]/15 border border-[#FF3B30]/30 text-[11px] text-[#FF453A] flex items-start gap-1.5 text-left">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        {switchError.toLowerCase().includes('autre') || switchError.toLowerCase().includes('verrouillée') ? (
                          <p className="font-semibold text-white">Licence Unique par Téléphone</p>
                        ) : null}
                        <p>{switchError}</p>
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={switchLoading || !switchKeyInput.trim()}
                    className="w-full py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C59F2E] text-black font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {switchLoading ? 'Activation en cours...' : 'Valider et activer cette clé'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Message Banner */}
        {message && (
          <div className="mt-3 p-3 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs text-[#E5C358]">
            {message}
          </div>
        )}

        {/* Expiration Protection & Admin Action */}
        <div className="mt-4 pt-3 border-t border-[#222] space-y-3">
          <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] text-left">
            <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-semibold mb-1">
              <Shield className="w-4 h-4" />
              <span>Gestion de la date d'expiration</span>
            </div>
            <p className="text-[11px] text-[#888] leading-relaxed">
              Cette licence est à <span className="text-white font-medium">usage unique</span>. La date d'expiration ne peut être modifiée, prolongée ou renouvelée que par <span className="text-white font-medium">l'administrateur</span>.
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenAdmin();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] active:scale-[0.99] text-black font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <Shield className="w-4 h-4" />
            <span>Accéder à la console administrateur</span>
          </button>

          {onRemoveLicense && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRemoveLicense();
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#1A1A1A] hover:bg-[#222] text-[#888] hover:text-[#FF453A] text-xs transition-colors cursor-pointer text-center"
            >
              Retirer cette licence de ce téléphone (tester le formulaire d'activation)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
