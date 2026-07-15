import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Search, Eye, X, Send, CheckSquare, FileText
} from 'lucide-react';

interface Complaint {
  id: number;
  bookingId: number;
  customerId: number;
  providerId: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  evidenceUrl: string | null;
  createdAt: string;
  resolvedAt: string | null;
  assignedAdminId: number | null;
  internalNotes: string | null;
}

interface ComplaintMessage {
  id: number;
  complaintId: number;
  senderRole: string; // CUSTOMER, PROVIDER, ADMIN
  content: string;
  createdAt: string;
}

interface ComplaintTabProps {
  onSelectComplaint?: (id: number) => void;
  onSelectCustomer?: (id: number) => void;
  onSelectProvider?: (id: number) => void;
}

export const ComplaintTab: React.FC<ComplaintTabProps> = ({ onSelectComplaint, onSelectCustomer, onSelectProvider }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Selected complaint workspace
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  
  // Workspace inputs
  const [replyText, setReplyText] = useState('');
  const [adminAssignId, setAdminAssignId] = useState('');
  const [internalMemo, setInternalMemo] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/complaints');
      setComplaints(response.data || []);
    } catch (err) {
      console.error('Failed to load complaints', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const loadComplaintWorkspace = async (c: Complaint) => {
    setSelectedComplaint(c);
    setAdminAssignId(String(c.assignedAdminId ?? ''));
    setInternalMemo(c.internalNotes || '');
    setMsgLoading(true);
    try {
      const resM = await apiClient.get(`/admin/complaints/${c.id}/messages`);
      setMessages(resM.data || []);
    } catch (err) {
      console.error('Failed to load complaint chat thread', err);
    }
    setMsgLoading(false);
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !replyText.trim()) return;
    try {
      await apiClient.post(`/admin/complaints/${selectedComplaint.id}/messages`, {
        content: replyText,
        senderRole: 'ADMIN'
      });
      setReplyText('');
      // Reload message thread
      const resM = await apiClient.get(`/admin/complaints/${selectedComplaint.id}/messages`);
      setMessages(resM.data || []);
    } catch (err) {
      alert('Failed to send reply message');
    }
  };

  const handleAssignModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      await apiClient.put(`/admin/complaints/${selectedComplaint.id}/assign`, {
        adminId: adminAssignId ? parseInt(adminAssignId) : null
      });
      alert('Moderator assigned successfully');
      fetchComplaints();
    } catch (err) {
      alert('Failed to assign moderator');
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      await apiClient.put(`/admin/complaints/${selectedComplaint.id}/notes`, {
        notes: internalMemo
      });
      alert('Internal tracking notes saved successfully');
      fetchComplaints();
    } catch (err) {
      alert('Failed to save tracking notes');
    }
  };

  const handleResolveComplaint = async () => {
    if (!selectedComplaint) return;
    if (!confirm('Mark this support ticket dispute as RESOLVED? This notifies all parties.')) return;
    try {
      await apiClient.put(`/admin/complaints/${selectedComplaint.id}/resolve`);
      alert('Dispute marked as RESOLVED');
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert('Failed to resolve complaint');
    }
  };

  // Filters logic
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.subject.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs text-slate-700 font-semibold">
      
      {/* Search & Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 min-w-[280px] items-center gap-3 relative">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search support tickets by subject, description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 focus:outline-none font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 focus:outline-none font-semibold"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
      </div>

      {/* Main Complaints list table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">Subject & Description</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Assigned Admin</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold">
              {filteredComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/20">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-900 block">#{c.id}</span>
                    <div className="flex flex-col gap-0.5 mt-1 text-[9px] font-bold text-slate-400 whitespace-nowrap">
                      <span 
                        onClick={() => onSelectCustomer && onSelectCustomer(c.customerId)}
                        className={onSelectCustomer ? 'cursor-pointer hover:underline hover:text-blue-600' : ''}
                      >
                        Cust: #{c.customerId}
                      </span>
                      <span 
                        onClick={() => onSelectProvider && onSelectProvider(c.providerId)}
                        className={onSelectProvider ? 'cursor-pointer hover:underline hover:text-blue-600' : ''}
                      >
                        Prov: #{c.providerId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">#{c.bookingId}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 leading-tight">{c.subject}</div>
                    <div className="text-[10px] text-slate-400 mt-1 max-w-xs truncate font-medium">{c.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      c.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      c.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono">
                    {c.assignedAdminId ? `Admin #${c.assignedAdminId}` : <span className="text-slate-350 italic">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      c.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelectComplaint ? onSelectComplaint(c.id) : loadComplaintWorkspace(c)}
                      className="px-2.5 py-1 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Workspace Room
                    </button>
                  </td>
                </tr>
              ))}
              {filteredComplaints.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs italic">
                    No complaints registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLAINTS DISPUTE WORKSPACE MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] relative animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Support Ticket Workspace #{selectedComplaint.id}</h3>
                <p className="text-xs text-slate-400 mt-1">Dispute Subject: <span className="font-bold text-slate-700">{selectedComplaint.subject}</span> • Filed: {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 text-slate-700 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: General Info, Evidence, Resolution tools */}
                <div className="lg:col-span-1 space-y-5">
                  
                  {/* General details */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-1">Ticket Context</span>
                    <p><span className="font-bold text-slate-500">Linked Booking:</span> Booking #{selectedComplaint.bookingId}</p>
                    <p><span className="font-bold text-slate-500">Customer ID:</span> #{selectedComplaint.customerId}</p>
                    <p><span className="font-bold text-slate-500">Provider ID:</span> #{selectedComplaint.providerId}</p>
                    <p><span className="font-bold text-slate-500">Description:</span> {selectedComplaint.description}</p>
                  </div>

                  {/* Evidence Url attachments */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-1">Dispute Evidence Files</span>
                    {selectedComplaint.evidenceUrl ? (
                      <a href={selectedComplaint.evidenceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 font-bold transition">
                        <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-rose-600" /> Evidence Document</span>
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                      </a>
                    ) : <div className="text-slate-400 italic">No files or screenshots uploaded.</div>}
                  </div>

                  {/* Assign Ticket Form */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-2.5">Assign Moderator</span>
                    <form onSubmit={handleAssignModerator} className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Admin ID (e.g. 1)"
                        value={adminAssignId}
                        onChange={e => setAdminAssignId(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-mono font-bold"
                      />
                      <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg">Assign</button>
                    </form>
                  </div>

                  {/* Internal Tracking Notes Form */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-2.5">Internal Tracking notes</span>
                    <form onSubmit={handleSaveNotes} className="space-y-2">
                      <textarea
                        rows={3}
                        placeholder="Internal status updates, mediation logs..."
                        value={internalMemo}
                        onChange={e => setInternalMemo(e.target.value)}
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg"
                      />
                      <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg transition">Save notes</button>
                    </form>
                  </div>

                </div>

                {/* Right Side: Chat room replies & Resolution Action */}
                <div className="lg:col-span-2 flex flex-col justify-between h-[500px]">
                  
                  {/* Chat logs messages */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-1 flex flex-col overflow-y-auto mb-4">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-3">Live Mediation Room Chat</span>
                    {msgLoading ? (
                      <div className="text-center py-20 text-slate-400">Loading replies...</div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {messages.map((m) => (
                          <div 
                            key={m.id} 
                            className={`flex flex-col max-w-[70%] p-3 rounded-2xl ${
                              m.senderRole === 'ADMIN' 
                                ? 'bg-blue-600 text-white ml-auto rounded-tr-none' 
                                : 'bg-white border border-slate-200 text-slate-800 mr-auto rounded-tl-none'
                            }`}
                          >
                            <span className="text-[9px] font-extrabold opacity-75 uppercase tracking-wider block mb-1">
                              {m.senderRole} • {new Date(m.createdAt).toLocaleTimeString()}
                            </span>
                            <p className="font-semibold text-[11px] leading-relaxed">{m.content}</p>
                          </div>
                        ))}
                        {messages.length === 0 && (
                          <div className="text-slate-400 italic text-center py-10">No messages sent in this ticket room.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Send mediation reply form */}
                  <div className="flex gap-3">
                    <form onSubmit={handlePostReply} className="flex-1 flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Write dynamic mediation reply here..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                      />
                      <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Send className="h-4 w-4" /> Reply
                      </button>
                    </form>

                    {selectedComplaint.status !== 'RESOLVED' && (
                      <button
                        onClick={handleResolveComplaint}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <CheckSquare className="h-4 w-4" /> Resolve Ticket
                      </button>
                    )}
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
