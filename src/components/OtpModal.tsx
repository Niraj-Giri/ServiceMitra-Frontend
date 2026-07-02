import React, { useState } from 'react';
import { ArrowRight, Phone, ShieldCheck, X, User, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export const OtpModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
  // step 1: phone only
  // step 2: name and email (if not registered)
  // step 3: verify OTP
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleCheckUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/check-user', { phone });
      if (response.data.registered) {
        // Send OTP directly
        await apiClient.post('/auth/send-otp', { phone });
        setStep(3); // skip registration details
      } else {
        // User not registered, ask for details
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to check user status.");
    }
    setLoading(false);
  };

  const handleRegisterAndSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Check if email already exists
      const emailCheck = await apiClient.post('/auth/check-email', { email });
      if (emailCheck.data.registered) {
        setError("Email is already registered. Please use another email.");
        setLoading(false);
        return;
      }

      await apiClient.post('/auth/send-otp', { phone });
      setStep(3);
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP.");
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const otpString = otp.join('');
      const payload: any = { phone, otp: otpString };
      // Only include name and email if we gathered them (new registration)
      if (name) payload.name = name;
      if (email) payload.email = email;
      
      const response = await apiClient.post('/auth/verify-otp', payload);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      login(token, { id: user.id, email: user.email, role: user.role, fullName: user.fullName, phone: user.phone });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Invalid OTP or server error");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
        
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <Phone className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Login / Register</h2>
            <p className="text-slate-500 mb-8">Enter your mobile number to get started.</p>

            <form onSubmit={handleCheckUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mobile Number</label>
                <div className="relative flex">
                  <div className="flex-shrink-0 bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl px-4 py-3.5 flex items-center justify-center font-bold text-slate-600">
                    +91
                  </div>
                  <input required type="tel" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 min-w-0 pl-4 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-r-xl focus:bg-white focus:border-blue-500 outline-none transition-colors font-bold text-slate-800 tracking-wider" placeholder="98765 43210" autoFocus />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-6 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex justify-center items-center">
                {loading ? 'Checking...' : 'Continue'} <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Create Account</h2>
            <p className="text-slate-500 mb-8">Looks like you're new! Please provide your details.</p>

            <form onSubmit={handleRegisterAndSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input required type="text" value={name} onChange={(e)=>setName(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors font-medium text-slate-800" placeholder="John Doe" autoFocus />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors font-medium text-slate-800" placeholder="john@example.com" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-6 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex justify-center items-center">
                {loading ? 'Sending OTP...' : 'Register & Send OTP'} <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </form>
            <p className="text-center text-sm text-slate-500 mt-6 font-medium cursor-pointer hover:text-blue-600" onClick={() => setStep(1)}>
              Back
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Verify OTP</h2>
            <p className="text-slate-500 mb-8">We've sent a secure code to <strong>+91 {phone}</strong>.</p>

            <form onSubmit={handleVerify}>
              <div className="flex gap-4 justify-between mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={otp[i]}
                    onChange={(e) => {
                      const newOtp = [...otp];
                      newOtp[i] = e.target.value;
                      setOtp(newOtp);
                      if (e.target.value && i < 3) document.getElementById(`otp-${i + 1}`)?.focus();
                    }}
                    className="w-16 h-16 text-center text-2xl font-black bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-colors"
                  />
                ))}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-xl">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>
            <p className="text-center text-sm text-slate-500 mt-6 font-medium cursor-pointer hover:text-blue-600" onClick={() => setStep(1)}>
              Change Mobile Number
            </p>
          </>
        )}
      </div>
    </div>
  );
};
