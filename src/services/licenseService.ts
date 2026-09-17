import { License, LicenseCheckResult, AdminStats, AppData, DatabaseInfo, LicenseAuditLog } from '../types';

export const LS_LICENSE_KEY = 'autogestion_license_key';
export const LS_CACHED_LICENSE = 'autogestion_cached_license_data';
export const LS_DEVICE_ID = 'autogestion_device_id';
export const DEFAULT_LICENSE_KEY = 'DZ-AUTO-2026-ACTIVE';
export const LICENSE_CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (600 000 ms)

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(LS_DEVICE_ID);
    if (!id || id.trim().length === 0) {
      const randomPart = Array.from({ length: 4 }, () =>
        Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1).toUpperCase()
      ).join('-');
      id = `DZ-MOB-${randomPart}`;
      localStorage.setItem(LS_DEVICE_ID, id);
    }
    return id;
  } catch {
    return 'DZ-MOB-DEFAULT';
  }
}

export function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Appareil Mobile';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s+([0-9.]+)(?:;\s+([^;)]+))?/i);
    const model = match && match[2] ? match[2].trim() : 'Android';
    return `Smartphone Android (${model})`;
  }
  if (/iPhone/i.test(ua)) {
    return 'Apple iPhone';
  }
  if (/iPad/i.test(ua)) {
    return 'Apple iPad';
  }
  if (/Windows/i.test(ua)) {
    return 'Poste Windows';
  }
  if (/Macintosh/i.test(ua)) {
    return 'Apple Mac';
  }
  if (/Linux/i.test(ua)) {
    return 'Terminal Linux';
  }
  return 'Téléphone Mobile';
}

export function sanitizeMessage(msg: unknown): string {
  if (typeof msg !== 'string') return '';
  const trimmed = msg.trim();
  if (
    trimmed.includes('<!doctype') ||
    trimmed.includes('<html') ||
    trimmed.includes('<head') ||
    trimmed.includes('<body') ||
    trimmed.includes('</') ||
    trimmed.startsWith('<')
  ) {
    return 'Connexion serveur en cours de synchronisation...';
  }
  return trimmed;
}

function getOfflineFallback(licenseKey: string, vehiclePlate?: string, deviceId?: string): LicenseCheckResult {
  const currentDeviceId = deviceId || getOrCreateDeviceId();
  const hasInstalled = hasInstalledLicenseOnDevice();

  // First, check if we have a valid cached license
  try {
    const cachedStr = localStorage.getItem(LS_CACHED_LICENSE);
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);

      const expDateStr = cached.expiresAt || cached.license?.expiresAt;
      if (expDateStr) {
        const expiry = new Date(expDateStr);
        if (!isNaN(expiry.getTime())) {
          const diffDays = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && cached.status !== 'revoked') {
            return {
              valid: true,
              license: cached.license || null,
              hasInstalledLicense: true,
              status: diffDays <= 30 ? 'expiring_soon' : 'active',
              daysRemaining: diffDays,
              deviceId: currentDeviceId,
              message: `Mode hors-ligne : Licence active (valide jusqu'au ${expiry.toLocaleDateString('fr-FR')}).`,
            };
          } else if (diffDays <= 0) {
            return {
              valid: false,
              license: cached.license || null,
              hasInstalledLicense: true,
              status: 'expired',
              daysRemaining: 0,
              deviceId: currentDeviceId,
              message: `Licence annuelle expirée le ${expiry.toLocaleDateString('fr-FR')}. Veuillez renouveler.`,
            };
          }
        }
      }
    }
  } catch {}

  // If installed key exists on this device and is not empty, keep device active temporarily
  const installedKey = localStorage.getItem(LS_LICENSE_KEY) || licenseKey;
  if (hasInstalled && installedKey && installedKey.trim().length > 0) {
    return {
      valid: true,
      license: null,
      hasInstalledLicense: true,
      status: 'active',
      daysRemaining: 365,
      deviceId: currentDeviceId,
      message: 'Licence installée sur cet appareil (synchronisation en attente).',
    };
  }

  // Truly unactivated device
  return {
    valid: false,
    license: null,
    hasInstalledLicense: false,
    status: 'pending',
    daysRemaining: 0,
    deviceId: currentDeviceId,
    message: 'Aucune licence installée sur ce téléphone. Veuillez saisir votre clé de licence.',
  };
}

