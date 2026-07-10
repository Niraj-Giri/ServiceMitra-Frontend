import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { postTask } from '../../api/tasks';
import type { Service } from '../../types';
import {
  ArrowLeft, ArrowRight, MapPin, Calendar, DollarSign,
  FileText, CheckCircle, Loader2, AlertCircle, Sparkles
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

interface FormState {
  title: string;
  description: string;
  preferredDate: string;
  budgetMinNpr: string;
  budgetMaxNpr: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  pointsToRedeem: number;
}

const STEPS = [
  { label: 'Job Details', icon: FileText },
  { label: 'Your Budget', icon: DollarSign },
  { label: 'Location', icon: MapPin },
  { label: 'Review', icon: CheckCircle },
];

export const PostTask: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceId = searchParams.get('serviceId');

  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<Service | null>(null);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    preferredDate: '',
    budgetMinNpr: '',
    budgetMaxNpr: '',
    address: '',
    latitude: null,
    longitude: null,
    pointsToRedeem: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (serviceId) {
          const [svcRes, pointsRes] = await Promise.all([
            apiClient.get(`/services/${serviceId}`),
            apiClient.get('/loyalty/points').catch(() => ({ data: { balance: 0 } })),
          ]);
          setService(svcRes.data);
          setRewardPoints(pointsRes.data?.balance ?? 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [serviceId]);

  const set = (field: keyof FormState, value: string | number | null) =>
    setForm(f => ({ ...f, [field]: value }));

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('latitude', pos.coords.latitude);
        set('longitude', pos.coords.longitude);
        if (!form.address) set('address', 'Current Location');
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('Could not detect location. Please type your address.');
      }
    );
  };

  const validate = (s: Step): string | null => {
    if (s === 1) {
      if (!form.title.trim()) return 'Please enter a job title.';
      if (!form.description.trim() || form.description.length < 20) return 'Please describe the job in at least 20 characters.';
    }
    if (s === 2) {
      const min = parseFloat(form.budgetMinNpr);
      const max = parseFloat(form.budgetMaxNpr);
      if (isNaN(min) || min <= 0) return 'Enter a valid minimum budget.';
      if (isNaN(max) || max < min) return 'Maximum budget must be ≥ minimum budget.';
    }
    if (s === 3) {
      if (!form.address.trim()) return 'Please enter the job location.';
    }
    return null;
  };

  const next = () => {
    const err = validate(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => (s < 4 ? (s + 1) as Step : s));
  };
  const back = () => { setError(null); setStep(s => (s > 1 ? (s - 1) as Step : s)); };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const task = await postTask({
        serviceId: Number(serviceId),
        title: form.title,
        description: form.description,
        budgetMinNpr: parseFloat(form.budgetMinNpr),
        budgetMaxNpr: parseFloat(form.budgetMaxNpr),
        address: form.address,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        preferredDate: form.preferredDate || undefined,
        pointsToRedeem: form.pointsToRedeem,
      });
      navigate(`/task/${task.id}`, { state: { fromPost: true } });
    } catch (e: unknown) {
      const axErr = e as { response?: { data?: { message?: string } } };
      setError(axErr?.response?.data?.message ?? 'Failed to post task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Post a Task</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {service ? <><span className="font-semibold text-blue-600">{service.name}</span> · {service.category}</> : 'Describe your job and get quotes'}
            </p>
          </div>
        </div>
      </div>

      {/* Step progress */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const stepNum = (i + 1) as Step;
          const isActive = stepNum === step;
          const isDone = stepNum < step;
          return (
            <React.Fragment key={s.label}>
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isDone ? 'bg-blue-600 border-blue-600 text-white' :
                  isActive ? 'bg-white border-blue-600 text-blue-600 shadow-md shadow-blue-600/20' :
                  'bg-white border-slate-200 text-slate-300'
                }`}>
                  {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${isActive ? 'text-blue-600' : isDone ? 'text-blue-400' : 'text-slate-300'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mb-5 mx-1 transition-all duration-500 ${stepNum < step ? 'bg-blue-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step content card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-5">

        {/* ── STEP 1: Job Details ── */}
        {step === 1 && (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">Describe the job</h2>
              <p className="text-sm text-slate-500">Be specific — providers will use this to quote accurately.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Job Title <span className="text-red-500">*</span></label>
                <input
                  id="task-title"
                  type="text"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder={`e.g. Fix leaking ${service?.category?.toLowerCase() ?? 'service'} issue`}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-slate-400">({form.description.length} chars, min 20)</span>
                </label>
                <textarea
                  id="task-description"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Explain what needs to be done, the current problem, any relevant details (size, materials, access, etc.)..."
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Preferred Date (optional)</label>
                <input
                  id="task-date"
                  type="date"
                  value={form.preferredDate}
                  onChange={e => set('preferredDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: Budget ── */}
        {step === 2 && (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">Set your budget</h2>
              <p className="text-sm text-slate-500">Providers will see your range and quote accordingly. You can still negotiate.</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Min Budget (NPR) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rs.</span>
                    <input
                      id="budget-min"
                      type="number"
                      min={0}
                      value={form.budgetMinNpr}
                      onChange={e => set('budgetMinNpr', e.target.value)}
                      placeholder="500"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Max Budget (NPR) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rs.</span>
                    <input
                      id="budget-max"
                      type="number"
                      min={0}
                      value={form.budgetMaxNpr}
                      onChange={e => set('budgetMaxNpr', e.target.value)}
                      placeholder="2000"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Budget hint */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
                <div className="font-bold mb-1">💡 Budget Tips</div>
                <ul className="space-y-1 text-blue-700 text-xs list-disc list-inside">
                  <li>Setting a realistic range attracts more providers</li>
                  <li>You can counter-offer any quote you receive</li>
                  <li>Providers won't quote above your max if you clearly state it</li>
                </ul>
              </div>

              {/* Reward points */}
              {rewardPoints > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-amber-800">🎯 Use Reward Points</div>
                    <span className="text-xs font-bold text-amber-600">{rewardPoints} pts available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="points-redeem"
                      type="range"
                      min={0}
                      max={Math.min(rewardPoints, 500)}
                      step={10}
                      value={form.pointsToRedeem}
                      onChange={e => set('pointsToRedeem', parseInt(e.target.value))}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="text-sm font-bold text-amber-700 w-20 text-right">
                      {form.pointsToRedeem} pts = Rs.{form.pointsToRedeem}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── STEP 3: Location ── */}
        {step === 3 && (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">Where is the job?</h2>
              <p className="text-sm text-slate-500">Providers near your location will see this task.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Address <span className="text-red-500">*</span></label>
                <textarea
                  id="task-address"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="e.g. 123 Lakeside Road, Pokhara, Gandaki Province"
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                />
              </div>
              <button
                onClick={detectLocation}
                disabled={locating}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100 transition disabled:opacity-60 w-full justify-center"
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {locating ? 'Detecting...' : 'Use My Current Location'}
              </button>
              {form.latitude && form.longitude && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Location detected: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                </div>
              )}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500">
                📍 Your exact coordinates help us match providers within 15 km of your location.
              </div>
            </div>
          </>
        )}

        {/* ── STEP 4: Review ── */}
        {step === 4 && (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">Review your task</h2>
              <p className="text-sm text-slate-500">Check everything before posting.</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <Row label="Service" value={service ? `${service.name} (${service.category})` : '—'} />
                <Row label="Title" value={form.title} />
                <Row label="Description" value={form.description} />
                <Row label="Preferred Date" value={form.preferredDate || 'Flexible'} />
                <div className="border-t border-slate-200 pt-3" />
                <Row label="Min Budget" value={`Rs. ${form.budgetMinNpr}`} />
                <Row label="Max Budget" value={`Rs. ${form.budgetMaxNpr}`} />
                {form.pointsToRedeem > 0 && <Row label="Points Redeemed" value={`${form.pointsToRedeem} pts (Rs. ${form.pointsToRedeem} off)`} />}
                <div className="border-t border-slate-200 pt-3" />
                <Row label="Location" value={form.address} />
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-xs text-blue-700 font-semibold">
                ✅ After posting, nearby verified providers will be able to see and quote on your task.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between gap-4">
        {step > 1 ? (
          <button
            onClick={back}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : <div />}

        {step < 4 ? (
          <button
            onClick={next}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 active:scale-95 transition shadow-md shadow-blue-600/30"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 active:scale-95 transition shadow-md shadow-blue-600/30 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {submitting ? 'Posting...' : 'Post Task'}
          </button>
        )}
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-3">
    <span className="w-32 shrink-0 font-bold text-slate-500">{label}</span>
    <span className="text-slate-800 font-semibold">{value}</span>
  </div>
);
