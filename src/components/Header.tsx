import React, { useState, useEffect } from 'react';
import { Bell, Gauge, Car, AlertTriangle, ShieldCheck, Maximize2, Minimize2 } from 'lucide-react';
import { Vehicle, AppNotification, License } from '../types';
import { formatKm } from '../utils/calculations';

interface HeaderProps {
  vehicle: Vehicle;
  notifications: AppNotification[];
  license: License | null;
  daysRemaining: number;
  onOpenNotifications: () => void;
  onOpenMileageModal: () => void;
  onOpenVehicleModal: () => void;
  onOpenLicenseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  vehicle,
  notifications,
  license,
  daysRemaining,
  onOpenNotifications,
  onOpenMileageModal,
  onOpenVehicleModal,
  onOpenLicenseModal,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: (options?: any) => Promise<void>;
        };
        if (docEl.requestFullscreen) {
          try {
            await docEl.requestFullscreen({ navigationUI: 'hide' });
          } catch {
            await docEl.requestFullscreen();
          }
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Mode plein écran:', err);
    }
  };

  const urgentCount = notifications.filter((n) => n.severity === 'urgent').length;
  const totalAlerts = notifications.length;

  return (
    <header className="sticky top-0 z-40 shrink-0 w-full bg-[#0A0A0A]/95 backdrop-blur-md px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-[#2A2A2A] flex items-center justify-between select-none shadow-sm">
      {/* Vehicle Info pill button */}
      <button
        id="vehicle-profile-btn"
        onClick={onOpenVehicleModal}
        className="flex items-center gap-2 text-left group cursor-pointer p-1 rounded-xl hover:bg-[#141414] transition-colors max-w-[45%]"
      >
        <div className="w-8 h-8 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/50 group-hover:scale-105 transition-all shadow-sm shrink-0">
          <Car className="w-4 h-4 text-[#D4AF37]" />
        </div>
        <div className="truncate">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs font-serif italic text-white tracking-wide leading-tight group-hover:text-[#D4AF37] transition-colors truncate">
              {vehicle.make} {vehicle.model}
            </span>
          </div>
          <p className="text-[9px] font-mono text-[#888] truncate mt-0.5">
            {vehicle.licensePlate}
          </p>
        </div>
      </button>

      {/* Right controls: License status, Mileage updater & Notification Bell */}
      <div className="flex items-center gap-1.5">
        {/* License Pill */}
        <button
          id="header-license-btn"
          onClick={onOpenLicenseModal}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-mono font-medium transition-colors cursor-pointer ${
            daysRemaining > 30
              ? 'bg-[#141414] hover:bg-[#1E1E1E] border-[#2A2A2A] text-[#34C759]'
              : daysRemaining > 0
              ? 'bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border-[#D4AF37]/40 text-[#D4AF37]'
              : 'bg-[#FF3B30]/15 hover:bg-[#FF3B30]/25 border-[#FF3B30]/40 text-[#FF3B30]'
          }`}
          title="Détails de la licence 1 an renouvelable"
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xs:inline text-[10px]">1 an:</span>
          <span>{daysRemaining > 0 ? `${daysRemaining}j` : 'Expirée'}</span>
        </button>

        {/* Quick Odometer Badge */}
        <button
          id="quick-mileage-btn"
          onClick={onOpenMileageModal}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-[#2A2A2A] text-xs font-medium text-[#F0F0F0] hover:text-white transition-colors cursor-pointer group"
          title="Modifier le kilométrage actuel"
        >
          <Gauge className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-105 transition-transform" />
          <span className="font-mono text-[11px] font-light text-[#F0F0F0]">{formatKm(vehicle.currentMileage)}</span>
        </button>

        {/* Notifications Icon Button */}
        <button
          id="open-notifications-btn"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-[#2A2A2A] text-[#888] hover:text-white transition-colors cursor-pointer"
          title="Voir les rappels et alertes d'entretien"
        >
          <Bell className="w-4 h-4" />
          {totalAlerts > 0 && (
            <span
              className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold font-mono flex items-center justify-center text-white ${
                urgentCount > 0 ? 'bg-[#FF3B30] animate-pulse' : 'bg-[#D4AF37] text-black'
              }`}
            >
              {totalAlerts}
            </span>
          )}
        </button>

        {/* Bouton Plein Écran sans infobulle ni message parasite */}
        <button
          id="toggle-fullscreen-btn"
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-[#2A2A2A] text-[#888] hover:text-[#D4AF37] transition-colors cursor-pointer"
          aria-label="Mode plein écran"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-[#D4AF37]" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};

