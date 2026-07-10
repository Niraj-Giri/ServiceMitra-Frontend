import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTaskById, acceptQuote, counterOffer, cancelTask
} from '../../api/tasks';
import type { TaskRequest, Quote, TaskStatus, QuoteStatus } from '../../types';
import {
  ArrowLeft, MapPin, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, Star, Briefcase, MessageSquare, ChevronDown, ChevronUp,
  DollarSign, Send, RefreshCw, Shield, Zap
} from 'lucide-react';
import { ChatBox } from '../../components/chat/ChatBox';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; dot: string }> = {
  OPEN:      { label: 'Open', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  QUOTING:   { label: 'Quotes Received', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  ACCEPTED:  { label: 'Provider Accepted', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
  STARTED:   { label: 'In Progress', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  COMPLETED: { label: 'Completed', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-500' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  EXPIRED:   { label: 'Expired', color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' },
};

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string }> = {
  PENDING:        { label: 'Awaiting your response', color: 'text-blue-600' },
  COUNTER_OFFERED:{ label: 'Counter-offer sent', color: 'text-amber-600' },
  ACCEPTED:       { label: 'Accepted', color: 'text-emerald-600' },
  REJECTED:       { label: 'Rejected', color: 'text-red-500' },
  WITHDRAWN:      { label: 'Withdrawn by provider', color: 'text-slate-400' },
  EXPIRED:        { label: 'Expired', color: 'text-slate-400' },
};

export const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<TaskRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Counter-offer modal state
  const [counterQuoteId, setCounterQuoteId] = useState<number | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [expandedQuote, setExpandedQuote] = useState<number | null>(null);

  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    try {
      const t = await getTaskById(Number(taskId));
      setTask(t);
    } catch {
      setError('Could not load task details.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  const handleAccept = async (quoteId: number) => {
    if (!task) return;
    setActionLoading(`accept-${quoteId}`);
    setError(null);
    try {
      const updated = await acceptQuote(task.id, quoteId);
      setTask(updated);
    } catch (e: unknown) {
      const axErr = e as { response?: { data?: { message?: string } } };
      setError(axErr?.response?.data?.message ?? 'Failed to accept quote.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCounterSubmit = async () => {
    if (!task || !counterQuoteId) return;
    const price = parseFloat(counterPrice);
    if (isNaN(price) || price <= 0) { setError('Enter a valid counter price.'); return; }
    setActionLoading(`counter-${counterQuoteId}`);
    setError(null);
    try {
      await counterOffer(task.id, counterQuoteId, price);
      setCounterQuoteId(null);
      setCounterPrice('');
      await fetchTask();
    } catch (e: unknown) {
      const axErr = e as { response?: { data?: { message?: string } } };
      setError(axErr?.response?.data?.message ?? 'Failed to send counter-offer.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!task) return;
    setActionLoading('cancel');
    setError(null);
    try {
      const updated = await cancelTask(task.id, cancelReason);
      setTask(updated);
      setShowCancel(false);
    } catch (e: unknown) {
      const axErr = e as { response?: { data?: { message?: string } } };
      setError(axErr?.response?.data?.message ?? 'Failed to cancel task.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );

  if (!task) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="glass-panel rounded-2xl p-12 text-center text-slate-500">Task not found.</div>
    </div>
  );

  const statusCfg = STATUS_CONFIG[task.status];
  const acceptedQuote = task.quotes.find(q => q.id === task.acceptedQuoteId);
  const activeQuotes = task.quotes.filter(q => q.status === 'PENDING' || q.status === 'COUNTER_OFFERED');
  const otherQuotes = task.quotes.filter(q => q.status !== 'PENDING' && q.status !== 'COUNTER_OFFERED');
  const canCancel = task.status === 'OPEN' || task.status === 'QUOTING';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/customer/dashboard')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft className="h-4 w-4" /> My Tasks
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Task header card */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">{task.category}</p>
            <h1 className="text-2xl font-extrabold text-slate-900">{task.title}</h1>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusCfg.bg} ${statusCfg.color}`}>
            <span className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InfoChip icon={DollarSign} label="Budget" value={`Rs. ${task.budgetMinNpr.toLocaleString()} – ${task.budgetMaxNpr.toLocaleString()}`} />
          <InfoChip icon={MapPin} label="Location" value={task.address} />
          {task.preferredDate && <InfoChip icon={Calendar} label="Preferred Date" value={task.preferredDate} />}
        </div>

        {/* Cancel task */}
        {canCancel && !showCancel && (
          <button onClick={() => setShowCancel(true)} className="text-xs text-red-500 hover:text-red-700 font-semibold transition underline-offset-2 hover:underline">
            Cancel this task
          </button>
        )}
        {showCancel && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
            <p className="text-sm font-bold text-red-700">Are you sure you want to cancel this task?</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              rows={2}
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:border-red-400"
            />
            <div className="flex gap-2">
              <button onClick={handleCancel} disabled={actionLoading === 'cancel'}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition disabled:opacity-60">
                {actionLoading === 'cancel' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Yes, Cancel
              </button>
              <button onClick={() => setShowCancel(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
                Keep Task
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Accepted provider card */}
      {(task.status === 'ACCEPTED' || task.status === 'STARTED' || task.status === 'COMPLETED') && acceptedQuote && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            {task.status === 'COMPLETED' ? 'Completed by' : 'Assigned Provider'}
          </h2>
          <QuoteCard
            quote={acceptedQuote}
            taskStatus={task.status}
            onAccept={undefined}
            onCounter={undefined}
            isExpanded
          />
          {task.status === 'COMPLETED' && (
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Final Amount</span><span className="font-bold">Rs. {task.finalAmountNpr?.toLocaleString()}</span></div>
              {task.platformFee && <div className="flex justify-between"><span className="text-slate-500">Platform Fee (10%)</span><span className="font-bold">Rs. {task.platformFee.toLocaleString()}</span></div>}
              {task.pointsRedeemed && task.pointsRedeemed > 0 && (
                <div className="flex justify-between"><span className="text-slate-500">Points Discount</span><span className="font-bold text-amber-600">- Rs. {task.pointsDiscountNpr}</span></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active quotes */}
      {activeQuotes.length > 0 && (task.status === 'OPEN' || task.status === 'QUOTING') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Quotes ({activeQuotes.length})
            </h2>
            <button onClick={fetchTask} className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:text-blue-800 transition">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
          {activeQuotes.map(quote => (
            <div key={quote.id}>
              <QuoteCard
                quote={quote}
                taskStatus={task.status}
                isExpanded={expandedQuote === quote.id}
                onToggle={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}
                onAccept={() => handleAccept(quote.id)}
                onCounter={() => { setCounterQuoteId(quote.id); setCounterPrice(''); setError(null); }}
                actionLoading={actionLoading}
              />
              {/* Counter-offer input for this quote */}
              {counterQuoteId === quote.id && (
                <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                  <p className="text-sm font-bold text-amber-800">Enter your counter-offer price</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rs.</span>
                      <input
                        autoFocus
                        type="number"
                        value={counterPrice}
                        onChange={e => setCounterPrice(e.target.value)}
                        placeholder={`Original: Rs. ${quote.quotedPriceNpr}`}
                        className="w-full rounded-lg border border-amber-300 bg-white pl-10 pr-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleCounterSubmit}
                      disabled={actionLoading === `counter-${quote.id}`}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition disabled:opacity-60"
                    >
                      {actionLoading === `counter-${quote.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Send
                    </button>
                    <button onClick={() => setCounterQuoteId(null)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Waiting state (OPEN, no quotes) */}
      {task.status === 'OPEN' && task.quotes.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500 mx-auto">
            <Clock className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">Waiting for quotes</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Nearby providers have been notified. You'll see their quotes here as they submit them.</p>
          <button onClick={fetchTask} className="flex items-center gap-1.5 mx-auto text-xs text-blue-600 font-bold hover:text-blue-800 transition">
            <RefreshCw className="h-3.5 w-3.5" /> Check for new quotes
          </button>
        </div>
      )}

      {/* Past/rejected quotes */}
      {otherQuotes.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition">
            <MessageSquare className="h-4 w-4" />
            {otherQuotes.length} other quote{otherQuotes.length > 1 ? 's' : ''} (rejected / withdrawn)
            <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-3 space-y-2">
            {otherQuotes.map(q => (
              <QuoteCard key={q.id} quote={q} taskStatus={task.status} onAccept={undefined} onCounter={undefined} isExpanded={false} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────────────────

const InfoChip: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
    <Icon className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-xs font-semibold text-slate-700 line-clamp-2">{value}</p>
    </div>
  </div>
);

interface QuoteCardProps {
  quote: Quote;
  taskStatus: TaskStatus;
  onAccept?: () => void;
  onCounter?: () => void;
  onToggle?: () => void;
  isExpanded: boolean;
  actionLoading?: string | null;
}

const QuoteCard: React.FC<QuoteCardProps> = ({
  quote, taskStatus, onAccept, onCounter, onToggle, isExpanded, actionLoading
}) => {
  const quoteCfg = QUOTE_STATUS_CONFIG[quote.status];
  const canAct = (taskStatus === 'OPEN' || taskStatus === 'QUOTING') && quote.status === 'PENDING';
  const isCounter = quote.status === 'COUNTER_OFFERED';

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      quote.status === 'ACCEPTED' ? 'border-emerald-200 bg-emerald-50/50' :
      quote.status === 'PENDING' ? 'border-blue-100 bg-white shadow-sm hover:shadow-md' :
      isCounter ? 'border-amber-200 bg-amber-50/30' :
      'border-slate-100 bg-slate-50 opacity-60'
    }`}>
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4"
      >
        {/* Avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-black text-sm">
          {(quote.providerName || 'P').charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-900 text-sm">{quote.providerBusinessName || quote.providerName}</span>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold text-slate-600">{(quote.providerRating ?? 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">{quote.providerTotalJobs ?? 0} jobs</span>
            </div>
          </div>
          <span className={`text-xs font-semibold ${quoteCfg.color}`}>{quoteCfg.label}</span>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          {isCounter && quote.counterPriceNpr ? (
            <>
              <div className="text-xs text-slate-400 line-through">Rs. {quote.quotedPriceNpr.toLocaleString()}</div>
              <div className="text-lg font-black text-amber-600">Rs. {quote.counterPriceNpr.toLocaleString()}</div>
              <div className="text-[10px] text-amber-500 font-bold">Counter-offer sent</div>
            </>
          ) : quote.status === 'ACCEPTED' && quote.finalPriceNpr ? (
            <div className="text-lg font-black text-emerald-600">Rs. {quote.finalPriceNpr.toLocaleString()}</div>
          ) : (
            <div className="text-lg font-black text-blue-600">Rs. {quote.quotedPriceNpr.toLocaleString()}</div>
          )}
        </div>

        {onToggle && (
          isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
          {quote.message && (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 italic">
              "{quote.message}"
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {quote.providerExperienceYears && (
              <span className="flex items-center gap-1 bg-blue-50 rounded-full px-2.5 py-1 font-semibold text-blue-700">
                {quote.providerExperienceYears} yrs experience
              </span>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 h-[350px] rounded-xl overflow-hidden">
            <ChatBox taskRequestId={quote.taskRequestId} />
          </div>

          {/* Action buttons */}
          {canAct && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={onAccept}
                disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 active:scale-95 transition shadow-sm shadow-blue-600/30 disabled:opacity-60"
              >
                {actionLoading === `accept-${quote.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Accept Rs. {quote.quotedPriceNpr.toLocaleString()}
              </button>
              <button
                onClick={onCounter}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 transition disabled:opacity-60"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Counter
              </button>
            </div>
          )}

          {isCounter && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 font-semibold">
              ⏳ Waiting for provider to respond to your counter-offer of Rs. {quote.counterPriceNpr?.toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
