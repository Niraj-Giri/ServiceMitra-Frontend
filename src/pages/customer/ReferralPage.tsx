import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';
import { CustomerLoyalty } from '../../components/customer/CustomerLoyalty';
import { Loader2 } from 'lucide-react';

export const ReferralPage: React.FC = () => {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<{ pointsBalance: number; history: any[] }>({ pointsBalance: 0, history: [] });
  const [loading, setLoading] = useState(true);

  const fetchLoyaltyData = async () => {
    try {
      const response = await apiClient.get('/loyalty/points');
      setLoyaltyData(response.data || response || { pointsBalance: 0, history: [] });
    } catch (err) {
      console.error('Failed to fetch loyalty data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="bg-white border border-slate-205/85 rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold text-slate-950">Referrals & Rewards</h1>
        <p className="text-slate-500 text-xs mt-1">Earn reward points on successful orders and referrals, and redeem them during booking checkouts.</p>
      </div>

      <CustomerLoyalty 
        loyaltyData={loyaltyData}
        userPhone={user?.phone}
        fetchLoyaltyData={fetchLoyaltyData}
      />
    </div>
  );
};
