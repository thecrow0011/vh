import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="absolute top-14 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-xl bg-[#141414] border border-[#D4AF37]/50 px-3 py-2 text-xs font-medium text-[#D4AF37] shadow-xl animate-in fade-in duration-200">
      <WifiOff className="w-4 h-4 text-[#D4AF37] shrink-0" />
      <span>Mode hors ligne actif — Vos données locales sont synchronisées.</span>
    </div>
  );
};
