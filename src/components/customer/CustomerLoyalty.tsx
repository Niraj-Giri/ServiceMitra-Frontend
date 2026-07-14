import React, { useState } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { apiClient } from '../../api/client';

interface LoyaltyData {
  pointsBalance: number;
  history: any[];
}

interface CustomerLoyaltyProps {
  loyaltyData: LoyaltyData;
  userPhone?: string;
  fetchLoyaltyData: () => Promise<void>;
}

export const CustomerLoyalty: React.FC<CustomerLoyaltyProps> = ({
  loyaltyData,
  userPhone,
  fetchLoyaltyData,
}) => {
  const [referrerPhone, setReferrerPhone] = useState('');
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!userPhone) return;
    navigator.clipboard.writeText(userPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referrerPhone.trim()) return;
    setApplyingReferral(true);
    setReferralError(null);
    setReferralSuccess(null);
    try {
      await apiClient.post('/loyalty/referral', {
        referrerPhone: referrerPhone.trim()
      });
      setReferralSuccess('Referral bonus claimed successfully!');
      setReferrerPhone('');
      fetchLoyaltyData(); // reload points balance
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error?.message || err.message;
      setReferralError(serverMessage || 'Failed to claim referral bonus. Make sure the phone number is correct.');
    } finally {
      setApplyingReferral(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Row: Balance and Share cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Box */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <Gift className="h-48 w-48" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-100 block mb-1">Total Reward Points</span>
            <span className="text-5xl font-black font-mono">{loyaltyData.pointsBalance}</span>
            <p className="text-[11px] text-blue-100/80 mt-2 font-medium">
              Equivalent to <span className="font-bold">Rs. {loyaltyData.pointsBalance}</span> checkout discount!
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
            <span className="text-blue-100 font-medium">Points validity: Lifetime</span>
            <span className="bg-white/20 px-3 py-1 rounded-full font-extrabold uppercase text-[9px] tracking-wider">Level 1 Member</span>
          </div>
        </div>

        {/* Share and Claim Referrals */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1">Referral Program</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Share your phone number with your friends. When they register using it, you both get <span className="font-bold text-blue-600">30 reward points</span>!
            </p>
            
            {/* Share code */}
            <div className="mt-4 flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Referral Code</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{userPhone}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition text-slate-500 hover:text-blue-600 shadow-sm"
                title="Copy code"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600 animate-scale-in" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Claim referral input */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <form onSubmit={handleApplyReferral} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Enter Referrer's Phone Number</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={referrerPhone}
                    onChange={(e) => setReferrerPhone(e.target.value)}
                    placeholder="e.g. 98XXXXXXXX"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white font-mono"
                  />
                  <button
                    type="submit"
                    disabled={applyingReferral || !referrerPhone.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    {applyingReferral ? 'Claiming...' : 'Claim Bonus'}
                  </button>
                </div>
              </div>
              {referralSuccess && <p className="text-[11px] font-bold text-emerald-600 animate-fadeIn">{referralSuccess}</p>}
              {referralError && <p className="text-[11px] font-bold text-rose-600 animate-fadeIn">{referralError}</p>}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Section: Points History ledger */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-base mb-4">Points Transaction History</h3>
        
        {!loyaltyData.history || loyaltyData.history.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs italic">
            No points transactions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {loyaltyData.history.map((item: any) => {
              const isCredit = item.points > 0;
              return (
                <div key={item.id} className="py-3.5 flex justify-between items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-800 block text-sm">
                      {item.description}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium font-mono">
                      {new Date(item.createdAt).toLocaleString()} | Action: {item.actionType}
                    </span>
                  </div>
                  <span className={`font-extrabold text-sm font-mono shrink-0 ${
                    isCredit ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {isCredit ? '+' : ''}{item.points} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
