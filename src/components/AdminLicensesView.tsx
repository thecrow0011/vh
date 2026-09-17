import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Copy,
  Check,
  Power,
  ChevronLeft,
  Calendar,
  User,
  Car,
  Phone,
  FileText,
  Lock,
  ArrowRight,
  SlidersHorizontal,
  Edit2,
  X,
  Eye,
  EyeOff,
  Smartphone,
  Unlink,
  Download,
  Database,
  History,
  Cloud,
} from 'lucide-react';
import { License, AdminStats, DatabaseInfo, LicenseAuditLog } from '../types';
import {
  adminLogin,
  adminGetLicenses,
  adminCreateLicense,
  adminRenewLicense,
  adminUpdateLicense,
  adminToggleStatus,
  adminDeleteLicense,
  adminChangePassword,
  adminUnbindDevice,
  adminGetAuditLogs,
} from '../services/licenseService';

interface AdminLicensesViewProps {
  onBackToApp: () => void;
  onRefreshClientLicense: () => void;
  currentActiveKey?: string;
  onSetActiveLicense?: (key: string) => Promise<void>;
}

export const AdminLicensesView: React.FC<AdminLicensesViewProps> = ({
  onBackToApp,
  onRefreshClientLicense,
  currentActiveKey,
  onSetActiveLicense,
}) => {
  // Auth state
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('autogestion_admin_token'));
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Data state
  const [licenses, setLicenses] = useState<License[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    revoked: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal / Form state for new license
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newVehiclePlate, setNewVehiclePlate] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');
  const [newDurationDays, setNewDurationDays] = useState<number>(365);
  const [newNotes, setNewNotes] = useState<string>('');
  const [newCustomKey, setNewCustomKey] = useState<string>('');
  const [activateImmediately, setActivateImmediately] = useState<boolean>(true);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Edit modal
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [editLicenseKey, setEditLicenseKey] = useState<string>('');
  const [editClientName, setEditClientName] = useState<string>('');
  const [editVehiclePlate, setEditVehiclePlate] = useState<string>('');
  const [editClientPhone, setEditClientPhone] = useState<string>('');
  const [editStatus, setEditStatus] = useState<License['status']>('active');
  const [editExpiresAt, setEditExpiresAt] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Password change modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [currentPassInput, setCurrentPassInput] = useState<string>('');
  const [newPassInput, setNewPassInput] = useState<string>('');
  const [confirmPassInput, setConfirmPassInput] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // SQLite Database & Audit Logs State
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<LicenseAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  // Notification / toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchLicenses = async (authToken: string) => {
    setLoading(true);
    try {
      const data = await adminGetLicenses(authToken);
      setLicenses(data.licenses);
      setStats(data.stats);
      if (data.databaseInfo) {
        setDbInfo(data.databaseInfo);
      }
    } catch (err) {
      console.error('Erreur chargement licences:', err);
      showToast('Session expirée ou non autorisée.', 'error');
      setToken(null);
      sessionStorage.removeItem('autogestion_admin_token');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAuditModal = async () => {
    if (!token) return;
    setIsAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const res = await adminGetAuditLogs(token, 100);
      if (res.success) {
        setAuditLogs(res.logs);
      }
    } catch {
      showToast("Erreur lors de la récupération du journal d'audit.", 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLicenses(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const res = await adminLogin(password);
    setAuthLoading(false);

    if (res.success && res.token) {
      setToken(res.token);
      sessionStorage.setItem('autogestion_admin_token', res.token);
      fetchLicenses(res.token);
    } else {
      setAuthError(res.message || 'Mot de passe incorrect.');
    }
  };

  const handleLogout = () => {
    setToken(null);
    sessionStorage.removeItem('autogestion_admin_token');
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRenew = async (id: string, additionalDays: number = 365) => {
    if (!token) return;
    try {
      const res = await adminRenewLicense(token, id, additionalDays);
      if (res.success) {
        showToast(res.message || 'Licence renouvelée pour 1 an supplémentaire !');
        fetchLicenses(token);
        onRefreshClientLicense();
      } else {
        showToast(res.message || 'Erreur lors du renouvellement.', 'error');
      }
    } catch {
      showToast('Erreur serveur.', 'error');
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!token) return;
    try {
      const res = await adminToggleStatus(token, id);
      if (res.success) {
        showToast(res.message || 'Statut modifié.');
        fetchLicenses(token);
        onRefreshClientLicense();
      }
    } catch {
      showToast('Erreur serveur.', 'error');
    }
  };

  const handleDelete = async (id: string, clientName: string) => {
    if (!token) return;
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement la licence de ${clientName} ?`)) {
      return;
    }
    try {
      const res = await adminDeleteLicense(token, id);
      if (res.success) {
        showToast('Licence supprimée avec succès.');
        fetchLicenses(token);
        onRefreshClientLicense();
      }
    } catch {
      showToast('Erreur serveur.', 'error');
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormSubmitting(true);

    try {
      const res = await adminCreateLicense(token, {
        clientName: newClientName,
        vehiclePlate: newVehiclePlate,
        clientPhone: newClientPhone,
        durationDays: newDurationDays,
        notes: newNotes,
        customKey: newCustomKey || undefined,
      });

      if (res.success) {
        showToast('Nouvelle licence créée avec succès !');
        setIsCreating(false);
        const createdLicKey = res.license?.licenseKey || newCustomKey;
        setNewClientName('');
        setNewVehiclePlate('');
        setNewClientPhone('');
        setNewNotes('');
        setNewCustomKey('');
        fetchLicenses(token);
        
        if (activateImmediately && createdLicKey && onSetActiveLicense) {
          await onSetActiveLicense(createdLicKey);
          showToast(`Licence ${createdLicKey} activée sur l'application !`);
        } else {
          onRefreshClientLicense();
        }
      } else {
        showToast(res.message || 'Erreur lors de la création.', 'error');
      }
    } catch {
      showToast('Erreur de connexion serveur.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSetActiveLicense = async (key: string) => {
    if (!onSetActiveLicense) return;
    try {
      await onSetActiveLicense(key);
      showToast(`Licence ${key} définie comme active sur l'application !`);
      if (token) fetchLicenses(token);
    } catch {
      showToast('Erreur lors du changement de licence.', 'error');
    }
  };

  const handleUnbindDevice = async (id: string, clientName: string) => {
    if (!token) return;
    if (
      !window.confirm(
        `Voulez-vous libérer la licence de ${clientName || 'ce client'} ? L'appareil actuellement lié sera déconnecté et la licence pourra être réactivée sur un nouveau téléphone.`
      )
    ) {
      return;
    }

    try {
      const res = await adminUnbindDevice(token, id);
      if (res.success) {
        showToast('Appareil délié avec succès ! La licence peut être activée sur un autre téléphone.');
        fetchLicenses(token);
        onRefreshClientLicense();
      } else {
        showToast(res.message || 'Erreur lors du déliement.', 'error');
      }
    } catch {
      showToast('Erreur de communication avec le serveur.', 'error');
    }
  };

  const openEditModal = (lic: License) => {
    setEditingLicense(lic);
    setEditLicenseKey(lic.licenseKey || '');
    setEditClientName(lic.clientName || '');
    setEditVehiclePlate(lic.vehiclePlate || '');
    setEditClientPhone(lic.clientPhone || '');
    setEditStatus(lic.status || 'active');
    setEditExpiresAt(lic.expiresAt ? lic.expiresAt.split('T')[0] : '');
    setEditNotes(lic.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingLicense) return;

    try {
      let formattedExpiry = editingLicense.expiresAt;
      if (editExpiresAt) {
        // If YYYY-MM-DD from <input type="date">, make it end-of-day so the day is fully covered
        const dateStr = editExpiresAt.includes('T') ? editExpiresAt : `${editExpiresAt}T23:59:59.000Z`;
        formattedExpiry = new Date(dateStr).toISOString();
      }

      const res = await adminUpdateLicense(token, editingLicense.id, {
        licenseKey: editLicenseKey.trim().toUpperCase(),
        clientName: editClientName,
        vehiclePlate: editVehiclePlate,
        clientPhone: editClientPhone,
        status: editStatus,
        expiresAt: formattedExpiry,
        notes: editNotes,
      });

      if (res.success) {
        showToast('Modifications enregistrées avec succès !');
        setEditingLicense(null);
        fetchLicenses(token);
        onRefreshClientLicense();
      } else {
        showToast(res.message || 'Erreur lors de la modification.', 'error');
      }
    } catch {
      showToast('Erreur de communication avec le serveur.', 'error');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!currentPassInput || !newPassInput) {
      setPasswordError('Veuillez remplir tous les champs.');
      return;
    }

    if (newPassInput.length < 4) {
      setPasswordError('Le nouveau mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setPasswordError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    setPasswordSubmitting(true);
    setPasswordError(null);

    const res = await adminChangePassword(token, currentPassInput, newPassInput);
    setPasswordSubmitting(false);

    if (res.success) {
      showToast('Mot de passe administrateur modifié avec succès !', 'success');
      setIsPasswordModalOpen(false);
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmPassInput('');
      setPasswordError(null);
    } else {
      setPasswordError(res.message || 'Échec du changement de mot de passe.');
    }
  };

  // Filter licenses
  const filteredLicenses = licenses.filter((lic) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lic.licenseKey.toLowerCase().includes(q) ||
      lic.clientName.toLowerCase().includes(q) ||
      lic.vehiclePlate.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return lic.status === 'active';
    if (statusFilter === 'expiring_soon') return lic.status === 'expiring_soon';
    if (statusFilter === 'expired') return lic.status === 'expired';
    if (statusFilter === 'revoked') return lic.status === 'revoked';
    if (statusFilter === 'pending') return lic.status === 'pending';
    return true;
  });

  // ----------------------------------------------------
  // Render Login View if not authenticated
  // ----------------------------------------------------
  if (!token) {
    return (
      <div className="h-full w-full bg-[#0A0A0A] text-[#F0F0F0] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#121212] border border-[#2A2A2A] rounded-3xl p-6 shadow-2xl relative">
          <button
            onClick={onBackToApp}
            className="absolute top-4 left-4 p-2 rounded-xl bg-[#1A1A1A] text-[#888] hover:text-white border border-[#2A2A2A] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center mt-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-3">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-serif italic text-white">Espace Administrateur</h2>
            <p className="text-xs text-[#888] mt-1">Gestion centrale des licences 1 an renouvelables</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#AAA] mb-1.5">
                Mot de passe administrateur :
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#777] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Code d'accès admin"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#D4AF37] rounded-xl text-white text-sm outline-none"
                />
              </div>
              <p className="text-[10px] text-[#666] mt-1 italic">Code d'accès par défaut : admin2026</p>
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-[#FF3B30]/15 border border-[#FF3B30]/30 text-xs text-[#FF3B30] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 bg-[#D4AF37] hover:bg-[#C59F2E] text-black font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Connexion Administration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleExportJsonFile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/licenses/export-file', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'licenses.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Fichier licenses.json exporté avec succès !');
    } catch {
      showToast('Erreur lors du téléchargement du fichier.', 'error');
    }
  };

  // ----------------------------------------------------
  // Render Admin Dashboard
  // ----------------------------------------------------
  return (
    <div className="h-full w-full bg-[#0A0A0A] text-[#F0F0F0] flex flex-col overflow-hidden">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 transition-all ${
            toastMessage.type === 'success'
              ? 'bg-[#34C759] text-black font-semibold'
              : 'bg-[#FF3B30] text-white'
          }`}
        >
          {toastMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="px-4 py-3 bg-[#111] border-b border-[#222] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToApp}
            className="p-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-[#888] hover:text-white border border-[#2A2A2A] cursor-pointer transition-colors"
            title="Retour à l'application"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-serif italic text-white">Gestionnaire des Licences</h1>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] text-[#777] flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
              <span className="flex items-center gap-1">
                <Cloud className="w-3 h-3 text-[#38BDF8]" />
                <span className="text-[#CCC]">Base Cloud active :</span>
                <code className="text-[#38BDF8] font-mono">{dbInfo?.cloudProjectId || 'herculian-gear-9xjsq'}</code>
              </span>
              {dbInfo && (
                <span className="text-[9px] text-[#999] bg-[#1E1E1E] px-1.5 py-0.5 rounded border border-[#333]">
                  {dbInfo.totalLicenses} licences • {dbInfo.totalAuditLogs} logs Cloud
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenAuditModal}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-[#38BDF8] hover:text-white border border-[#38BDF8]/30 hover:border-[#38BDF8]/60 cursor-pointer transition-colors flex items-center gap-1 text-xs font-medium"
            title="Consulter le journal d'audit Cloud (historique des modifications dans Google Cloud Firestore)"
          >
            <History className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="hidden sm:inline text-[11px]">Journal d'audit Cloud</span>
          </button>
          <button
            onClick={handleExportJsonFile}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-[#AAA] hover:text-white border border-[#2A2A2A] cursor-pointer transition-colors flex items-center gap-1 text-xs"
            title="Exporter la liste des licences (JSON)"
          >
            <Download className="w-3.5 h-3.5 text-[#34C759]" />
            <span className="hidden sm:inline text-[11px]">Export JSON</span>
          </button>
          <button
            onClick={() => {
              setPasswordError(null);
              setCurrentPassInput('');
              setNewPassInput('');
              setConfirmPassInput('');
              setIsPasswordModalOpen(true);
            }}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-[#D4AF37] border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Changer le mot de passe administrateur"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Mot de passe</span>
          </button>
          <button
            onClick={() => token && fetchLicenses(token)}
            disabled={loading}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#222] text-[#888] hover:text-white border border-[#2A2A2A] cursor-pointer transition-colors"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#D4AF37]' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#222] text-[#FF3B30] border border-[#2A2A2A] cursor-pointer transition-colors"
            title="Déconnexion admin"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#141414] border border-[#222]">
            <span className="text-[10px] uppercase tracking-wider text-[#888] block">Total Licences</span>
            <span className="text-2xl font-light font-mono text-white mt-1 block">{stats.total}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#141414] border border-[#222]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#34C759] block">Actives</span>
              <span className="w-2 h-2 rounded-full bg-[#34C759]" />
            </div>
            <span className="text-2xl font-light font-mono text-[#34C759] mt-1 block">{stats.active}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#141414] border border-[#222]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] block">Échéance &lt; 30j</span>
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            </div>
            <span className="text-2xl font-light font-mono text-[#D4AF37] mt-1 block">{stats.expiringSoon}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#141414] border border-[#222]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#FF3B30] block">Expirées</span>
              <span className="w-2 h-2 rounded-full bg-[#FF3B30]" />
            </div>
            <span className="text-2xl font-light font-mono text-[#FF3B30] mt-1 block">{stats.expired}</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par client, clé, plaque..."
              className="w-full pl-8 pr-3 py-2 bg-[#121212] border border-[#252525] focus:border-[#D4AF37] rounded-xl text-xs text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPasswordError(null);
                setCurrentPassInput('');
                setNewPassInput('');
                setConfirmPassInput('');
                setIsPasswordModalOpen(true);
              }}
              className="py-2 px-3 bg-[#161616] hover:bg-[#202020] text-[#D4AF37] border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 active:scale-[0.98] rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs font-medium transition-all shrink-0"
              title="Modifier le mot de passe d'accès administrateur"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Changer mot de passe</span>
            </button>

            {/* New License Button */}
            <button
              onClick={() => setIsCreating(true)}
              className="py-2 px-3.5 bg-[#D4AF37] hover:bg-[#C59F2E] active:scale-[0.98] text-black font-semibold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Générer Licence 1 an</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Toutes', count: stats.total },
            { id: 'active', label: 'Actives', count: stats.active },
            { id: 'expiring_soon', label: 'Échéance proche', count: stats.expiringSoon },
            { id: 'expired', label: 'Expirées', count: stats.expired },
            { id: 'pending', label: 'En attente', count: stats.pending },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40 font-semibold'
                  : 'bg-[#121212] text-[#777] border-[#222] hover:text-[#CCC]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#1C1C1C] text-[10px] font-mono">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Licenses List */}
        <div className="space-y-3">
          {filteredLicenses.length === 0 ? (
            <div className="p-8 text-center bg-[#121212] border border-[#222] rounded-2xl text-[#777]">
              <KeyRound className="w-8 h-8 mx-auto text-[#444] mb-2" />
              <p className="text-xs">Aucune licence ne correspond aux critères.</p>
            </div>
          ) : (
            filteredLicenses.map((lic) => {
              const now = new Date();
              const expiry = lic.expiresAt ? new Date(lic.expiresAt) : null;
              const daysLeft = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

              return (
                <div
                  key={lic.id}
                  className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#333] transition-all space-y-3"
                >
                  {/* Top row: Client & Status badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif italic text-white font-medium text-sm">
                          {lic.clientName || 'Client'}
                        </span>
                        {lic.vehiclePlate && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1E1E1E] text-[#AAA] border border-[#333]">
                            {lic.vehiclePlate}
                          </span>
                        )}
                        {lic.licenseKey === currentActiveKey && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-semibold flex items-center gap-1">
                            ★ Active sur l'app
                          </span>
                        )}
                      </div>
                      {lic.clientPhone && (
                        <p className="text-[10px] text-[#777] mt-0.5 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-[#888]" />
                          <span>{lic.clientPhone}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {lic.activatedAt || lic.isUsed ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30">
                          Usage unique consommé
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                          Usage unique disponible
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          lic.status === 'active'
                            ? 'bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40'
                            : lic.status === 'expiring_soon'
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                            : lic.status === 'expired'
                            ? 'bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/40'
                            : 'bg-[#888]/20 text-[#888] border border-[#888]/40'
                        }`}
                      >
                        {lic.status === 'active'
                          ? 'Active'
                          : lic.status === 'expiring_soon'
                          ? 'Expire bientôt'
                          : lic.status === 'expired'
                          ? 'Expirée'
                          : lic.status === 'revoked'
                          ? 'Suspendue'
                          : 'En attente'}
                      </span>
                    </div>
                  </div>

                  {/* Middle row: Key & Expiration Info */}
                  <div className="p-2.5 rounded-xl bg-[#0D0D0D] border border-[#202020] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="font-mono font-semibold text-xs tracking-wider text-white">
                        {lic.licenseKey}
                      </span>
                      <button
                        onClick={() => handleCopyKey(lic.licenseKey)}
                        className="p-1 rounded hover:bg-[#222] text-[#888] hover:text-white cursor-pointer transition-colors"
                        title="Copier la clé"
                      >
                        {copiedKey === lic.licenseKey ? (
                          <Check className="w-3.5 h-3.5 text-[#34C759]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="text-right text-[11px] font-mono">
                      {expiry ? (
                        <span className={daysLeft > 30 ? 'text-[#AAA]' : daysLeft > 0 ? 'text-[#D4AF37]' : 'text-[#FF3B30]'}>
                          Échéance : {expiry.toLocaleDateString('fr-FR')} ({daysLeft > 0 ? `${daysLeft}j` : 'Échue'})
                        </span>
                      ) : (
                        <span className="text-[#666]">Non encore activée</span>
                      )}
                    </div>
                  </div>

                  {/* Device Lock Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-[#0F0F0F] border border-[#1C1C1C] text-[11px]">
                    {lic.deviceId ? (
                      <div className="flex items-center gap-1.5 font-mono text-[#D4AF37]">
                        <Smartphone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>Lié à : {lic.deviceName || 'Téléphone'}</span>
                        <span className="text-[#888] text-[10px]">({lic.deviceId})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#777]">
                        <Smartphone className="w-3.5 h-3.5 opacity-50 shrink-0" />
                        <span>Aucun appareil lié (disponible pour un téléphone)</span>
                      </div>
                    )}
                    {lic.deviceActivatedAt && (
                      <span className="text-[10px] text-[#666]">
                        Lié le {new Date(lic.deviceActivatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>

                  {/* Notes / Renewal details */}
                  <div className="flex items-center justify-between text-[11px] text-[#777]">
                    <span className="truncate max-w-[70%]">{lic.notes || 'Licence 1 an'}</span>
                    <span className="font-mono text-[#AAA]">Renouvelé: {lic.renewalCount || 0}x</span>
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="pt-2 border-t border-[#222] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Primary Renewal Action: +1 an */}
                      <button
                        onClick={() => handleRenew(lic.id, 365)}
                        className="py-1.5 px-3 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Renouveler (+1 an)</span>
                      </button>

                      {/* Unbind Device Action */}
                      {lic.deviceId && (
                        <button
                          onClick={() => handleUnbindDevice(lic.id, lic.clientName)}
                          className="py-1.5 px-2.5 rounded-xl bg-[#2A1E00] hover:bg-[#3A2800] text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Délier l'appareil pour permettre l'activation de cette licence sur un nouveau téléphone"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          <span>Délier l'appareil</span>
                        </button>
                      )}

                      {onSetActiveLicense && lic.licenseKey !== currentActiveKey && (
                        <button
                          onClick={() => handleSetActiveLicense(lic.licenseKey)}
                          disabled={lic.status === 'revoked'}
                          className="py-1.5 px-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] text-[#D4AF37] border border-[#333] hover:border-[#D4AF37]/40 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40"
                          title="Définir cette licence comme licence active pour l'application"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Activer sur l'app</span>
                        </button>
                      )}
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(lic)}
                        className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] text-[#888] hover:text-white border border-[#2A2A2A] cursor-pointer"
                        title="Modifier les détails"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(lic.id)}
                        className={`p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] cursor-pointer ${
                          lic.status === 'revoked' ? 'text-[#34C759]' : 'text-[#888] hover:text-white'
                        }`}
                        title={lic.status === 'revoked' ? 'Réactiver la licence' : 'Suspendre la licence'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(lic.id, lic.clientName)}
                        className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2A1515] text-[#FF3B30]/70 hover:text-[#FF3B30] border border-[#2A2A2A] cursor-pointer"
                        title="Supprimer la licence"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Modal: Create New License 1 an */}
      {/* ---------------------------------------------------- */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#121212] border border-[#2A2A2A] rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222] mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-base font-serif italic text-white">Générer une Licence 1 an</h3>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-lg bg-[#1A1A1A] text-[#888] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#AAA] mb-1 font-medium">Nom du Client / Société *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ex: Rachid F. ou Entreprise Logistique"
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#AAA] mb-1 font-medium">Immatriculation du Véhicule (optionnel)</label>
                <input
                  type="text"
                  value={newVehiclePlate}
                  onChange={(e) => setNewVehiclePlate(e.target.value)}
                  placeholder="Ex: 01245-121-16"
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white font-mono outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#AAA] mb-1 font-medium">Téléphone du Client (optionnel)</label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="Ex: 0550 12 34 56"
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#AAA] mb-1 font-medium">Durée de validité</label>
                  <select
                    value={newDurationDays}
                    onChange={(e) => setNewDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value={365}>1 an (365 jours)</option>
                    <option value={730}>2 ans (730 jours)</option>
                    <option value={180}>6 mois (180 jours)</option>
                    <option value={30}>1 mois d'essai (30 jours)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#AAA] mb-1 font-medium">Clé personnalisée (optionnel)</label>
                  <input
                    type="text"
                    value={newCustomKey}
                    onChange={(e) => setNewCustomKey(e.target.value.toUpperCase())}
                    placeholder="Auto-générée si vide"
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white font-mono uppercase outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#AAA] mb-1 font-medium">Notes & Référence interne</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Facture 2026-042 - Paiement annuel validé"
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              {onSetActiveLicense && (
                <div className="p-2.5 rounded-xl bg-[#171717] border border-[#262626] flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="activateImmediatelyCheckbox"
                    checked={activateImmediately}
                    onChange={(e) => setActivateImmediately(e.target.checked)}
                    className="w-4 h-4 rounded border-[#333] accent-[#D4AF37] cursor-pointer"
                  />
                  <label htmlFor="activateImmediatelyCheckbox" className="text-xs text-[#DDD] cursor-pointer">
                    Définir immédiatement comme licence active de l'application
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-[#222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="py-2 px-3 rounded-xl bg-[#1A1A1A] text-[#888] hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="py-2 px-4 bg-[#D4AF37] hover:bg-[#C59F2E] text-black font-semibold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Valider & Générer</span>
                      <Check className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Modal: Edit Existing License */}
      {/* ---------------------------------------------------- */}
      {editingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#121212] border border-[#2A2A2A] rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222] mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-base font-serif italic text-white">Modifier la Licence</h3>
              </div>
              <button
                onClick={() => setEditingLicense(null)}
                className="p-1 rounded-lg bg-[#1A1A1A] text-[#888] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#AAA] mb-1 font-medium">Clé de Licence</label>
                <input
                  type="text"
                  required
                  value={editLicenseKey}
                  onChange={(e) => setEditLicenseKey(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white font-mono outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#AAA] mb-1 font-medium">Nom du Client</label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#AAA] mb-1 font-medium">Immatriculation</label>
                  <input
                    type="text"
                    value={editVehiclePlate}
                    onChange={(e) => setEditVehiclePlate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white font-mono outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[#AAA] mb-1 font-medium">Téléphone Client</label>
                  <input
                    type="text"
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#AAA] mb-1 font-medium">Statut</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as License['status'])}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="active">Active</option>
                    <option value="expiring_soon">Bientôt expirée</option>
                    <option value="expired">Expirée</option>
                    <option value="revoked">Révoquée / Suspendue</option>
                    <option value="pending">En attente d'activation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#AAA] mb-1 font-medium">Date d'Expiration</label>
                  <input
                    type="date"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white font-mono outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#AAA] mb-1 font-medium">Notes & Historique</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="p-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-[10px] text-[#888] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                <span>Sauvegarde automatique sur le serveur (<strong className="text-white">data/licenses.json</strong>).</span>
              </div>

              <div className="pt-3 border-t border-[#222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLicense(null)}
                  className="py-2 px-3 rounded-xl bg-[#1A1A1A] text-[#888] hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-[#D4AF37] hover:bg-[#C59F2E] text-black font-semibold rounded-xl cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Modal: Change Admin Password */}
      {/* ---------------------------------------------------- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#121212] border border-[#2A2A2A] rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif italic text-white">Changer le Mot de Passe Admin</h3>
                  <p className="text-[10px] text-[#777]">Accès sécurisé au tableau de bord des licences</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#1A1A1A] text-[#888] hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#AAA] mb-1 font-medium">Mot de passe actuel</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    placeholder="Entrez le mot de passe actuel"
                    className="w-full pl-8 pr-10 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777] hover:text-white p-1"
                    title={showPasswords ? 'Masquer' : 'Afficher'}
                  >
                    {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#AAA] mb-1 font-medium">Nouveau mot de passe</label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Minimum 4 caractères"
                    className="w-full pl-8 pr-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#AAA] mb-1 font-medium">Confirmer le nouveau mot de passe</label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    placeholder="Répétez le nouveau mot de passe"
                    className="w-full pl-8 pr-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-xl bg-[#FF3B30]/15 border border-[#FF3B30]/30 text-xs text-[#FF3B30] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="py-2 px-3 rounded-xl bg-[#1A1A1A] text-[#888] hover:text-white cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="py-2 px-4 bg-[#D4AF37] hover:bg-[#C59F2E] text-black font-semibold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-md"
                >
                  {passwordSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Enregistrer le mot de passe</span>
                      <Check className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Cloud Firestore Audit Logs Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#161616]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>Journal d'Audit Google Cloud Firestore</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30">
                      {auditLogs.length} entrées Cloud
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#888]">
                    Traçabilité en temps réel et permanente de chaque licence dans le Cloud ({dbInfo?.region || 'europe-west2'})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleOpenAuditModal}
                  disabled={auditLoading}
                  className="p-2 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#AAA] hover:text-white border border-[#333] transition-colors cursor-pointer"
                  title="Actualiser les logs Cloud"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin text-[#38BDF8]' : ''}`} />
                </button>
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="p-2 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#888] hover:text-white border border-[#333] transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Database Technical Info Banner */}
            {dbInfo && (
              <div className="px-4 py-2.5 bg-[#0F172A]/50 border-b border-[#1E293B] flex flex-wrap items-center justify-between text-[11px] text-[#94A3B8] gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Projet GCP : <code className="text-white font-mono">{dbInfo.cloudProjectId || 'herculian-gear-9xjsq'}</code></span>
                  <span className="text-[#64748B]">•</span>
                  <span>Région : <strong className="text-[#38BDF8]">{dbInfo.region || 'europe-west2'}</strong></span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px]">
                  <span>Moteur : <strong className="text-[#38BDF8]">Cloud Firestore</strong></span>
                  <span>Licences : <strong className="text-white">{dbInfo.totalLicenses}</strong></span>
                  <span className="text-[#34C759] font-sans flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" /> Cloud Connecté
                  </span>
                </div>
              </div>
            )}

            {/* Modal Body / Logs list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-[#1F1F1F]">
              {auditLoading ? (
                <div className="py-16 text-center text-[#777] flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#38BDF8]" />
                  <p className="text-xs">Chargement du journal d'audit Cloud Firestore...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-16 text-center text-[#777]">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Aucun événement enregistré dans Cloud Firestore pour le moment.</p>
                </div>
              ) : (
                auditLogs.map((log) => {
                  const actionColor =
                    log.action === 'CREATE'
                      ? 'bg-[#34C759]/15 text-[#34C759] border-[#34C759]/30'
                      : log.action === 'RENEW'
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30'
                      : log.action === 'ACTIVATE'
                      ? 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30'
                      : log.action === 'UNBIND_DEVICE'
                      ? 'bg-[#FF9500]/15 text-[#FF9500] border-[#FF9500]/30'
                      : log.action === 'DELETE'
                      ? 'bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/30'
                      : log.action === 'TOGGLE_STATUS'
                      ? 'bg-[#EC4899]/15 text-[#EC4899] border-[#EC4899]/30'
                      : 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30';

                  const actorColor =
                    log.performedBy === 'ADMIN'
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20'
                      : log.performedBy === 'CLIENT'
                      ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20'
                      : 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20';

                  const dateFormatted = log.timestamp
                    ? new Date(log.timestamp).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : 'Date inconnue';

                  return (
                    <div key={log.id} className="pt-2.5 first:pt-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${actionColor}`}>
                            {log.action}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${actorColor}`}>
                            {log.performedBy}
                          </span>
                          {log.licenseKey && (
                            <span className="text-[11px] font-mono font-bold text-white bg-[#1A1A1A] px-2 py-0.5 rounded border border-[#333]">
                              {log.licenseKey}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#777] shrink-0">
                          {dateFormatted}
                        </span>
                      </div>
                      <p className="text-xs text-[#BBB] mt-1.5 leading-relaxed pl-0.5">
                        {log.details}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#161616] border-t border-[#222] flex items-center justify-between text-xs">
              <span className="text-[#666] text-[11px] flex items-center gap-1.5">
                <Cloud className="w-3 h-3 text-[#38BDF8]" />
                <span>Base Google Cloud Firestore • Stockage distribué haute disponibilité</span>
              </span>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="py-1.5 px-3 rounded-xl bg-[#222] hover:bg-[#333] text-white transition-colors cursor-pointer text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
