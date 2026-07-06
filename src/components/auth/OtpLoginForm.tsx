import React, { useState } from 'react';
import { sendOtp, verifyOtp, signupUser } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { ArrowLeft, BadgeCheck, LockKeyhole, Phone, ShieldCheck, Sparkles, UserRound } from 'lucide-react';

export const OtpLoginForm: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { fetchUser } = useAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
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
    setError('');
    setLoading(true);
    try {
      await verifyOtp(phone, otp);
      await fetchUser();
      // Router will naturally redirect since user is now authenticated
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signupUser({
        name,
        phone,
        email,
        role: 'CUSTOMER'
      });
      await fetchUser();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Check if phone is already registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/12">
      <div className="relative overflow-hidden bg-slate-950 px-7 py-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.55),transparent_18rem),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.72))]" />
        <div className="relative">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
            <ShieldCheck className="h-6 w-6 text-blue-100" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">Customer access</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
            {activeTab === 'LOGIN' ? 'Welcome back' : 'Create Account'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-blue-50/78">
            {activeTab === 'LOGIN' 
              ? 'Book trusted professionals and track your home service visits securely.' 
              : 'Sign up to start booking trusted local service professionals.'}
          </p>
        </div>
      </div>
      
      <div className="space-y-5 p-7">
        <div className="grid grid-cols-3 gap-2">
          {[
            [BadgeCheck, 'Verified'],
            [Sparkles, 'Fast'],
            [LockKeyhole, 'Secure'],
          ].map(([Icon, label]) => {
            const IconComponent = Icon as typeof BadgeCheck;
            return (
              <div key={label as string} className="rounded-2xl bg-slate-50 p-3 text-center">
                <IconComponent className="mx-auto mb-1 h-4 w-4 text-blue-600" />
                <div className="text-[11px] font-extrabold text-slate-600">{label as string}</div>
              </div>
            );
          })}
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === 'LOGIN' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => { setActiveTab('LOGIN'); setError(''); }}
          >
            Login
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === 'REGISTER' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => { setActiveTab('REGISTER'); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {activeTab === 'LOGIN' ? (
          step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-extrabold text-slate-800">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9800000000"
                    className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pl-12 text-base font-bold text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full py-4" isLoading={loading}>
                Send secure OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-extrabold text-slate-800">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  maxLength={4}
                  className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-black tracking-[0.45em] text-slate-950 placeholder:text-slate-300"
                  required
                />
                <p className="mt-2 text-center text-xs font-semibold text-slate-500">OTP sent to {phone}</p>
              </div>
              <Button type="submit" className="w-full py-4" isLoading={loading}>
                Verify and continue
              </Button>
              <button 
                type="button" 
                onClick={() => setStep('PHONE')}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Change phone number
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-extrabold text-slate-800">Full Name</label>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pl-12 text-base font-bold text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-extrabold text-slate-800">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9800000000"
                  className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pl-12 text-base font-bold text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-extrabold text-slate-800">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-bold text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>

            <Button type="submit" className="w-full py-4" isLoading={loading}>
              Register and continue
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
