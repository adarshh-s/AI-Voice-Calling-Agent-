import React from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Clock,
  PhoneCall,
  AlertTriangle,
  Users,
  Download,
  Percent,
} from 'lucide-react';
import { Lead } from '../types';
import { exportLeadsToExcel } from '../utils/excelParser';

interface CampaignAnalyticsProps {
  leads: Lead[];
}

export const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({ leads }) => {
  const total = leads.length;
  const pending = leads.filter((l) => l.status === 'Pending').length;
  const scheduled = leads.filter((l) => l.status === 'Meeting Scheduled').length;
  const contacted = leads.filter((l) => l.status === 'Contacted' || l.status === 'Interested').length;
  const notInterested = leads.filter((l) => l.status === 'Not Interested' || l.status === 'Do Not Contact').length;
  const invalid = leads.filter((l) => !l.isValidPhone || l.status === 'Invalid Number').length;
  const completed = total - pending;

  const conversionRate = completed > 0 ? Math.round((scheduled / completed) * 100) : 0;
  const contactRate = completed > 0 ? Math.round(((scheduled + contacted) / completed) * 100) : 0;

  const totalDurationSecs = leads.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
  const avgDurationSecs = completed > 0 ? Math.round(totalDurationSecs / completed) : 0;

  const handleExport = () => {
    exportLeadsToExcel(leads, `Campaign_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E8E4DF] rounded-[28px] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8C847C] mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-[#8BA888]" />
            <span>Outbound Campaign Performance</span>
          </div>
          <h2 className="text-xl font-bold text-[#2D2926]">Calling Analytics & Conversion KPIs</h2>
          <p className="text-xs sm:text-sm text-[#5C5651] mt-0.5">
            Real-time conversion metrics, meeting booking rates, and call outcome breakdown across all spreadsheet leads.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white font-bold text-xs shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Analytics Excel</span>
        </button>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#8C847C]">
            <span className="text-xs font-bold uppercase tracking-wider">Demo Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-[#8BA888]" />
          </div>
          <div className="text-2xl font-bold text-[#2D2926]">{conversionRate}%</div>
          <p className="text-[11px] text-[#537050] font-medium">
            {scheduled} meetings out of {completed} calls
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#8C847C]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Meetings Booked</span>
            <Calendar className="w-4 h-4 text-[#8BA888]" />
          </div>
          <div className="text-2xl font-bold text-[#537050]">{scheduled}</div>
          <p className="text-[11px] text-[#8C847C]">Google Meet events scheduled</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#8C847C]">
            <span className="text-xs font-bold uppercase tracking-wider">Positive Engagement</span>
            <CheckCircle2 className="w-4 h-4 text-[#8BA888]" />
          </div>
          <div className="text-2xl font-bold text-[#2D2926]">{contactRate}%</div>
          <p className="text-[11px] text-[#8C847C]">Interested or demo scheduled</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#8C847C]">
            <span className="text-xs font-bold uppercase tracking-wider">Average Call Time</span>
            <Clock className="w-4 h-4 text-[#8C847C]" />
          </div>
          <div className="text-2xl font-bold text-[#2D2926]">
            {Math.floor(avgDurationSecs / 60)}m {avgDurationSecs % 60}s
          </div>
          <p className="text-[11px] text-[#8C847C]">Per processed client</p>
        </div>
      </div>

      {/* Outcome Distribution Bar & Breakdown */}
      <div className="bg-white border border-[#E8E4DF] rounded-[28px] p-6 shadow-sm space-y-5">
        <h3 className="font-bold text-sm text-[#2D2926]">Call Outcome Distribution</h3>

        {/* Multi-segment Progress Bar */}
        <div className="w-full bg-[#FAF9F6] h-4 rounded-full overflow-hidden flex border border-[#E8E4DF]">
          {total > 0 && (
            <>
              <div
                style={{ width: `${(scheduled / total) * 100}%` }}
                className="bg-[#8BA888] h-full"
                title={`Meeting Scheduled: ${scheduled}`}
              />
              <div
                style={{ width: `${(contacted / total) * 100}%` }}
                className="bg-emerald-400 h-full"
                title={`Interested / Contacted: ${contacted}`}
              />
              <div
                style={{ width: `${(pending / total) * 100}%` }}
                className="bg-amber-400 h-full"
                title={`Pending: ${pending}`}
              />
              <div
                style={{ width: `${(notInterested / total) * 100}%` }}
                className="bg-slate-300 h-full"
                title={`Not Interested: ${notInterested}`}
              />
              <div
                style={{ width: `${(invalid / total) * 100}%` }}
                className="bg-rose-400 h-full"
                title={`Invalid: ${invalid}`}
              />
            </>
          )}
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#8BA888]" />
            <span className="text-[#5C5651]">
              <strong>{scheduled}</strong> Meeting Scheduled ({total > 0 ? Math.round((scheduled / total) * 100) : 0}%)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-[#5C5651]">
              <strong>{contacted}</strong> Interested / Contacted
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-[#5C5651]">
              <strong>{pending}</strong> Pending ({total > 0 ? Math.round((pending / total) * 100) : 0}%)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            <span className="text-[#5C5651]">
              <strong>{notInterested}</strong> Declined / DNC
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="text-[#5C5651]">
              <strong>{invalid}</strong> Invalid Number
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
