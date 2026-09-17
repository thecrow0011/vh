import React, { useState } from 'react';
import { ShieldAlert, KeyRound, CheckCircle2, Lock, ArrowRight, Shield, RefreshCw, Smartphone, Calendar, AlertTriangle } from 'lucide-react';
import { License } from '../types';
import { getOrCreateDeviceId, getDeviceName } from '../services/licenseService';

interface LicenseLockModalProps {
  isOpen: boolean;
  currentLicense: License | null;
  hasInstalledLicense?: boolean;
  installedLicenseKey?: string;
  status: string;
  daysRemaining: number;
  message: string;
  vehiclePlate: string;
  onActivate: (key: string) => Promise<{ success: boolean; message: string; isUsedConflict?: boolean } | boolean>;
  onOpenAdmin: () => void;
  onRemoveLicense?: () => void;
}

export const LicenseLockModal: React.FC<LicenseLockModalProps> = ({
  isOpen,
  currentLicense,
  hasInstalledLicense = false,
  installedLicenseKey,
  status,
  daysRemaining,
  message,
  vehiclePlate,
  onActivate,
  onOpenAdmin,
  onRemoveLicense,
}) => {
  const [inputKey, setInputKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; msg: string; isUsedConflict?: boolean } | null>(null);

  if (!isOpen) return null;

  const deviceId = getOrCreateDeviceId();
  const deviceName = getDeviceName();

  // Une licence est installée sur ce téléphone si currentLicense existe, ou hasInstalledLicense est vrai, ou installedLicenseKey est non vide
  const hasInstalled = Boolean(
    hasInstalledLicense ||
    (currentLicense && currentLicense.licenseKey) ||
    (installedLicenseKey && installedLicenseKey.trim().length > 0)
  );

  // Le formulaire / avertissement "Licence Unique par Téléphone"
  // ne doit s'afficher que si la licence testée/renouvelée est DÉJÀ UTILISÉE sur un autre téléphone
  const isUsedConflict =
    status === 'device_mismatch' ||
    Boolean(feedback?.isUsedConflict) ||
    feedback?.msg?.toLowerCase().includes('autre') ||
    feedback?.msg?.toLowerCase().includes('verrouillée') ||
    feedback?.msg?.toLowerCase().includes('déjà activée') ||
    feedback?.msg?.toLowerCase().includes('déjà utilisée') ||
    message?.toLowerCase().includes('autre') ||
    message?.toLowerCase().includes('verrouillée');

  // Vérification si la licence est véritablement expirée au calendrier
  const isTrulyExpired =
    status === 'expired' ||
    (Boolean(currentLicense?.expiresAt) && new Date(currentLicense!.expiresAt).getTime() <= Date.now()) ||
    (daysRemaining <= 0 && status !== 'active' && status !== 'expiring_soon' && status !== 'pending');

  let modalTitle = 'Activation de Licence';
  let badgeText = 'Activation Requise';
  let subtitleText = "Veuillez saisir votre clé de licence pour activer l'application sur cet appareil.";
  let submitLabel = 'Valider et Activer la Licence';
  let inputLabel = 'Saisir votre clé de licence :';

  if (isUsedConflict) {
    modalTitle = 'Licence Unique par Téléphone';
    badgeText = 'Appareil Non Autorisé';
    subtitleText = 'Cette clé de licence est active sur un autre appareil. Vous pouvez la délier depuis l\'espace admin ou transférer l\'activation.';
    submitLabel = 'Valider une autre clé';
    inputLabel = 'Saisir une autre clé de licence disponible :';
  } else if (status === 'revoked') {
    modalTitle = 'Licence Révoquée';
    badgeText = 'Licence Révoquée';
    subtitleText = "Cette licence a été suspendue ou révoquée par l'administrateur.";
    submitLabel = 'Saisir une nouvelle clé';
    inputLabel = 'Saisir une nouvelle clé de licence :';
  } else if (isTrulyExpired) {
    modalTitle = 'Renouvellement de Licence';
    badgeText = 'Licence Expirée';
    subtitleText = currentLicense?.expiresAt
      ? `Votre licence annuelle a expiré le ${new Date(currentLicense.expiresAt).toLocaleDateString('fr-FR')}. Saisissez votre clé de renouvellement pour prolonger d'un an.`
      : "Votre licence annuelle a expiré. Veuillez saisir votre clé de renouvellement pour prolonger d'un an.";
    submitLabel = 'Valider et Renouveler';
    inputLabel = 'Saisir votre clé de renouvellement :';
  } else if (hasInstalled) {
    modalTitle = 'Validation de Licence';
    badgeText = 'Validation Requise';
    subtitleText = message || "Veuillez confirmer l'activation de votre clé de licence pour cet appareil.";
    submitLabel = 'Valider la Licence';
    inputLabel = 'Confirmer votre clé de licence :';
  } else {
    // AUCUNE licence installée sur ce téléphone
    modalTitle = 'Activation de Licence';
    badgeText = 'Activation Requise';
    subtitleText = "Veuillez saisir votre clé de licence pour activer l'application sur cet appareil.";
    submitLabel = 'Valider et Activer la Licence';
    inputLabel = 'Saisir votre clé de licence :';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setFeedback({ type: 'error', msg: 'Veuillez saisir votre clé de licence.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await onActivate(inputKey.trim());
      if (typeof res === 'object' && res.success) {
        setFeedback({ type: 'success', msg: res.message || 'Licence activée avec succès !' });
      } else if (res === true) {
        setFeedback({ type: 'success', msg: 'Licence activée avec succès !' });
      } else {
        const errorMsg =
          typeof res === 'object' && res.message
            ? res.message
            : 'Clé non reconnue ou non valide. Vérifiez votre saisie ou contactez votre administrateur.';
        const conflict =
          typeof res === 'object' && Boolean((res as any).isUsedConflict);
        setFeedback({
          type: 'error',
          msg: errorMsg,
          isUsedConflict: conflict,
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Erreur lors de la validation avec le serveur.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDemoKey = (key = 'DZ-AUTO-NEW-DISPO') => {
    setInputKey(key);
    setFeedback(null);
  };

  const isDateExpired = currentLicense?.expiresAt
    ? new Date(currentLicense.expiresAt).getTime() <= Date.now()
    : status === 'expired';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#121212] border border-[#D4AF37]/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors ${
          isUsedConflict ? 'bg-[#FF3B30]/15' : 'bg-[#D4AF37]/10'
        }`} />

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-3 transition-colors ${
            isUsedConflict
              ? 'bg-[#FF3B30]/10 border-[#FF3B30]/30 text-[#FF453A]'
              : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
          }`}>
            {isUsedConflict ? (
              <Smartphone className="w-8 h-8 text-[#FF453A]" />
            ) : isDateExpired ? (
              <Calendar className="w-8 h-8 text-[#D4AF37]" />
            ) : (
              <KeyRound className="w-8 h-8 text-[#D4AF37]" />
            )}
          </div>

          <span className={`text-[10px] font-mono tracking-[0.2em] uppercase font-semibold ${
            isUsedConflict || status === 'revoked' ? 'text-[#FF453A]' : 'text-[#D4AF37]'
          }`}>
            {badgeText}
          </span>

          {/* Titre dynamique : 'Renouvellement de Licence' si une licence est installée, 'Activation de Licence' UNIQUEMENT si aucune licence n'est installée */}
          <h2 className="text-2xl font-serif italic text-white mt-1">
            {modalTitle}
          </h2>

          <p className="text-xs text-[#888] mt-1 max-w-xs">
            {subtitleText}
          </p>
        </div>

        {/* ALERTE CONFLIT D'APPAREIL : Affichée SEULEMENT si la licence renouvelée est DÉJÀ UTILISÉE */}
        {isUsedConflict && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#FF3B30]/15 border border-[#FF3B30]/35 text-left text-xs animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-[#FF453A] mb-1">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Licence déjà active sur un autre téléphone</span>
            </div>
            <p className="text-[11px] text-[#DDD] leading-relaxed mb-2">
              Chaque licence AutoGestion est à usage unique et strictement réservée à un seul appareil. Pour l'utiliser sur ce téléphone, l'administrateur doit d'abord délier l'ancien téléphone ou vous délivrer une nouvelle clé.
            </p>
            <div className="p-2 rounded-xl bg-black/40 border border-[#FF3B30]/20 flex items-center justify-between text-[11px]">
              <span className="text-[#AAA]">Cet appareil :</span>
              <span className="font-mono text-[#D4AF37]">{deviceName} ({deviceId})</span>
            </div>
          </div>
        )}

        {/* Boîte d'informations statut */}
        <div className="mb-5 p-3.5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] text-left space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#777]">Véhicule :</span>
            <span className="font-mono font-semibold text-white px-2 py-0.5 rounded bg-[#252525] border border-[#333]">
              {vehiclePlate || '01245-121-16'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#777]">Téléphone :</span>
            <span className="font-mono text-[#AAA]">{deviceName}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#777]">État du téléphone :</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ${
                isUsedConflict || status === 'revoked'
                  ? 'bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/40'
                  : hasInstalled
                  ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/40'
                  : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
              }`}
            >
              {isUsedConflict
                ? 'Autre appareil'
                : status === 'revoked'
                ? 'Révoquée'
                : hasInstalled
                ? 'Licence installée (Expirée)'
                : 'Aucune licence installée'}
            </span>
          </div>

          {hasInstalled && (currentLicense?.licenseKey || installedLicenseKey) && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#262626]">
              <span className="text-[#777]">Licence enregistrée :</span>
              <span className="font-mono text-[#D4AF37] font-semibold">
                {currentLicense?.licenseKey || installedLicenseKey}
              </span>
            </div>
          )}

          {currentLicense?.expiresAt && !isUsedConflict && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#777]">Date d'échéance :</span>
              <span className="font-mono text-[#AAA]">
                {new Date(currentLicense.expiresAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}

          {message && !message.includes('<') && (
            <p className="text-[11px] text-[#888] mt-2 pt-2 border-t border-[#2A2A2A]">{message}</p>
          )}

          {hasInstalled && onRemoveLicense && (
            <div className="pt-2 border-t border-[#262626] text-right">
              <button
                type="button"
                onClick={onRemoveLicense}
                className="text-[11px] text-[#888] hover:text-[#FF453A] underline cursor-pointer transition-colors"
              >
                Délier / retirer la licence de ce téléphone
              </button>
            </div>
          )}
        </div>

        {/* Formulaire de renouvellement / activation */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-left text-[#AAA] text-xs mb-1.5 font-medium flex items-center justify-between">
              <span>{inputLabel}</span>
              <button
                type="button"
                onClick={() => handleApplyDemoKey('DZ-AUTO-NEW-DISPO')}
                className="text-[10px] text-[#D4AF37] hover:underline cursor-pointer"
              >
                Clé neuve dispo
              </button>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                placeholder="DZ-AUTO-XXXX-XXXX"
                className="w-full pl-10 pr-4 py-3 bg-[#0A0A0A] border border-[#333] focus:border-[#D4AF37] rounded-xl text-white font-mono text-sm tracking-wider uppercase outline-none transition-colors"
                autoFocus={isUsedConflict}
              />
            </div>
            <p className="text-[10px] text-[#777] mt-1 text-left">
              Clé neuve disponible pour essai : <button type="button" onClick={() => handleApplyDemoKey('DZ-AUTO-NEW-DISPO')} className="text-[#D4AF37] underline font-mono cursor-pointer">DZ-AUTO-NEW-DISPO</button>
            </p>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30'
                  : 'bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#D4AF37] hover:bg-[#C59F2E] active:scale-[0.99] text-black font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{submitLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          <p className="text-[10px] text-[#777] text-center font-mono">
            Licence annuelle à usage unique • Gérée par le serveur
          </p>
        </form>

        {/* Footer Admin Link */}
        <div className="mt-6 pt-4 border-t border-[#222] flex items-center justify-between text-xs text-[#777]">
          <span>Administrateur ?</span>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 text-[#D4AF37] hover:underline cursor-pointer font-medium"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Console licences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
