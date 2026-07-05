import React, { useState } from 'react';
import { sendOtp, verifyOtp, providerRegister } from '../../api/auth';
import { uploadFile } from '../../api/files';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Camera, FileBadge, LockKeyhole, MapPin, Phone, ShieldCheck, Sparkles, UserRound } from 'lucide-react';

export const ProviderAuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Login State
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');

  // Register State
  const [regStep, setRegStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [regData, setRegData] = useState({
    name: '',
    phone: '',
    email: '',
    serviceCategory: 'Mechanic',
    fullAddress: '',
  });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [citizenshipFile, setCitizenshipFile] = useState<File | null>(null);
  const [regOtp, setRegOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  // --- LOGIN HANDLERS ---
  const handleLoginSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await sendOtp(loginPhone);
      setLoginStep('OTP');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await verifyOtp(loginPhone, loginOtp, 'PROVIDER');
      if (res.user.role !== 'PROVIDER') {
        setError(`This phone number is registered as a ${res.user.role}. Please use a different number to register as a Provider.`);
        setLoading(false);
        return;
      }
      await fetchUser();
      navigate('/provider/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // --- REGISTER HANDLERS ---
  const handleRegSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFile || !citizenshipFile) {
      setError('Please select both profile photo and citizenship card.');
      return;
    }
    setError(''); setLoading(true);
    try {
      await sendOtp(regData.phone);
      setRegStep('OTP');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      // 1. Upload files
      const profileUrl = await uploadFile(profileFile!);
      const citizenshipUrl = await uploadFile(citizenshipFile!);

      // 2. Register
      const payload = {
        ...regData,
        otp: regOtp,
        profilePhotoUrl: profileUrl,
        citizenshipCardUrl: citizenshipUrl,
      };

      await providerRegister(payload);
      
      // 3. Fetch user and redirect
      await fetchUser();
      navigate('/provider/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400";
  const iconInputClass = `${inputClass} pl-11`;

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/12 lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_15%,rgba(59,130,246,0.55),transparent_24rem),linear-gradient(135deg,rgba(15,23,42,1),rgba(30,64,175,0.78))]" />
        <div className="relative">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12">
            <BriefcaseBusiness className="h-7 w-7 text-blue-100" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">Mitra Partner</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Earn with trusted service jobs</h1>
          <p className="mt-4 text-sm leading-7 text-blue-50/78">Inspired by top service marketplaces: fast onboarding, verified identity, clear jobs, and professional profiles customers can trust.</p>
        </div>
        <div className="relative grid gap-3">
          {[
            [ShieldCheck, 'KYC verified profile'],
            [Sparkles, 'High-intent local jobs'],
            [LockKeyhole, 'Secure OTP access'],
          ].map(([Icon, label]) => {
            const IconComponent = Icon as typeof ShieldCheck;
            return (
              <div key={label as string} className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <IconComponent className="h-5 w-5 text-blue-100" />
                <span className="text-sm font-bold text-blue-50">{label as string}</span>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="p-5 sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Professional portal</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {activeTab === 'LOGIN' ? 'Continue to your dashboard' : 'Create your professional profile'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {activeTab === 'LOGIN' ? 'Login with your registered phone number.' : 'Share your basic details and verification documents to start accepting jobs.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            className={`rounded-xl px-4 py-3 text-sm font-black transition ${activeTab === 'LOGIN' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => { setActiveTab('LOGIN'); setError(''); }}
          >
            Login
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-3 text-sm font-black transition ${activeTab === 'REGISTER' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => { setActiveTab('REGISTER'); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {activeTab === 'LOGIN' ? (
          loginStep === 'PHONE' ? (
            <form onSubmit={handleLoginSendOtp} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input type="tel" required value={loginPhone} onChange={e => setLoginPhone(e.target.value)} className={iconInputClass} placeholder="9800000000" />
                </div>
              </div>
              <Button type="submit" className="w-full py-4" isLoading={loading}>Send OTP</Button>
            </form>
          ) : (
            <form onSubmit={handleLoginVerifyOtp} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">Enter OTP</label>
                <input type="text" required maxLength={4} value={loginOtp} onChange={e => setLoginOtp(e.target.value.replace(/\D/g, ''))} className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-black tracking-[0.45em] text-slate-950" placeholder="1234" />
              </div>
              <Button type="submit" className="w-full py-4" isLoading={loading}>Login to dashboard</Button>
              <button type="button" onClick={() => setLoginStep('PHONE')} className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-slate-500 hover:text-slate-800">
                <ArrowLeft className="h-4 w-4" /> Change phone number
              </button>
            </form>
          )
        ) : regStep === 'DETAILS' ? (
          <form onSubmit={handleRegSendOtp} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">Full name</label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className={iconInputClass} placeholder="Your name" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input type="tel" required value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} className={iconInputClass} placeholder="9800000000" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">Email</label>
                <input type="email" required value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className={inputClass} placeholder="name@example.com" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">Service category</label>
                <select required value={regData.serviceCategory} onChange={e => setRegData({...regData, serviceCategory: e.target.value})} className={inputClass}>
                  <option value="" disabled>Select a category</option>
                  <option value="ELECTRICIAN">Electrician</option>
                  <option value="PLUMBER">Plumber</option>
                  <option value="AC_TECHNICIAN">AC Technician</option>
                  <option value="AUTO_MECHANIC">Auto Mechanic</option>
                  <option value="PAINTER">Painter</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-black text-slate-800">Full address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                <textarea required value={regData.fullAddress} onChange={e => setRegData({...regData, fullAddress: e.target.value})} className={`${iconInputClass} min-h-24 resize-none`} placeholder="Street, city, area" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="service-card cursor-pointer rounded-2xl p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Camera className="h-5 w-5" /></div>
                <div className="font-black text-slate-900">Profile photo</div>
                <div className="mt-1 truncate text-xs font-semibold text-slate-500">{profileFile?.name || 'Upload clear face photo'}</div>
                <input type="file" accept="image/*" required onChange={e => setProfileFile(e.target.files?.[0] || null)} className="sr-only" />
              </label>
              <label className="service-card cursor-pointer rounded-2xl p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileBadge className="h-5 w-5" /></div>
                <div className="font-black text-slate-900">Citizenship card</div>
                <div className="mt-1 truncate text-xs font-semibold text-slate-500">{citizenshipFile?.name || 'Upload verification image'}</div>
                <input type="file" accept="image/*" required onChange={e => setCitizenshipFile(e.target.files?.[0] || null)} className="sr-only" />
              </label>
            </div>
            <Button type="submit" className="w-full py-4" isLoading={loading}>Send OTP and continue</Button>
          </form>
        ) : (
          <form onSubmit={handleRegVerifySubmit} className="space-y-5">
            <div className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">
              <BadgeCheck className="mb-2 h-5 w-5" />
              Final step: enter the OTP sent to {regData.phone} to submit your professional profile.
            </div>
            <input type="text" required maxLength={4} value={regOtp} onChange={e => setRegOtp(e.target.value.replace(/\D/g, ''))} className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-black tracking-[0.45em] text-slate-950" placeholder="1234" />
            <Button type="submit" className="w-full py-4" isLoading={loading}>Submit registration</Button>
            <button type="button" onClick={() => setRegStep('DETAILS')} className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" /> Back to details
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
