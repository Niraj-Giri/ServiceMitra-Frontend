import React, { useState } from 'react';
import { ArrowRight, Briefcase, FileText, CheckCircle2, X, Upload } from 'lucide-react';

import { apiClient } from '../api/client';

export const ProviderPortal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    serviceCategory: 'AUTO_MECHANIC',
    address: '',
    panFile: null as File | null,
    citizenFile: null as File | null
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
       // In a real app we'd use FormData for multipart file uploads.
       // Since backend expects JSON right now in RegistrationController, we just send text.
       await apiClient.post('/providers/register', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          businessName: formData.businessName,
          serviceCategory: formData.serviceCategory,
          address: formData.address
       });
       setStep(3); // Success/Pending view
    } catch (err) {
       console.error(err);
       alert("Registration failed");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        {step === 1 && (
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <Briefcase className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Join ServiceMitra</h2>
            <p className="text-slate-500 mb-8">Register your business and start getting customers instantly.</p>

            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors" placeholder="provider@example.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mobile Number</label>
                <input required type="tel" maxLength={10} value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors" placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                <input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors" placeholder="Create a strong password" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Business Name</label>
                <input required type="text" value={formData.businessName} onChange={e=>setFormData({...formData, businessName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors" placeholder="e.g. Speedster Motors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Service Category</label>
                <select value={formData.serviceCategory} onChange={e=>setFormData({...formData, serviceCategory: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors font-medium">
                  <option value="AUTO_MECHANIC">Auto Mechanic (Car/Bike)</option>
                  <option value="AC_TECHNICIAN">AC Technician</option>
                  <option value="ELECTRICIAN">Electrician</option>
                  <option value="PLUMBER">Plumber</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Business Address</label>
                <textarea required value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors min-h-[100px]" placeholder="Full physical address" />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-6 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex justify-center items-center">
                Next Step: Documents <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Upload Documents</h2>
            <p className="text-slate-500 mb-8">Admin needs these files to review and approve your account.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors relative cursor-pointer">
                <input required type="file" onChange={e=>setFormData({...formData, panFile: e.target.files?.[0] || null})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,image/*" />
                <div className="flex flex-col items-center justify-center text-center">
                   <Upload className="w-8 h-8 text-blue-500 mb-2" />
                   <h3 className="font-bold text-slate-700">{formData.panFile ? formData.panFile.name : 'Upload PAN Card'}</h3>
                   <p className="text-xs text-slate-500 mt-1">PDF or Image</p>
                </div>
              </div>

              <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors relative cursor-pointer">
                <input required type="file" onChange={e=>setFormData({...formData, citizenFile: e.target.files?.[0] || null})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,image/*" />
                <div className="flex flex-col items-center justify-center text-center">
                   <Upload className="w-8 h-8 text-blue-500 mb-2" />
                   <h3 className="font-bold text-slate-700">{formData.citizenFile ? formData.citizenFile.name : 'Upload Citizenship Document'}</h3>
                   <p className="text-xs text-slate-500 mt-1">PDF or Image</p>
                </div>
              </div>

              <div className="flex gap-4">
                 <button type="button" onClick={()=>setStep(1)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors">
                   Back
                 </button>
                 <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                   {isSubmitting ? 'Submitting...' : 'Submit Profile'}
                 </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md mx-auto text-center py-8">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-in zoom-in">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4">Application Submitted!</h2>
            <p className="text-slate-600 mb-8 text-lg">
              Your profile and documents have been sent to our admin team for review. 
              You will be notified once your business is approved!
            </p>
            <button onClick={onClose} className="bg-slate-900 text-white font-bold py-4 px-12 rounded-xl hover:bg-slate-800 transition-colors shadow-xl">
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
