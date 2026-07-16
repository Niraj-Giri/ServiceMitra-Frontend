import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle2, FileText, Eye, Send } from 'lucide-react';

interface CustomerDisputesProps {
  complaints: any[];
  activeComplaint: any | null;
  onSelectComplaint: (complaint: any) => void;
  onRespond?: (id: number, text: string) => Promise<void>;
}

export const CustomerDisputes: React.FC<CustomerDisputesProps> = ({
  complaints,
  activeComplaint,
  onSelectComplaint,
  onRespond
}) => {
  const navigate = useNavigate();
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (complaints.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="font-bold text-slate-900">No disputes logged yet</div>
        <p className="mt-1 text-sm text-slate-500">You can file a complaint directly from any completed booking's tracking page.</p>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'REQUEST_MORE_INFORMATION':
        return 'bg-blue-50 text-blue-700 border-blue-105';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleRespondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim() || !onRespond || !activeComplaint) return;
    setSubmitting(true);
    try {
      await onRespond(activeComplaint.id, responseText);
      setResponseText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Complaints list */}
      <div className="lg:col-span-1 space-y-3">
        {complaints.map((c) => (
          <div 
            key={c.id} 
            onClick={() => {
              onSelectComplaint(c);
              setResponseText('');
            }}
            className={`p-4 border rounded-2xl cursor-pointer transition ${
              activeComplaint?.id === c.id ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-bold text-rose-600">Dispute #{c.id}</span>
              <span className={`px-2 py-0.5 rounded font-extrabold border ${getStatusStyle(c.status)}`}>
                {c.status}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm truncate">{c.subject}</h4>
            <p className="text-xs text-slate-505 truncate mt-1">{c.description}</p>
          </div>
        ))}
      </div>

      {/* Right Column: Complaint details & Status */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between min-h-[400px]">
        {activeComplaint ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-600 font-mono">DISPUTE CASE #{activeComplaint.id}</span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border uppercase ${getStatusStyle(activeComplaint.status)}`}>
                  {activeComplaint.status}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mt-2">{activeComplaint.subject}</h3>
              <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 font-bold mt-1.5">
                <span>Submitted: {new Date(activeComplaint.createdAt).toLocaleString()}</span>
                <span>•</span>
                <button 
                  onClick={() => navigate(`/tracking/${activeComplaint.bookingId}`)}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-bold"
                >
                  Booking ID: #{activeComplaint.bookingId}
                </button>
                <span>•</span>
                <span className="text-indigo-600">Category: {activeComplaint.category}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Complaint Details</h4>
              <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 border p-4 rounded-xl font-medium whitespace-pre-wrap">
                {activeComplaint.description}
              </div>
            </div>

            {/* Evidence attachment */}
            {activeComplaint.evidenceUrl && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Submitted Evidence</h4>
                <a href={activeComplaint.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition font-bold text-xs text-slate-700">
                  <FileText className="h-4 w-4 text-rose-600" /> View Evidence Document
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </div>
            )}

            {/* Resolution Remarks / Support requests */}
            {activeComplaint.status === 'REQUEST_MORE_INFORMATION' && onRespond && (
              <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" /> Support Team Action Required
                </h4>
                <p className="text-xs text-blue-700 leading-normal">
                  The support team requires additional details to resolve your dispute. Please reply below:
                </p>
                <form onSubmit={handleRespondSubmit} className="space-y-2">
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide additional details/evidence description as requested..."
                    value={responseText}
                    onChange={e => setResponseText(e.target.value)}
                    className="w-full p-3 border border-blue-250 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-xs"
                  />
                  <button type="submit" disabled={submitting || !responseText.trim()} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition disabled:opacity-40 shadow-sm shadow-blue-600/10">
                    <Send className="h-3.5 w-3.5" /> Submit Response Information
                  </button>
                </form>
              </div>
            )}

            {activeComplaint.resolutionRemarks && (
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Final Resolution Remarks
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed font-semibold">
                  {activeComplaint.resolutionRemarks}
                </p>
                {activeComplaint.resolvedAt && (
                  <span className="text-[9px] text-slate-400 block font-bold">
                    Resolved Date: {new Date(activeComplaint.resolvedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {activeComplaint.status !== 'REQUEST_MORE_INFORMATION' && !activeComplaint.resolutionRemarks && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-2.5 text-slate-550 text-xs font-semibold">
                <Clock className="h-4 w-4 text-amber-500 shrink-0 animate-pulse" />
                This dispute is currently being reviewed by our support team. Resolution remarks will appear here once the case is resolved.
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs font-bold py-16">
            Select a dispute ticket from the list to view status and comments.
          </div>
        )}
      </div>
    </div>
  );
};
