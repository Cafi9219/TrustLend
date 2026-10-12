import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Users, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { InteractiveEstimator } from './InteractiveEstimator';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-slate-50 to-white pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/60">
      {/* Subtle Background Glow Accent (Pure Fintech, no crypto neon) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/40 via-indigo-50/20 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Direct Micro-Lending. <br />
              Fair Rates for Borrowers. <br />
              Real Returns for Lenders.
            </h1>

            {/* Subtitle explicitly communicating borrower + lender equality */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              TrustLend connects individuals seeking fair, fast micro-loans directly with community lenders looking to earn reliable monthly yields. We eliminate costly banking middlemen so everyone gets a better financial deal.
            </p>

            {/* Equal Primary CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                to="/register?intent=borrower"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-lg transition-all duration-150 active:scale-[0.99] text-base group"
              >
                <span>Request a Loan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/register?intent=lender"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all duration-150 active:scale-[0.99] text-base group"
              >
                <span>Fund a Loan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Quick Guarantees & Social Proof */}
            <div className="pt-4 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">Bank-Grade</span>
                  <span>256-bit Security</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">34,000+</span>
                  <span>Active Members</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">99.4%</span>
                  <span>Repayment Rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Calculator Card */}
          <div className="lg:col-span-5 flex justify-center">
            <InteractiveEstimator />
          </div>
        </div>
      </div>
    </section>
  );
};
