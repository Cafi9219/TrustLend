import React from 'react';
import { Shield, Lock, CheckCircle2, ShieldCheck, Building2, TrendingUp, Users, Clock } from 'lucide-react';
import { PLATFORM_STATS, TRUST_PILLARS } from '../../assets/mockData';

export const TrustMetrics: React.FC = () => {
  const getPillarIcon = (name: string) => {
    switch (name) {
      case 'Lock':
        return <Lock className="w-5 h-5 text-blue-600" />;
      case 'ShieldAlert':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-indigo-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Statistics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 pb-16 border-b border-slate-800">
          {PLATFORM_STATS.map((stat, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-2">
                <span>{stat.value}</span>
              </div>
              <div className="text-sm font-semibold text-slate-300">
                {stat.label}
              </div>
              <div className="text-xs text-slate-400">
                {stat.subtext}
              </div>
            </div>
          ))}
        </div>

        {/* Trust & Compliance Pillars */}
        <div className="pt-16">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Built on Trust, Verification & Compliance
            </h3>
            <p className="text-slate-400 text-sm sm:text-base">
              Every loan is protected by rigorous underwriting, verified bank connections, and regulatory compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_PILLARS.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 hover:border-slate-600 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-4">
                  {getPillarIcon(pillar.iconName)}
                </div>
                <h4 className="text-base font-bold text-white mb-2">
                  {pillar.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
