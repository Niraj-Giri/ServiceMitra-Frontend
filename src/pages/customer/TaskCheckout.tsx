import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { 
  ArrowLeft, Tag, ShieldCheck, 
  Loader2, Sparkles, AlertCircle
} from 'lucide-react';

interface TaskRequest {
  id: number;
  title: string;
  category: string;
  address: string;
  budgetMinNpr: number;
  budgetMaxNpr: number;
}

interface Quote {
  id: number;
  providerName: string;
  providerBusinessName: string;
  providerRating?: number | null;
  quotedPriceNpr: number;
  counterPriceNpr: number | null;
  message: string;
}

export const TaskCheckout: React.FC = () => {
  const { taskId, quoteId } = useParams<{ taskId: string; quoteId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<TaskRequest | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // User loyalty points balance
  const [userPoints, setUserPoints] = useState(0);
  const [pointsRedemptionRate, setPointsRedemptionRate] = useState(1);

  // Form states
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [redeemPoints, setRedeemPoints] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ESEWA' | 'KHALTI'>('COD');

  const [error, setError] = useState('');

  const fetchCheckoutData = async () => {
    setLoading(true);
    try {
      const [resTask, resPoints] = await Promise.all([
        apiClient.get(`/tasks/${taskId}`),
        apiClient.get('/loyalty/points')
      ]);

      const tData = resTask.data;
      setTask(tData);
      
      const qSelected = tData.quotes?.find((q: any) => q.id === Number(quoteId));
      if (!qSelected) {
        setError('Selected quote could not be found.');
      } else {
        setQuote(qSelected);
      }

      setUserPoints(resPoints.data.pointsBalance || 0);
      setPointsRedemptionRate(resPoints.data.pointsRedemptionRate || 1);

    } catch (err) {
      console.error(err);
      setError('Failed to fetch checkout details.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCheckoutData();
  }, [taskId, quoteId]);

  const bidAmount = quote ? (quote.counterPriceNpr ?? quote.quotedPriceNpr) : 0;

  // Coupon validation trigger
  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim() || !task) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const response = await apiClient.get('/coupons/validate', {
        params: {
          code: couponCodeInput.trim(),
          bidAmount: bidAmount,
          category: task.category
        }
      });
      setAppliedCouponCode(response.data.couponCode);
      setCouponDiscount(response.data.discountAmount);
      setCouponCodeInput('');
    } catch (err: any) {
      setCouponError(err.response?.data?.error?.message || 'Invalid coupon code.');
    }
    setValidatingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode('');
    setCouponDiscount(0);
    setCouponError('');
  };

  // Compute final price breakdowns
  const pointsDiscount = redeemPoints 
    ? Math.min(userPoints * pointsRedemptionRate, Math.max(bidAmount - couponDiscount, 0)) 
    : 0;

  const pointsRedeemed = redeemPoints 
    ? Math.round(pointsDiscount / pointsRedemptionRate) 
    : 0;

  const payableAmount = Math.max(bidAmount - couponDiscount - pointsDiscount, 0);
  const totalSavings = couponDiscount + pointsDiscount;

  const handleConfirmPay = async () => {
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post(`/tasks/${taskId}/quotes/${quoteId}/checkout`, {
        couponCode: appliedCouponCode || null,
        redeemPoints: redeemPoints,
        paymentMethod: paymentMethod
      });
      alert('Booking confirmed successfully!');
      navigate(`/task/${taskId}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Checkout failed.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !task || !quote) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
          <AlertCircle className="h-10 w-10 mx-auto text-red-500 mb-2" />
          <p>{error || 'An error occurred during checkout initialization.'}</p>
          <button onClick={() => navigate(-1)} className="mt-4 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-5 rounded-xl transition text-xs">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6 animate-fade-in text-xs text-slate-700 font-semibold">
      
      {/* Back to Quote Details */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-850 font-bold transition">
        <ArrowLeft className="h-4 w-4" /> Cancel Checkout
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Summary & Payment details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Selected Bid details card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-slate-900 font-black text-sm uppercase tracking-wider">Review Selected Bid</h2>
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] text-blue-600 font-extrabold uppercase">{task.category}</p>
                <h3 className="font-extrabold text-slate-800 text-sm mt-0.5">{task.title}</h3>
                <span className="text-slate-405 block mt-1">Location: {task.address}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">Accepted Bid</span>
                <span className="font-black text-slate-900 text-lg">Rs. {bidAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Provider Info details */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-700 text-xs">
                {(quote.providerName || 'P').charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-slate-800 text-xs block">{quote.providerBusinessName || quote.providerName}</span>
                <span className="text-amber-500 font-bold text-[10px]">★ {(quote.providerRating ?? 5.0).toFixed(1)} Professional Rating</span>
              </div>
            </div>
          </div>

          {/* Applied Coupons & Promos */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-slate-900 font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-4.5 w-4.5 text-blue-600" /> Apply Discount Coupon
            </h2>

            {appliedCouponCode ? (
              <div className="bg-emerald-50/50 border border-emerald-250 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                    {appliedCouponCode}
                  </span>
                  <span className="text-[11px] text-emerald-700 ml-2 font-bold">Applied: Rs. {couponDiscount} saved!</span>
                </div>
                <button 
                  onClick={handleRemoveCoupon}
                  className="text-xs text-rose-605 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code (e.g. SUMMER25)"
                    value={couponCodeInput}
                    onChange={e => setCouponCodeInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 border border-slate-250 bg-slate-50/50 rounded-xl uppercase font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    {validatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-rose-600 font-bold text-[10px] pl-1">{couponError}</p>
                )}
              </div>
            )}
          </div>

          {/* Loyalty reward points checkbox */}
          {userPoints > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Redeem Mitra Reward Points</span>
                  <span className="text-[10px] text-slate-450 mt-0.5 block">You have {userPoints} points available. (Worth Rs. {userPoints * pointsRedemptionRate})</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={redeemPoints}
                onChange={e => setRedeemPoints(e.target.checked)}
                className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 h-5 w-5 cursor-pointer"
              />
            </div>
          )}

          {/* Payment Methods */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-slate-900 font-black text-sm uppercase tracking-wider">Select Payment Method</h2>
            
            <div className="grid grid-cols-3 gap-3">
              {(['COD', 'ESEWA', 'KHALTI'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 font-bold transition-all ${
                    paymentMethod === method 
                      ? 'border-blue-500 bg-blue-50/20 text-blue-600 shadow-xs' 
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-sm block">{method === 'COD' ? 'Cash / COD' : method === 'ESEWA' ? 'eSewa Pay' : 'Khalti Pay'}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Price Breakup & Final Checkout Pay Trigger */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-6">
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider border-b border-slate-800 pb-3">Billing Invoice</h3>
            
            <div className="space-y-3.5 text-[11px]">
              <div className="flex justify-between">
                <span>Agreed Quote Price</span>
                <span className="font-bold text-white">Rs. {bidAmount.toLocaleString()}</span>
              </div>
              
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Coupon Promo Discount</span>
                  <span>- Rs. {couponDiscount.toLocaleString()}</span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>Points Redeemed ({pointsRedeemed} pts)</span>
                  <span>- Rs. {pointsDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline text-white">
                <span className="font-bold text-xs">Total Payable Amount</span>
                <span className="font-black text-xl text-blue-400">Rs. {payableAmount.toLocaleString()}</span>
              </div>
            </div>

            {totalSavings > 0 && (
              <div className="bg-blue-950/40 rounded-xl p-3 border border-blue-900/30 text-blue-400 text-[10px] font-bold flex justify-between items-center">
                <span>🎉 Total Promo Savings</span>
                <span>Rs. {totalSavings} NPR Saved</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleConfirmPay}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-blue-900/30 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4.5 w-4.5" />}
                Confirm & Pay Rs. {payableAmount.toLocaleString()}
              </button>

              <p className="text-[10px] text-slate-500 text-center leading-relaxed font-semibold">
                By finalizing this checkout, you agree to our platform cancellation guidelines. Professional payouts are escrow-secured.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
