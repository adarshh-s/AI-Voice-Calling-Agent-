import React, { useState } from 'react';
import {
  Table,
  Plus,
  Phone,
  Play,
  Download,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';

interface SheetsViewProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onResetLeads: () => void;
  onTriggerCall: (leadId: string) => void;
}

export const SheetsView: React.FC<SheetsViewProps> = ({
  leads,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onResetLeads,
  onTriggerCall,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isAddingLead, setIsAddingLead] = useState(false);

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;

    const lead: Lead = {
      id: `lead-${Date.now()}`,
      name: newLead.name,
      company: newLead.company || 'Private Entity',
      phone: newLead.phone,
      email: newLead.email,
      status: 'Pending',
      callResult: '',
      meetingDate: '',
      meetingTime: '',
      notes: '',
      lastCalled: '',
    };

    onAddLead(lead);
    setNewLead({ name: '', company: '', phone: '', email: '' });
    setIsAddingLead(false);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = leads.filter((l) => l.status === 'Pending').length;

  const exportCSV = () => {
    const headers = [
      'Name',
      'Company',
      'Phone',
      'Email',
      'Status',
      'Call Result',
      'Meeting Date',
      'Meeting Time',
      'Notes',
      'Last Called',
    ];

    const rows = leads.map((l) => [
      `"${l.name}"`,
      `"${l.company}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.status}"`,
      `"${l.callResult}"`,
      `"${l.meetingDate}"`,
      `"${l.meetingTime}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${l.lastCalled}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ai_calling_agent_google_sheet.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'Meeting Scheduled':
        return 'bg-[#8BA888]/15 text-[#537050] border-[#8BA888]/30';
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Interested':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Contacted':
        return 'bg-[#F0EDE9] text-[#5C5651] border-[#E8E4DF]';
      case 'Not Interested':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Do Not Contact':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'No Answer':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      default:
        return 'bg-[#FAF9F6] text-[#8C847C] border-[#E8E4DF]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Banner */}
      <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8C847C] mb-1">
            <Table className="w-3.5 h-3.5 text-[#8BA888]" />
            <span>Google Sheet Database Sync</span>
          </div>
          <h2 className="text-xl font-bold text-[#2D2926]">Outbound Client Pipeline</h2>
          <p className="text-xs sm:text-sm text-[#5C5651] mt-0.5">
            Automation pulls rows where <code className="bg-[#FAF9F6] border border-[#E8E4DF] px-2 py-0.5 rounded text-amber-700 font-mono text-xs">Status = 'Pending'</code> and records results in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-add-client"
            onClick={() => setIsAddingLead(!isAddingLead)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE9] border border-[#E8E4DF] text-[#4A443F] font-medium text-xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#8C847C]" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-reset-leads"
            onClick={onResetLeads}
            title="Reset to default mock leads"
            className="p-2 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE9] border border-[#E8E4DF] text-[#8C847C] hover:text-[#2D2926] text-xs transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Lead Form (Collapsible) */}
      {isAddingLead && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-white border border-[#8BA888]/50 rounded-[24px] p-6 shadow-sm space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DF]">
            <h3 className="font-semibold text-sm text-[#2D2926] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#8BA888]" />
              Add New Client to Google Sheet
            </h3>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium">Initial Status: Pending</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] placeholder-[#8C847C] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">Company</label>
              <input
                type="text"
                placeholder="e.g. ABC Ltd"
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] placeholder-[#8C847C] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">Phone (E.164) *</label>
              <input
                type="text"
                required
                placeholder="e.g. +971501234567"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] placeholder-[#8C847C] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">Email</label>
              <input
                type="email"
                placeholder="e.g. john@example.com"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] placeholder-[#8C847C] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingLead(false)}
              className="px-4 py-2 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] text-[#5C5651] text-xs font-medium hover:bg-[#F0EDE9] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-[#8BA888] text-white text-xs font-semibold hover:bg-[#799676] shadow-sm transition-all"
            >
              Save to Sheet
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8C847C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, company, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E8E4DF] rounded-full pl-9 pr-4 py-2 text-xs text-[#2D2926] placeholder-[#8C847C] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30 shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#8C847C] shrink-0" />
          {['ALL', 'Pending', 'Meeting Scheduled', 'Contacted', 'Interested', 'Not Interested'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-[#8BA888] text-white shadow-sm'
                  : 'bg-white text-[#5C5651] hover:text-[#2D2926] hover:bg-[#F0EDE9] border border-[#E8E4DF]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sheet Table */}
      <div className="bg-white border border-[#E8E4DF] rounded-[24px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#E8E4DF] text-[#8C847C] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Call Result</th>
                <th className="py-3.5 px-4">Meeting Date</th>
                <th className="py-3.5 px-4">Meeting Time</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4">Last Called</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DF]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-[#8C847C]">
                    No leads matching search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-[#FAF9F6]/80 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#2D2926] whitespace-nowrap">
                      {lead.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#5C5651] whitespace-nowrap">
                      {lead.company}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#5C5651] whitespace-nowrap">
                      {lead.phone}
                    </td>
                    <td className="py-3.5 px-4 text-[#8C847C] whitespace-nowrap">
                      {lead.email || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#5C5651] whitespace-nowrap">
                      {lead.callResult || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#537050] font-mono whitespace-nowrap font-medium">
                      {lead.meetingDate || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#537050] font-mono whitespace-nowrap font-medium">
                      {lead.meetingTime || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#5C5651] max-w-xs truncate" title={lead.notes}>
                      {lead.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#8C847C] font-mono whitespace-nowrap">
                      {lead.lastCalled || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          id={`btn-call-row-${lead.id}`}
                          onClick={() => onTriggerCall(lead.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#8BA888]/15 hover:bg-[#8BA888] text-[#537050] hover:text-white border border-[#8BA888]/30 text-[11px] font-semibold transition-all shadow-sm"
                          title="Call this lead now"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </button>

                        <button
                          onClick={() => onDeleteLead(lead.id)}
                          className="p-1.5 rounded-full text-[#8C847C] hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
