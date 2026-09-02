import React from 'react';
import {
  PhoneCall,
  Table,
  Calendar,
  Network,
  BookOpen,
  Settings2,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  BarChart3,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';

export type ActiveTab =
  | 'campaign'
  | 'sheets'
  | 'simulator'
  | 'calendar'
  | 'analytics'
  | 'n8n'
  | 'architecture'
  | 'prompt';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingCount: number;
  scheduledCount: number;
  onOpenExcelUpload: () => void;
}

interface TabItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isSpecial?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  scheduledCount,
  onOpenExcelUpload,
}) => {
  const tabs: TabItem[] = [
    {
      id: 'campaign',
      label: 'Automated Auto-Caller',
      icon: PlayCircle,
      badge: pendingCount > 0 ? `${pendingCount} Ready` : undefined,
      isSpecial: true,
    },
    {
      id: 'sheets',
      label: 'Spreadsheet & Leads',
      icon: Table,
    },
    {
      id: 'simulator',
      label: 'Test Simulator',
      icon: PhoneCall,
    },
    {
      id: 'calendar',
      label: 'Google Calendar',
      icon: Calendar,
      badge: scheduledCount > 0 ? `${scheduledCount} Booked` : undefined,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'n8n',
      label: 'n8n Workflow',
      icon: Network,
    },
    {
      id: 'prompt',
      label: 'AI Script & Pitch',
      icon: Settings2,
    },
    {
      id: 'architecture',
      label: 'Setup Guide',
      icon: BookOpen,
    },
  ];

  return (
    <header className="border-b border-[#E8E4DF] bg-white/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8BA888] flex items-center justify-center shadow-xs text-white">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-[#2D2926] tracking-tight text-base sm:text-lg">
                  AutoDialer <span className="text-[#8BA888] font-normal">AI Platform</span>
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#8BA888]/15 text-[#537050] border border-[#8BA888]/30 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8BA888] animate-pulse"></span>
                  Excel → Auto-Call
                </span>
              </div>
              <p className="text-xs text-[#8C847C] hidden sm:block">
                Feed Client Spreadsheets • Automated Voice AI Calls • Google Calendar Booking
              </p>
            </div>
          </div>

          {/* Quick Actions & Metrics */}
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={onOpenExcelUpload}
              className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white font-bold transition-all shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Feed Excel</span>
            </button>

            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E8E4DF]">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[#8C847C]">Pending:</span>
              <span className="font-bold text-[#2D2926]">{pendingCount}</span>
            </div>

            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E8E4DF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8BA888]" />
              <span className="text-[#8C847C]">Booked:</span>
              <span className="font-bold text-[#2D2926]">{scheduledCount}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-2 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#8BA888] text-white shadow-xs'
                    : 'text-[#5C5651] hover:text-[#2D2926] hover:bg-[#F0EDE9]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-[#E8E4DF] text-[#4A443F]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
