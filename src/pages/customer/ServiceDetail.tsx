import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Service } from '../../types';
import { Button } from '../../components/ui/Button';
import { ArrowRight, BadgeCheck, Clock3, ShieldCheck, Sparkles, Wrench } from 'lucide-react';

export const ServiceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await apiClient.get(`/services/${id}`);
        setService(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-10"><div className="glass-panel rounded-2xl py-16 text-center text-slate-500">Loading service details...</div></div>;
  if (!service) return <div className="mx-auto max-w-7xl px-4 py-10"><div className="glass-panel rounded-2xl py-16 text-center text-slate-500">Service not found</div></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl shadow-slate-900/20 flex flex-col">
          {/* Header Image Placeholder */}
          <div className="h-48 w-full bg-slate-800 flex flex-col items-center justify-center relative overflow-hidden border-b border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950/20" />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-blue-200 z-10 border border-white/10 backdrop-blur-sm shadow-inner">
              <Wrench className="h-6 w-6" />
            </div>
            <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] z-10">Service Image Placeholder</p>
          </div>

          <div className="relative p-8 sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.45),transparent_24rem),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.70))]" />
            <div className="relative">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 text-blue-100">
                <Wrench className="h-7 w-7" />
              </div>
              <div className="text-blue-100 text-sm font-bold uppercase tracking-[0.18em] mb-3">{service.category}</div>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">{service.name}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50/82">{service.description}</p>
              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-slate-950 shadow-xl">
                <span className="text-sm font-semibold text-slate-500">Starting price</span>
                <span className="text-2xl font-extrabold">
                  {service.priceType === 'STARTING_AT' ? 'From ' : ''}
                  Rs. {service.basePrice}{service.priceType === 'HOURLY' ? '/hr' : ''}
                </span>
              </div>
            </div>
          </div>
        
          <div className="grid gap-px bg-white/10 sm:grid-cols-3">
            {[
              [ShieldCheck, 'Verified pros', 'Identity and KYC checked'],
              [Clock3, 'Flexible slots', 'Pick a time that works'],
              [BadgeCheck, 'Service warranty', '30-day support window'],
            ].map(([Icon, title, body]) => {
              const IconComponent = Icon as typeof ShieldCheck;
              return (
                <div key={title as string} className="bg-slate-950/40 p-5">
                  <IconComponent className="mb-3 h-5 w-5 text-blue-200" />
                  <div className="font-bold">{title as string}</div>
                  <div className="mt-1 text-sm text-blue-50/68">{body as string}</div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-xl font-extrabold text-slate-950">Ready to book?</h2>
            <p className="mt-2 text-sm text-slate-500">Next, choose from available professionals based on rating, distance, jobs completed, and experience.</p>
            <Button 
              className="mt-6 w-full gap-2 py-4 text-lg"
              onClick={() => navigate(`/services/${service.id}/providers`)}
            >
              Choose Professional
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="service-card rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-extrabold text-slate-950">What's Included</h3>
            <div className="space-y-3">
              {(service.whatIncluded 
                ? service.whatIncluded.split(',').map(s => s.trim()) 
                : ['Expert professional service', 'Post-service cleanup', '30-day service warranty']
              ).map(item => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="service-card rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-extrabold text-slate-950">Good to Know</h3>
            <div className="space-y-3">
              {(service.whatExcluded 
                ? service.whatExcluded.split(',').map(s => s.trim()) 
                : ['Spare parts are charged separately', 'Major masonry work may need inspection']
              ).map(item => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
