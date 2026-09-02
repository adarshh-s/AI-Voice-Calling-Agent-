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
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  Layers,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { exportLeadsToExcel } from '../utils/excelParser';

interface SheetsViewProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onResetLeads: () => void;
  onTriggerCall: (leadId: string) => void;
  onOpenExcelUpload: () => void;
  onStartCampaignWithSelected?: (selectedIds: string[]) => void;
}

export const SheetsView: React.FC<SheetsViewProps> = ({
  leads,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onResetLeads,
  onTriggerCall,
  onOpenExcelUpload,
  onStartCampaignWithSelected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

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
      company: newLead.company || 'Prospective Client',
      phone: newLead.phone.startsWith('+') ? newLead.phone : `+91${newLead.phone.replace(/\D/g, '')}`,
      rawPhone: newLead.phone,
      email: newLead.email,
      status: 'Pending',
      callResult: '',
      meetingDate: '',
      meetingTime: '',
      notes: '',
      lastCalled: '',
      isValidPhone: true,
    };

    onAddLead(lead);
    setNewLead({ name: '', company: '', phone: '', email: '' });
    setIsAddingLead(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    onUpdateLead(editingLead);
    setEditingLead(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
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
  const scheduledCount = leads.filter((l) => l.status === 'Meeting Scheduled').length;
  const invalidCount = leads.filter((l) => !l.isValidPhone || l.status === 'Invalid Number').length;

  const handleExportExcel = () => {
    exportLeadsToExcel(leads, `Outbound_Campaign_Leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'Meeting Scheduled':
        return 'bg-[#8BA888]/15 text-[#537050] border-[#8BA888]/30';
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse';
      case 'Interested':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Contacted':
        return 'bg-[#F0EDE9] text-[#5C5651] border-[#E8E4DF]';
      case 'Not Interested':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Do Not Contact':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'Invalid Number':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'No Answer':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      default:
        return 'bg-[#FAF9F6] text-[#8C847C] border-[#E8E4DF]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Banner */}
      <div className="bg-white border border-[#E8E4DF] rounded-[28px] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8C847C] mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#8BA888]" />
            <span>Client Spreadsheet & Database Ingestion</span>
          </div>
          <h2 className="text-xl font-bold text-[#2D2926]">Client Calling Registry</h2>
          <p className="text-xs sm:text-sm text-[#5C5651] mt-0.5">
            Feed an Excel spreadsheet (<code className="text-[#537050] font-mono">.xlsx, .xls, .csv</code>) to automatically normalize phone numbers and initiate automated AI calling batches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-upload-excel-top"
            onClick={onOpenExcelUpload}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Feed Excel / CSV</span>
          </button>

          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE9] border border-[#E8E4DF] text-[#4A443F] font-semibold text-xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#8BA888]" />
            <span>Export .XLSX</span>
          </button>

          <button
            id="btn-add-client-manual"
            onClick={() => setIsAddingLead(!isAddingLead)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE9] border border-[#E8E4DF] text-[#4A443F] font-semibold text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#8C847C]" />
            <span>Add Single Lead</span>
          </button>

          <button
            id="btn-reset-leads-default"
            onClick={onResetLeads}
            title="Reset to clean demo data"
            className="p-2 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE9] border border-[#E8E4DF] text-[#8C847C] hover:text-[#2D2926] text-xs transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs">
          <p className="text-[10px] uppercase font-bold text-[#8C847C] tracking-wider">TOTAL CLIENTS</p>
          <p className="text-xl font-bold text-[#2D2926] mt-0.5">{leads.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs">
          <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">PENDING CALLS</p>
          <p className="text-xl font-bold text-amber-800 mt-0.5">{pendingCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs">
          <p className="text-[10px] uppercase font-bold text-[#537050] tracking-wider">MEETINGS BOOKED</p>
          <p className="text-xl font-bold text-[#537050] mt-0.5">{scheduledCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E4DF] shadow-xs">
          <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">INVALID / SKIPPED</p>
          <p className="text-xl font-bold text-rose-700 mt-0.5">{invalidCount}</p>
        </div>
      </div>

      {/* Add Lead Form (Collapsible) */}
      {isAddingLead && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-white border border-[#8BA888]/50 rounded-[28px] p-6 shadow-sm space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DF]">
            <h3 className="font-bold text-sm text-[#2D2926] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#8BA888]" />
              Add Single Client to Spreadsheet
            </h3>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold">
              Initial Status: Pending
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A443F] mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Adarsh"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] placeholder-[#8C847C] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A443F] mb-1">Company</label>
              <input
                type="text"
                placeholder="e.g. Acme Tech"
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] placeholder-[#8C847C] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A443F] mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 9061584951 or +919061584951"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] placeholder-[#8C847C] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A443F] mb-1">Email</label>
              <input
                type="email"
                placeholder="e.g. adarshs8400@gmail.com"
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
              className="px-4 py-2 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] text-[#5C5651] text-xs font-semibold hover:bg-[#F0EDE9] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#8BA888] text-white text-xs font-bold hover:bg-[#799676] shadow-sm transition-all"
            >
              Save to Spreadsheet
            </button>
          </div>
        </form>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2926]/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E8E4DF] rounded-[28px] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DF]">
              <h3 className="font-bold text-sm text-[#2D2926] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#8BA888]" />
                Edit Lead Details: {editingLead.name}
              </h3>
              <button
                onClick={() => setEditingLead(null)}
                className="text-xs text-[#8C847C] hover:text-[#2D2926]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2926] mb-1">Name</label>
                  <input
                    type="text"
                    value={editingLead.name}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D2926] mb-1">Company</label>
                  <input
                    type="text"
                    value={editingLead.company}
                    onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2926] mb-1">Phone (E.164)</label>
                  <input
                    type="text"
                    value={editingLead.phone}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D2926] mb-1">Email</label>
                  <input
                    type="email"
                    value={editingLead.email}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2926] mb-1">Status</label>
                  <select
                    value={editingLead.status}
                    onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value as any })}
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Meeting Scheduled">Meeting Scheduled</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Invalid Number">Invalid Number</option>
                    <option value="Do Not Contact">Do Not Contact</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D2926] mb-1">Call Result</label>
                  <input
                    type="text"
                    value={editingLead.callResult}
                    onChange={(e) => setEditingLead({ ...editingLead, callResult: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2926] mb-1">Notes / Call Summary</label>
                <textarea
                  rows={2}
                  value={editingLead.notes}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl p-3 text-xs text-[#2D2926] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E4DF]">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] text-xs font-semibold text-[#5C5651]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#8BA888] text-white text-xs font-bold shadow-sm"
                >
                  Update Row
                </button>
              </div>
            </form>
          </div>
        </div>
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
            className="w-full bg-white border border-[#E8E4DF] rounded-full pl-9 pr-4 py-2 text-xs text-[#2D2926] placeholder-[#8C847C] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30 shadow-xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#8C847C] shrink-0" />
          {['ALL', 'Pending', 'Meeting Scheduled', 'Contacted', 'Interested', 'Not Interested', 'Invalid Number'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-[#8BA888] text-white shadow-xs'
                  : 'bg-white text-[#5C5651] hover:text-[#2D2926] hover:bg-[#F0EDE9] border border-[#E8E4DF]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Selection Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-[#2D2926] text-white flex items-center justify-between text-xs animate-in fade-in shadow-md">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-[#8BA888]" />
            <span>
              <strong>{selectedIds.length}</strong> of {filteredLeads.length} leads selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (onStartCampaignWithSelected) {
                  onStartCampaignWithSelected(selectedIds);
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white font-bold"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Call Selected Batch</span>
            </button>

            <button
              onClick={() => {
                selectedIds.forEach((id) => onDeleteLead(id));
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-full bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Sheet Table */}
      <div className="bg-white border border-[#E8E4DF] rounded-[28px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#E8E4DF] text-[#8C847C] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-[#8BA888] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Contact Name</th>
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Sanitized Phone (E.164)</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Call Result</th>
                <th className="py-3.5 px-4">Meeting Date</th>
                <th className="py-3.5 px-4">Meeting Time</th>
                <th className="py-3.5 px-4">Notes / Summary</th>
                <th className="py-3.5 px-4">Last Called</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DF]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-[#8C847C]">
                    <FileSpreadsheet className="w-8 h-8 text-[#8C847C]/40 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#2D2926]">No client records in this view</p>
                    <p className="text-xs text-[#8C847C] mt-1">
                      Click <strong className="text-[#8BA888]">"Feed Excel / CSV"</strong> above to upload your client spreadsheet.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-[#FAF9F6]/80 transition-colors group ${
                      selectedIds.includes(lead.id) ? 'bg-[#8BA888]/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="rounded text-[#8BA888] focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#2D2926] whitespace-nowrap">
                      {lead.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#5C5651] whitespace-nowrap">
                      {lead.company}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#2D2926] whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span>{lead.phone}</span>
                        {!lead.isValidPhone && (
                          <span title="Invalid phone format" className="text-rose-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#8C847C] whitespace-nowrap">
                      {lead.email || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#5C5651] whitespace-nowrap font-medium">
                      {lead.callResult || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#537050] font-mono whitespace-nowrap font-bold">
                      {lead.meetingDate || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#537050] font-mono whitespace-nowrap font-bold">
                      {lead.meetingTime || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#5C5651] max-w-xs truncate" title={lead.notes}>
                      {lead.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#8C847C] font-mono whitespace-nowrap text-[11px]">
                      {lead.lastCalled || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          id={`btn-call-row-${lead.id}`}
                          onClick={() => onTriggerCall(lead.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#8BA888]/15 hover:bg-[#8BA888] text-[#537050] hover:text-white border border-[#8BA888]/30 text-[11px] font-bold transition-all shadow-xs"
                          title="Call this lead now"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </button>

                        <button
                          onClick={() => setEditingLead(lead)}
                          className="p-1.5 rounded-full text-[#8C847C] hover:text-[#2D2926] hover:bg-[#E8E4DF]/50 transition-all opacity-0 group-hover:opacity-100"
                          title="Edit row"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