export function hasInstalledLicenseOnDevice(): boolean {
  try {
    const key = localStorage.getItem(LS_LICENSE_KEY);
    if (key && key.trim().length > 0) return true;
    const cachedStr = localStorage.getItem(LS_CACHED_LICENSE);
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr);
      if (parsed && (parsed.license || parsed.expiresAt || parsed.status)) {
        return true;
      }
    }
  } catch {}
  return false;
}

export function uninstallLicenseFromDevice(): void {
  try {
    localStorage.removeItem(LS_LICENSE_KEY);
    localStorage.removeItem(LS_CACHED_LICENSE);
  } catch {}
}

export async function verifyLicense(licenseKey?: string, vehiclePlate?: string): Promise<LicenseCheckResult> {
  const deviceId = getOrCreateDeviceId();
  const deviceName = getDeviceName();
  const normalizedKey = (licenseKey || '').trim().toUpperCase();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`/api/license/verify?_t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      signal: controller.signal,
      cache: 'no-store',
      body: JSON.stringify({
        licenseKey: normalizedKey,
        vehiclePlate,
        deviceId,
        deviceName,
      }),
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return getOfflineFallback(normalizedKey, vehiclePlate, deviceId);
    }

    const data = await res.json();
    if (!data || typeof data !== 'object') {
      return getOfflineFallback(normalizedKey, vehiclePlate, deviceId);
    }

    // Compute remaining days reliably from server diff or expiresAt date
    let daysRemaining = 0;
    if (typeof data.daysRemaining === 'number') {
      daysRemaining = data.daysRemaining;
    } else if (data.license && data.license.expiresAt) {
      const expiry = new Date(data.license.expiresAt);
      daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    let status = data.status;
    let isValid = Boolean(data.valid);

    if (status === 'device_mismatch') {
      isValid = false;
      daysRemaining = 0;
    } else if (daysRemaining > 0 && status !== 'revoked' && status !== 'pending') {
      isValid = true;
      status = daysRemaining <= 30 ? 'expiring_soon' : 'active';
    } else if (daysRemaining <= 0 && status !== 'revoked' && status !== 'pending') {
      isValid = false;
      status = 'expired';
    }

    const hasInstalled = typeof data.hasInstalledLicense === 'boolean'
      ? data.hasInstalledLicense
      : hasInstalledLicenseOnDevice();

    const result: LicenseCheckResult = {
      valid: isValid,
      license: data.license || null,
      status: status || (isValid ? 'active' : 'expired'),
      daysRemaining: daysRemaining,
      deviceId,
      hasInstalledLicense: hasInstalled,
      message: sanitizeMessage(data.message),
    };

    // Cache server response locally for offline accuracy
    if (data.license) {
      try {
        localStorage.setItem(
          LS_CACHED_LICENSE,
          JSON.stringify({
            license: data.license,
            deviceId,
            expiresAt: data.license.expiresAt,
            daysRemaining: result.daysRemaining,
            status: result.status,
            valid: result.valid,
            cachedAt: new Date().toISOString(),
          })
        );
      } catch {}
    } else if (status === 'device_mismatch') {
      try {
        localStorage.removeItem(LS_CACHED_LICENSE);
      } catch {}
    }

    return result;
  } catch (error) {
    console.warn('Mode hors-ligne ou serveur inaccessible pour la vérification de licence:', error);
    return getOfflineFallback(normalizedKey, vehiclePlate, deviceId);
  }
}

export async function activateLicense(
  licenseKey: string,
  vehiclePlate?: string,
  clientName?: string
): Promise<{ success: boolean; license?: License; message: string }> {
  const deviceId = getOrCreateDeviceId();
  const deviceName = getDeviceName();

  try {
    const res = await fetch('/api/license/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        licenseKey,
        vehiclePlate,
        clientName,
        deviceId,
        deviceName,
      }),
    });

    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, message: sanitizeMessage(text) || `Erreur de communication (HTTP ${res.status})` };
      }
    }

    if (data && typeof data === 'object') {
      // If server returned valid license, update local cache
      if (data.success && data.license) {
        try {
          localStorage.setItem(
            LS_CACHED_LICENSE,
            JSON.stringify({
              license: data.license,
              deviceId,
              expiresAt: data.license.expiresAt,
              daysRemaining: data.license.durationDays || 365,
              status: 'active',
              cachedAt: new Date().toISOString(),
            })
          );
        } catch {}
      }
      return {
        ...data,
        message: sanitizeMessage(data.message),
      };
    }

    return {
      success: false,
      message: 'Réponse inattendue du serveur.',
    };
  } catch (error) {
    console.error('Erreur réseau activateLicense:', error);
    return {
      success: false,
      message: 'Impossible de joindre le serveur pour activer la licence sur cet appareil. Veuillez vérifier votre connexion.',
    };
  }
}

export async function renewLicense(
  licenseKey: string,
  renewalCode?: string,
  vehiclePlate?: string
): Promise<{ success: boolean; license?: License; message: string }> {
  try {
    const res = await fetch('/api/license/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey, renewalCode, vehiclePlate }),
    });
    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, message: sanitizeMessage(text) || 'Erreur serveur.' };
      }
    }
    return {
      ...data,
      message: sanitizeMessage(data?.message),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur réseau lors de la validation du renouvellement.',
    };
  }
}

// ---------------------------------------------
// Admin Service API
// ---------------------------------------------

export async function adminLogin(password: string): Promise<{ success: boolean; token?: string; message: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, message: 'Erreur réseau de communication avec le serveur admin.' };
  }
}

export async function adminGetLicenses(token: string): Promise<{
  licenses: License[];
  stats: AdminStats;
  databaseInfo?: DatabaseInfo;
  serverTime?: string;
}> {
  const res = await fetch('/api/admin/licenses', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Non autorisé');
  }
  return await res.json();
}

export async function adminGetAuditLogs(token: string, limit: number = 100): Promise<{ success: boolean; logs: LicenseAuditLog[] }> {
  try {
    const res = await fetch(`/api/admin/licenses/logs?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { success: false, logs: [] };
    }
    return await res.json();
  } catch {
    return { success: false, logs: [] };
  }
}

