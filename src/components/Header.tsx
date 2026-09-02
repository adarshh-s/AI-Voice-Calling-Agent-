import React from 'react';
import { PhoneCall, Table, Calendar, Network, BookOpen, Settings2, Sparkles, CheckCircle2 } from 'lucide-react';

export type ActiveTab = 'simulator' | 'sheets' | 'calendar' | 'n8n' | 'architecture' | 'prompt';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingCount: number;
  scheduledCount: number;
}

interface TabItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  scheduledCount,
}) => {
  const tabs: TabItem[] = [
    { id: 'simulator', label: 'Call Simulator', icon: PhoneCall },
    { id: 'sheets', label: 'Google Sheet', icon: Table, badge: pendingCount > 0 ? `${pendingCount} Pending` : undefined },
    { id: 'calendar', label: 'Google Calendar', icon: Calendar, badge: scheduledCount > 0 ? `${scheduledCount} Booked` : undefined },
    { id: 'n8n', label: 'n8n Workflow', icon: Network },
    { id: 'architecture', label: 'Setup & Architecture', icon: BookOpen },
    { id: 'prompt', label: 'AI Prompt & Config', icon: Settings2 },
  ];

  return (
    <header className="border-b border-[#E8E4DF] bg-white/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#8BA888] flex items-center justify-center shadow-sm text-white">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-semibold text-[#2D2926] tracking-tight text-base sm:text-lg">
                  CallFlow <span className="text-[#8BA888] font-normal">Voice Agent</span>
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-medium bg-[#F0EDE9] text-[#4A443F] border border-[#E8E4DF] rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8BA888] animate-pulse"></span>
                  Gemini 3.7 & n8n Ready
                </span>
              </div>
              <p className="text-xs text-[#8C847C] hidden sm:block">
                Automated Outbound Calling • Calendar Booking • Sheet Sync
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#F5F2EF] border border-[#E8E4DF]">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[#8C847C]">Pending Leads:</span>
              <span className="font-semibold text-[#2D2926]">{pendingCount}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#F5F2EF] border border-[#E8E4DF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8BA888]" />
              <span className="text-[#8C847C]">Scheduled:</span>
              <span className="font-semibold text-[#2D2926]">{scheduledCount}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#8BA888] text-white shadow-sm'
                    : 'text-[#5C5651] hover:text-[#2D2926] hover:bg-[#F0EDE9]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
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
