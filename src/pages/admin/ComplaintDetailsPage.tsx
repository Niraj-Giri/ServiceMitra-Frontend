import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  ArrowLeft, FileText, Eye, Loader2, Calendar, User, Wrench, Clock, ShieldAlert
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
  category: string;
  evidenceUrl: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolutionRemarks: string | null;
}

interface AdminNote {
  id: number;
  adminName: string;
  noteText: string;
  createdAt: string;
}

interface ComplaintDetailsPageProps {
  complaintId: number;
  onBack: () => void;
  onSelectBooking?: (id: number) => void;
  onSelectCustomer?: (id: number) => void;
  onSelectProvider?: (id: number) => void;
  onRefreshStats?: () => void;
}

export const ComplaintDetailsPage: React.FC<ComplaintDetailsPageProps> = ({
  complaintId,
  onBack,
  onSelectBooking,
  onSelectCustomer,
  onSelectProvider,
  onRefreshStats
}) => {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Input states
  const [newNoteText, setNewNoteText] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const compRes = await apiClient.get(`/admin/complaints/${complaintId}`);
      const c = compRes.data?.data || compRes.data;
      setComplaint(c);
      setResolutionRemarks(c.resolutionRemarks || '');

      // Load related booking
      if (c.bookingId) {
        const bookRes = await apiClient.get(`/admin/bookings/${c.bookingId}`);
        setBooking(bookRes.data?.data || bookRes.data);
      }

      // Load admin notes
      const notesRes = await apiClient.get(`/admin/complaints/${complaintId}/notes`);
      setNotes(notesRes.data?.data || notesRes.data || []);
    } catch (err) {
      console.error('Failed to load complaint detail dependencies', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [complaintId]);

  const handleUpdateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/complaints/${complaintId}/status`, { status });
      alert(`Complaint status updated to ${status}`);
      loadAllData();
      if (onRefreshStats) onRefreshStats();
    } catch {
      alert('Failed to update complaint status');
    }
    setActionLoading(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/admin/complaints/${complaintId}/notes`, { noteText: newNoteText });
      setNewNoteText('');
      const notesRes = await apiClient.get(`/admin/complaints/${complaintId}/notes`);
      setNotes(notesRes.data?.data || notesRes.data || []);
    } catch {
      alert('Failed to save admin note');
    }
    setActionLoading(false);
  };

  const handleResolve = async () => {
    if (!resolutionRemarks.trim()) {
      alert('Please enter final resolution remarks before closing the complaint.');
      return;
    }
    if (!confirm('Resolve this complaint? This will set status to RESOLVED.')) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/complaints/${complaintId}/resolve`, { resolutionRemarks });
      alert('Complaint resolved successfully.');
      loadAllData();
      if (onRefreshStats) onRefreshStats();
    } catch {
      alert('Failed to resolve complaint');
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!resolutionRemarks.trim()) {
      alert('Please enter resolution remarks clarifying the rejection reason.');
      return;
    }
    if (!confirm('Reject this complaint? This will set status to REJECTED.')) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/complaints/${complaintId}/reject`, { resolutionRemarks });
      alert('Complaint rejected.');
      loadAllData();
      if (onRefreshStats) onRefreshStats();
    } catch {
      alert('Failed to reject complaint');
    }
    setActionLoading(false);
  };

  const handleApproveRefund = async () => {
    if (!confirm('Approve full refund for this online booking? This resolves the complaint.')) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/complaints/${complaintId}/refund`);
      alert('Refund approved successfully.');
      loadAllData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve refund');
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

  const isOnlinePayment = booking?.paymentMethod === 'ONLINE';

  return (
    <div className="animate-fade-in space-y-6 text-xs text-slate-700 font-semibold">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Dispute Ticket #{complaint.id}</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Filed: {new Date(complaint.createdAt).toLocaleString()}</p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
          complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          complaint.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
          complaint.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' :
          'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {complaint.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Complaint info, Linked Details & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-rose-600" /> Complaint details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block mb-1">Complaint Type / Category</span>
                <span className="font-bold text-slate-800 uppercase bg-slate-100 px-2 py-0.5 rounded text-[10px]">{complaint.category || 'General Dispute'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Priority</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase border ${
                  complaint.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                  complaint.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-slate-50 text-slate-600 border-slate-200'
                }`}>{complaint.priority}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-400 block mb-1">Subject</span>
                <span className="font-bold text-slate-900 text-sm">{complaint.subject}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-400 block mb-1">Description</span>
                <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 border p-3 rounded-xl">{complaint.description}</p>
              </div>
            </div>
            {complaint.evidenceUrl && (
              <div className="pt-2">
                <span className="text-slate-400 block mb-1.5">Evidence Images</span>
                <a href={complaint.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition font-bold">
                  <FileText className="h-4 w-4 text-rose-600" /> View Evidence Document
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </div>
            )}
          </div>

          {/* Admin Internal Notes Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5"><Clock className="h-4 w-4 text-slate-400" /> Admin internal notes</h3>
            
            {/* Note submission */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Log internal update memo note..."
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
              />
              <button type="submit" disabled={actionLoading || !newNoteText.trim()} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition disabled:opacity-40">
                Log Note
              </button>
            </form>

            {/* Notes list */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {notes.map(note => (
                <div key={note.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                  <p className="text-slate-700 leading-normal font-semibold text-[11px]">{note.noteText}</p>
                  <span className="text-[9px] text-slate-400 block font-bold">
                    By {note.adminName} · {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-6 text-slate-400 italic font-bold">No internal notes added yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Linked Information & Resolution details */}
        <div className="space-y-6">
          {/* Booking Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5"><Calendar className="h-4 w-4 text-slate-450" /> Booking information</h3>
            {booking ? (
              <div className="space-y-2 text-[11px]">
                <p><span className="text-slate-400 font-bold">Booking ID:</span> <span className="font-bold text-slate-800">#{booking.id}</span></p>
                <p><span className="text-slate-400 font-bold">Service:</span> <span className="text-slate-700">{booking.serviceName}</span></p>
                <p><span className="text-slate-400 font-bold">Amount:</span> <span className="font-mono font-bold text-slate-800">₹{Number(booking.totalBill || booking.baseAmount || 0).toLocaleString()}</span></p>
                <p><span className="text-slate-400 font-bold">Payment Method:</span> <span className="font-bold uppercase text-slate-700">{booking.paymentMethod || 'ONLINE'}</span></p>
                {onSelectBooking && (
                  <button onClick={() => onSelectBooking(booking.id)} className="w-full mt-2 bg-slate-50 border hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl transition">
                    View Complete Booking details
                  </button>
                )}
              </div>
            ) : <div className="text-slate-400 italic">No booking data loaded.</div>}
          </div>

          {/* Customer Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5"><User className="h-4 w-4 text-slate-455" /> Customer details</h3>
            {booking?.customer ? (
              <div className="space-y-2 text-[11px]">
                <p><span className="text-slate-400 font-bold">Name:</span> <span className="font-bold text-slate-800">{booking.customer.name}</span></p>
                <p><span className="text-slate-400 font-bold">Customer ID:</span> <span className="font-bold text-slate-800">#{booking.customer.id}</span></p>
                <p><span className="text-slate-400 font-bold">Phone:</span> <span className="text-slate-700">{booking.customer.phone || 'N/A'}</span></p>
                {onSelectCustomer && (
                  <button onClick={() => onSelectCustomer(booking.customer.id)} className="w-full mt-2 bg-slate-50 border hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl transition">
                    View Customer Profile
                  </button>
                )}
              </div>
            ) : <div className="text-slate-400 italic">No customer data loaded.</div>}
          </div>

          {/* Provider Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5"><Wrench className="h-4 w-4 text-slate-455" /> Provider information</h3>
            {booking?.provider ? (
              <div className="space-y-2 text-[11px]">
                <p><span className="text-slate-400 font-bold">Business Name:</span> <span className="font-bold text-slate-800">{booking.provider.name}</span></p>
                <p><span className="text-slate-400 font-bold">Provider ID:</span> <span className="font-bold text-slate-800">#{booking.provider.id}</span></p>
                <p><span className="text-slate-400 font-bold">Phone:</span> <span className="text-slate-700">{booking.provider.phone || 'N/A'}</span></p>
                {onSelectProvider && (
                  <button onClick={() => onSelectProvider(booking.provider.id)} className="w-full mt-2 bg-slate-50 border hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl transition">
                    View Provider Profile
                  </button>
                )}
              </div>
            ) : <div className="text-slate-400 italic text-amber-600 font-bold">No provider assigned to booking.</div>}
          </div>
        </div>
      </div>

      {/* Bottom Resolution & Actions Footer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Remarks Input */}
        <div className="md:col-span-2 space-y-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Resolution Remarks</span>
          <textarea
            rows={2}
            required
            placeholder="Provide final resolution description summary before resolving or rejecting complaint..."
            value={resolutionRemarks}
            onChange={e => setResolutionRemarks(e.target.value)}
            className="w-full p-3 border border-slate-250 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 justify-end">
          {complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
            <>
              {complaint.status !== 'UNDER_REVIEW' && (
                <button
                  onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                  disabled={actionLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold transition shrink-0"
                >
                  Under Review
                </button>
              )}
              {complaint.status !== 'REQUEST_MORE_INFORMATION' && (
                <button
                  onClick={() => handleUpdateStatus('REQUEST_MORE_INFORMATION')}
                  disabled={actionLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold transition shrink-0"
                >
                  Request Info
                </button>
              )}
              <button
                onClick={handleResolve}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold transition shrink-0"
              >
                Resolve Ticket
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold transition shrink-0"
              >
                Reject Ticket
              </button>
              {isOnlinePayment && booking?.paymentStatus !== 'REFUNDED' && (
                <button
                  onClick={handleApproveRefund}
                  disabled={actionLoading}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold transition shrink-0 border"
                >
                  Approve Refund
                </button>
              )}
            </>
          )}
          {(complaint.status === 'RESOLVED' || complaint.status === 'REJECTED') && (
            <div className="text-[11px] font-bold text-slate-400 uppercase italic">
              Resolved Decision Lodged. Case Closed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
