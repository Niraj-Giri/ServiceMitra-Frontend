import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Settings, Save, Percent, Phone, Compass, Clock, 
  Award, Sparkles
} from 'lucide-react';

interface PlatformSettings {
  id: number;
  platformName: string;
  commissionPercentage: number;
  supportNumber: string;
  bookingRadius: number;
  workingHours: string;
  cancellationPolicy: string | null;
  paymentGateway: string;
  pointsPerNprSpent: number;
  pointsRedemptionRate: number;
  firstBookingPointsBonus: number;
  referralPointsBonus: number;
}

interface SettingsTabProps {
  onRefreshStats: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onRefreshStats }) => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [platformName, setPlatformName] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [supportNumber, setSupportNumber] = useState('');
  const [bookingRadius, setBookingRadius] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [paymentGateway, setPaymentGateway] = useState('COD');
  
  // Loyalty configurations
  const [pointsPerNprSpent, setPointsPerNprSpent] = useState('');
  const [pointsRedemptionRate, setPointsRedemptionRate] = useState('');
  const [firstBookingPointsBonus, setFirstBookingPointsBonus] = useState('');
  const [referralPointsBonus, setReferralPointsBonus] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/settings');
      const s: PlatformSettings = response.data;
      setSettings(s);
      
      setPlatformName(s.platformName);
      setCommissionPercentage(String(s.commissionPercentage));
      setSupportNumber(s.supportNumber);
      setBookingRadius(String(s.bookingRadius));
      setWorkingHours(s.workingHours);
      setPaymentGateway(s.paymentGateway);
      
      setPointsPerNprSpent(String(s.pointsPerNprSpent ?? 0.05));
      setPointsRedemptionRate(String(s.pointsRedemptionRate ?? 1));
      setFirstBookingPointsBonus(String(s.firstBookingPointsBonus ?? 100));
      setReferralPointsBonus(String(s.referralPointsBonus ?? 50));
    } catch (err) {
      console.error('Failed to load global settings', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    const payload = {
      platformName,
      commissionPercentage: parseFloat(commissionPercentage),
      supportNumber,
      bookingRadius: parseFloat(bookingRadius),
      workingHours,
      paymentGateway,
      pointsPerNprSpent: parseFloat(pointsPerNprSpent),
      pointsRedemptionRate: parseFloat(pointsRedemptionRate),
      firstBookingPointsBonus: parseInt(firstBookingPointsBonus),
      referralPointsBonus: parseInt(referralPointsBonus)
    };

    try {
      await apiClient.put('/admin/settings', payload);
      alert('Global configurations updated successfully');
      fetchSettings();
      onRefreshStats();
    } catch (err) {
      alert('Failed to update configurations');
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in text-xs text-slate-700 font-semibold">
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading global configurations...</div>
      ) : (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
          
          {/* Platform Settings Block */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Global Platform Configuration</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Configure basic portal rules and matching algorithm metrics.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1">Platform Brand Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={platformName}
                    onChange={e => setPlatformName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Base Platform Commission (%)</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={commissionPercentage}
                    onChange={e => setCommissionPercentage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl focus:outline-none focus:border-blue-500 pr-8"
                  />
                  <Percent className="h-4 w-4 text-slate-400 absolute right-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1">Support Contact Phone Number</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={supportNumber}
                    onChange={e => setSupportNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl focus:outline-none focus:border-blue-500 pr-8"
                  />
                  <Phone className="h-4 w-4 text-slate-400 absolute right-3" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Geofence Matching Radius (Km)</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={bookingRadius}
                    onChange={e => setBookingRadius(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl focus:outline-none focus:border-blue-500 pr-8"
                  />
                  <Compass className="h-4 w-4 text-slate-400 absolute right-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1">Platform Operating Hours</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={workingHours}
                    onChange={e => setWorkingHours(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl focus:outline-none focus:border-blue-500 pr-8"
                  />
                  <Clock className="h-4 w-4 text-slate-400 absolute right-3" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Default Payment Gateway Mode</label>
                <div className="relative flex items-center">
                  <select
                    value={paymentGateway}
                    onChange={e => setPaymentGateway(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="ESEWA">eSewa Payments Gateway</option>
                    <option value="KHALTI">Khalti Payments Gateway</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Configurations Block */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-indigo-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Loyalty Points & Rewards Policy</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Configure customer welcome bonuses, referral perks, and coin redemption rates.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1">Welcome Registration Reward (pts)</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    required
                    value={firstBookingPointsBonus}
                    onChange={e => setFirstBookingPointsBonus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl focus:outline-none focus:border-blue-500 pr-8 font-mono font-bold"
                  />
                  <Sparkles className="h-4 w-4 text-slate-400 absolute right-3" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Referral Invitation Bonus (pts)</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    required
                    value={referralPointsBonus}
                    onChange={e => setReferralPointsBonus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl focus:outline-none focus:border-blue-500 pr-8 font-mono font-bold"
                  />
                  <Award className="h-4 w-4 text-slate-400 absolute right-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1">Points Accumulation Ratio (pts per NPR spent)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    step="0.001"
                    value={pointsPerNprSpent}
                    onChange={e => setPointsPerNprSpent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Redemption Discount Rate (NPR value per 1 pt)</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={pointsRedemptionRate}
                    onChange={e => setPointsRedemptionRate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl focus:outline-none focus:border-blue-500 pr-8 font-mono font-bold"
                  />
                  <span className="text-slate-400 absolute right-3 font-bold text-[10px]">NPR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer Save Action */}
          <div className="p-6 bg-slate-50/50 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="h-4 w-4" /> Save Configuration Settings
            </button>
          </div>

        </form>
      )}
    </div>
  );
};