export async function adminGetDatabaseInfo(token: string): Promise<DatabaseInfo | null> {
  try {
    const res = await fetch('/api/admin/database-info', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function adminCreateLicense(
  token: string,
  data: {
    clientName: string;
    vehiclePlate: string;
    clientPhone?: string;
    durationDays?: number;
    notes?: string;
    customKey?: string;
  }
): Promise<{ success: boolean; license?: License; message: string }> {
  const res = await fetch('/api/admin/licenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function adminRenewLicense(
  token: string,
  id: string,
  additionalDays: number = 365
): Promise<{ success: boolean; license?: License; message: string }> {
  const res = await fetch(`/api/admin/licenses/${id}/renew`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ additionalDays }),
  });
  return await res.json();
}

export async function adminUpdateLicense(
  token: string,
  id: string,
  data: Partial<License>
): Promise<{ success: boolean; license?: License; message: string }> {
  const res = await fetch(`/api/admin/licenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function adminToggleStatus(
  token: string,
  id: string
): Promise<{ success: boolean; license?: License; message: string }> {
  const res = await fetch(`/api/admin/licenses/${id}/toggle`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}

export async function adminUnbindDevice(
  token: string,
  id: string
): Promise<{ success: boolean; license?: License; message: string }> {
  const res = await fetch(`/api/admin/licenses/${id}/unbind-device`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}

export async function adminDeleteLicense(token: string, id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/admin/licenses/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}

export async function adminChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return await res.json();
  } catch {
    return {
      success: false,
      message: 'Erreur de communication avec le serveur lors du changement de mot de passe.',
    };
  }
}

// -----------------------------------------------------------------
// App Data Cloud/Server Synchronization (Durable persistence)
// -----------------------------------------------------------------

export async function fetchAppData(): Promise<AppData | null> {
  try {
    const res = await fetch('/api/app-data', {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.success && data.data) {
      return data.data as AppData;
    }
    return null;
  } catch (err) {
    console.warn('Mode autonome: impossible de récupérer les données du serveur', err);
    return null;
  }
}

export async function saveAppDataToServer(payload: Partial<AppData>): Promise<boolean> {
  try {
    const res = await fetch('/api/app-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('Mode autonome: échec de sauvegarde sur le serveur', err);
    return false;
  }
}

export async function setActiveLicenseOnServer(licenseKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/license/set-active', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ licenseKey }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Erreur de communication avec le serveur.' };
  }
}

export async function adminSyncLicenses(
  token: string,
  licenses: License[]
): Promise<{ success: boolean; message?: string; licenses?: License[] }> {
  try {
    const res = await fetch('/api/admin/licenses/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ licenses }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Erreur lors de la synchronisation des licences avec le serveur.' };
  }
}

