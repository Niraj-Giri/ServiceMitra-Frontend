import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import {
  ArrowLeft, CheckCircle2, FileText, Send, Eye, Loader2
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

interface ComplaintDetailsPageProps {
  complaintId: number;
  onBack: () => void;
  onRefreshStats?: () => void;
}

export const ComplaintDetailsPage: React.FC<ComplaintDetailsPageProps> = ({ complaintId, onBack, onRefreshStats }) => {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  // Form inputs
  const [replyText, setReplyText] = useState('');
  const [adminAssignId, setAdminAssignId] = useState('');
  const [internalMemo, setInternalMemo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const compRes = await apiClient.get(`/admin/complaints/${complaintId}`);
      const c = compRes.data?.data || compRes.data;
      setComplaint(c);
      setAdminAssignId(String(c.assignedAdminId ?? ''));
      setInternalMemo(c.internalNotes || '');

      setMsgLoading(true);
      const msgRes = await apiClient.get(`/admin/complaints/${complaintId}/messages`);
      setMessages(msgRes.data?.data || msgRes.data || []);
      setMsgLoading(false);
    } catch (err) {
      console.error('Failed to load complaint data', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [complaintId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/admin/complaints/${complaintId}/messages`, {
        content: replyText,
        senderRole: 'ADMIN'
      });
      setReplyText('');
      const msgRes = await apiClient.get(`/admin/complaints/${complaintId}/messages`);
      setMessages(msgRes.data?.data || msgRes.data || []);
    } catch {
      alert('Failed to send reply');
    }
    setActionLoading(false);
  };

  const handleAssignModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/complaints/${complaintId}/assign`, {
        adminId: adminAssignId ? parseInt(adminAssignId) : null
      });
      alert('Moderator assigned successfully');
      loadAllData();
      if (onRefreshStats) onRefreshStats();
    } catch {
      alert('Failed to assign moderator');
    }
    setActionLoading(false);
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/complaints/${complaintId}/notes`, {
        notes: internalMemo
      });
      alert('Internal tracking notes saved successfully');
      loadAllData();
    } catch {
      alert('Failed to save tracking notes');
    }
    setActionLoading(false);
  };

  const handleResolveComplaint = async () => {
    if (!confirm('Mark this support ticket dispute as RESOLVED? This notifies all parties.')) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/complaints/${complaintId}/resolve`);
      alert('Dispute marked as RESOLVED');
      loadAllData();
      if (onRefreshStats) onRefreshStats();
    } catch {
      alert('Failed to resolve complaint');
    }
    setActionLoading(false);
  };

  if (loading || !complaint) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 text-xs text-slate-700 font-semibold">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Mediation Dispute #{complaint.id}</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Filed: {new Date(complaint.createdAt).toLocaleString()}</p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
          complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          complaint.status === 'CLOSED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
          'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
        }`}>
          {complaint.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side Panels: Info, Evidence, Resolution tools */}
        <div className="space-y-6">
          {/* General details */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Ticket Context</h3>
            <div className="space-y-2">
              <p><span className="text-slate-400">Linked Booking:</span> <span className="font-mono font-bold text-slate-800">#{complaint.bookingId}</span></p>
              <p><span className="text-slate-400">Customer ID:</span> <span className="font-mono text-slate-800">#{complaint.customerId}</span></p>
              <p><span className="text-slate-400">Provider ID:</span> <span className="font-mono text-slate-800">#{complaint.providerId}</span></p>
              <p><span className="text-slate-400 block mb-1">Subject:</span> <span className="font-bold text-slate-850 block">{complaint.subject}</span></p>
              <p><span className="text-slate-400 block mb-1">Description:</span> <span className="text-slate-700 block bg-slate-50 p-2.5 rounded-xl border leading-relaxed">{complaint.description}</span></p>
            </div>
          </div>

          {/* Evidence Url attachments */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Evidence Files</h3>
            {complaint.evidenceUrl ? (
              <a href={complaint.evidenceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold transition">
                <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-rose-600" /> Evidence Document</span>
                <Eye className="h-3.5 w-3.5 text-slate-400" />
              </a>
            ) : <div className="text-slate-400 italic py-2">No files or screenshots uploaded.</div>}
          </div>

          {/* Assign Ticket Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Assign Moderator</h3>
            <form onSubmit={handleAssignModerator} className="flex gap-2">
              <input
                type="number"
                placeholder="Admin ID (e.g. 1)"
                value={adminAssignId}
                onChange={e => setAdminAssignId(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg font-mono font-bold focus:outline-none"
              />
              <button type="submit" disabled={actionLoading} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded-lg transition shrink-0">Assign</button>
            </form>
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Mediation Tracking Memo</h3>
            <form onSubmit={handleSaveNotes} className="space-y-2">
              <textarea
                rows={3}
                placeholder="Internal status updates, mediation logs..."
                value={internalMemo}
                onChange={e => setInternalMemo(e.target.value)}
                className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none"
              />
              <button type="submit" disabled={actionLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl transition">Save memo note</button>
            </form>
          </div>
        </div>

        {/* Right Side: Chat room replies & Resolution Action */}
        <div className="lg:col-span-2 flex flex-col h-[520px] justify-between">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex-1 flex flex-col overflow-hidden mb-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Mediation Conversation Room</h3>
            {msgLoading ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[75%] p-3 rounded-2xl ${
                      m.senderRole === 'ADMIN'
                        ? 'bg-blue-600 text-white ml-auto rounded-tr-none shadow-xs'
                        : 'bg-slate-50 text-slate-800 mr-auto rounded-tl-none border border-slate-100'
                    }`}
                  >
                    <span className="text-[9px] font-extrabold opacity-75 uppercase tracking-wider block mb-1">
                      {m.senderRole} · {new Date(m.createdAt).toLocaleTimeString()}
                    </span>
                    <p className="font-semibold text-[11px] leading-normal">{m.content}</p>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-slate-400 italic text-center py-20">No mediation messages sent.</div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <div className="flex gap-3 items-center">
            <form onSubmit={handlePostReply} className="flex-1 flex gap-2">
              <input
                type="text"
                required
                placeholder="Post reply in mediation room..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
              />
              <button
                type="submit"
                disabled={actionLoading || !replyText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Send className="h-4 w-4" /> Reply
              </button>
            </form>

            {complaint.status !== 'RESOLVED' && (
              <button
                onClick={handleResolveComplaint}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="h-4 w-4" /> Resolve Ticket
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
