import React from 'react';
import { LayoutDashboard, Fuel, Wrench, FileText, BarChart3 } from 'lucide-react';
import { TabType, AppNotification } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  notifications: AppNotification[];
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  notifications,
}) => {
  const docAlerts = notifications.filter((n) => n.targetTab === 'documents').length;
  const maintAlerts = notifications.filter((n) => n.targetTab === 'entretien').length;

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'carburant', label: 'Carburant', icon: Fuel },
    { id: 'entretien', label: 'Entretien', icon: Wrench, badge: maintAlerts },
    { id: 'documents', label: 'Documents', icon: FileText, badge: docAlerts },
    { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
  ];

  return (
    <nav className="sticky bottom-0 z-40 shrink-0 w-full bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#2A2A2A] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => onChangeTab(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              isActive ? 'text-[#D4AF37]' : 'text-[#666] hover:text-[#AAA]'
            }`}
          >
            {/* Active Pill Indicator behind icon */}
            <div
              className={`px-3.5 py-0.5 rounded-full transition-all duration-200 flex items-center justify-center ${
                isActive ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-transparent text-[#666]'
              }`}
            >
              <Icon className="w-4.5 h-4.5 transition-transform group-active:scale-95" />
            </div>

            <span
              className={`text-[10px] mt-1 font-medium tracking-wider uppercase ${
                isActive ? 'font-semibold text-[#D4AF37]' : 'text-[#777]'
              }`}
            >
              {tab.label}
            </span>

            {/* Notification Badge on tab icon */}
            {tab.badge && tab.badge > 0 ? (
              <span className="absolute top-0 right-1.5 w-4 h-4 bg-[#FF3B30] rounded-full text-[9px] font-mono font-bold text-white flex items-center justify-center border-2 border-[#0A0A0A]">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
};
