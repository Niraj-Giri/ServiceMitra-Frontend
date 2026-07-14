import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ProviderDisputesProps {
  complaints: any[];
  activeComplaint: any | null;
  complaintMessages: any[];
  replyMessage: string;
  sendingReply: boolean;
  onSelectComplaint: (complaint: any) => void;
  onSendReply: (e: React.FormEvent) => void;
  onSetReplyMessage: (msg: string) => void;
}

export const ProviderDisputes: React.FC<ProviderDisputesProps> = ({
  complaints,
  activeComplaint,
  complaintMessages,
  replyMessage,
  sendingReply,
  onSelectComplaint,
  onSendReply,
  onSetReplyMessage,
}) => {
  if (complaints.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-4">Disputes & Complaints</h3>
        <div className="text-center py-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="text-gray-500 text-sm italic">No disputes or complaints are logged against you.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-4">Disputes & Complaints</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List */}
        <div className="lg:col-span-1 space-y-3">
          {complaints.map((c) => (
            <div 
              key={c.id} 
              onClick={() => onSelectComplaint(c)}
              className={`p-4 border rounded-2xl cursor-pointer transition ${
                activeComplaint?.id === c.id ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-rose-600">Dispute #{c.id}</span>
                <span className={`px-2 py-0.5 rounded font-extrabold ${
                  c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>{c.status}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm truncate">{c.subject}</h4>
              <p className="text-xs text-slate-500 truncate mt-1">{c.description}</p>
            </div>
          ))}
        </div>

        {/* Right Column: Messages Thread */}
        <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between h-[450px]">
          {activeComplaint ? (
            <div className="flex flex-col h-full justify-between overflow-hidden">
              <div className="overflow-hidden flex flex-col flex-1">
                <div className="border-b border-slate-200 pb-3 mb-4 shrink-0">
                  <h4 className="font-extrabold text-slate-950 text-base">{activeComplaint.subject}</h4>
                  <p className="text-xs text-slate-500 mt-1">{activeComplaint.description}</p>
                </div>
                <div className="space-y-3 overflow-y-auto flex-1 pr-2 pb-4">
                  {complaintMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'PROVIDER' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-2.5 rounded-2xl max-w-xs text-xs ${
                        msg.senderRole === 'PROVIDER' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
                      }`}>
                        <p>{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1">{msg.senderRole} • Just now</span>
                    </div>
                  ))}
                </div>
              </div>
              <form onSubmit={onSendReply} className="flex gap-2 border-t border-slate-200 pt-3 mt-4 shrink-0">
                <input 
                  type="text" 
                  placeholder="Type a message to discuss with Admin..."
                  value={replyMessage}
                  onChange={(e) => onSetReplyMessage(e.target.value)}
                  className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 py-1.5 px-4 text-xs text-white font-bold rounded-xl transition">
                  {sendingReply ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs">
              Select a dispute ticket from the list to view logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
