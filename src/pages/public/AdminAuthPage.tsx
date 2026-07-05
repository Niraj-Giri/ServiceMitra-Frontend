import React, { useState } from 'react';
import { sendOtp, verifyOtp } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, KeyRound, LockKeyhole, Phone, Radar, ShieldCheck } from 'lucide-react';

export const AdminAuthPage: React.FC = () => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await sendOtp(phone);
      setStep('OTP');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      // Pass 'ADMIN' role to auto-create admin if they don't exist
      const res = await verifyOtp(phone, otp, 'ADMIN');
      if (res.user.role !== 'ADMIN') {
        setError(`This phone number is registered as a ${res.user.role}. Please use a different number to register as an Admin.`);
        setLoading(false);
        return;
      }
      await fetchUser();
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/12">
      <div className="relative overflow-hidden bg-slate-950 px-7 py-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(14,165,233,0.5),transparent_18rem),linear-gradient(135deg,rgba(15,23,42,1),rgba(2,6,23,0.84))]" />
        <div className="relative">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
            <Radar className="h-6 w-6 text-blue-100" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">Admin access</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Platform control</h2>
          <p className="mt-3 text-sm leading-6 text-blue-50/75">Secure OTP login for managing providers, users, payouts, and service operations.</p>
        </div>
      </div>

      <div className="space-y-5 p-7">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <ShieldCheck className="mb-2 h-5 w-5 text-blue-600" />
            <div className="text-xs font-black text-slate-700">Role protected</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <LockKeyhole className="mb-2 h-5 w-5 text-blue-600" />
            <div className="text-xs font-black text-slate-700">OTP secured</div>
          </div>
        </div>
  
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-800">Admin phone number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                  className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pl-12 text-base font-bold text-slate-900 placeholder:text-slate-400"
                  placeholder="9990000000"
                />
              </div>
            </div>
            <Button type="submit" className="w-full py-4" isLoading={loading}>Send admin OTP</Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-800">Enter OTP</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" required maxLength={4} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pl-12 text-center text-2xl font-black tracking-[0.45em] text-slate-950"
                  placeholder="1234"
                />
              </div>
            </div>
            <Button type="submit" className="w-full py-4" isLoading={loading}>Enter admin dashboard</Button>
            <button 
              type="button" 
              onClick={() => setStep('PHONE')}
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
