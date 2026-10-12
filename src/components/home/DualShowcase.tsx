import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Zap, 
  BarChart3, 
  Compass, 
  HeartHandshake, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';
import { DUAL_PANELS } from '../../assets/mockData';

export const DualShowcase: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-2.5">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed Equally for Borrowers & Lenders
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 leading-relaxed">
            Whether you need micro-capital to expand your business or want to put idle funds to work earning reliable monthly returns, TrustLend provides equal transparency and control.
          </p>
        </div>

        {/* Dual Equal Visual Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* PANEL 1: BORROWER */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-7 sm:p-9 flex flex-col justify-between shadow-soft hover:shadow-soft-lg transition-all relative overflow-hidden group">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />

            <div>
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Borrower Features
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Fixed APR from 8.9%
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                Accessible Capital Without Bank Bureaucracy
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Fund equipment, emergency expenses, education, or business inventory with clear fixed terms and zero early repayment penalties.
              </p>

              {/* 3 Borrower Metrics */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 mb-7 shadow-sm">
                <div>
                  <div className="text-lg sm:text-xl font-black text-blue-600">$250 - $25k</div>
                  <div className="text-[11px] text-slate-600 font-medium">Loan range</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-slate-900">&lt; 24h</div>
                  <div className="text-[11px] text-slate-600 font-medium">Fast approval</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-slate-900">0%</div>
                  <div className="text-[11px] text-slate-600 font-medium">Pre-payment fee</div>
                </div>
              </div>

              {/* Required 3 Features: Request Loans, Flexible Funding, Track Loan Status */}
              <div className="space-y-4 mb-8">
                {/* 1. Request Loans */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/70 shadow-soft-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Request Loans</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Customize your loan request in minutes. Choose loan targets, duration (3 to 24 months), and state your specific use case.
                    </p>
                  </div>
                </div>

                {/* 2. Flexible Funding */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/70 shadow-soft-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Flexible Funding</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Loans can be backed by one community member or co-funded by dozens of supporters, maximizing your chances of fast fulfillment.
                    </p>
                  </div>
                </div>

                {/* 3. Track Loan Status */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/70 shadow-soft-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Track Loan Status</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Stay informed throughout the lifecycle: review funding progress, automated payment schedules, and positive credit history buildup.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Borrower Action Button */}
            <div>
              <Link
                to="/register?intent=borrower"
                className="w-full py-4 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-lg transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 text-sm sm:text-base group"
              >
                <span>Request a Loan as Borrower</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-center text-xs text-slate-600 mt-2.5">
                No impact to your primary credit score to check pre-qualification rates.
              </p>
            </div>
          </div>

          {/* PANEL 2: LENDER */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-7 sm:p-9 flex flex-col justify-between shadow-soft hover:shadow-soft-lg transition-all relative overflow-hidden group">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />

            <div>
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Lender Features
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Target APY 7.8% - 11.2%
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                Predictable Monthly Yields on Real Micro-Loans
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Fund verified members of the community, diversify across risk profiles, and enjoy predictable monthly cashflow directly to your wallet.
              </p>

              {/* 3 Lender Metrics */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 mb-7 shadow-sm">
                <div>
                  <div className="text-lg sm:text-xl font-black text-emerald-600">7.8% - 11.2%</div>
                  <div className="text-[11px] text-slate-600 font-medium">Net target APY</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-slate-900">$25</div>
                  <div className="text-[11px] text-slate-600 font-medium">Min per loan slice</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-slate-900">Monthly</div>
                  <div className="text-[11px] text-slate-600 font-medium">Direct payouts</div>
                </div>
              </div>

              {/* Required 3 Features: Browse Opportunities, Fund Borrowers, Earn Returns */}
              <div className="space-y-4 mb-8">
                {/* 1. Browse Opportunities */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/70 shadow-soft-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Browse Opportunities</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Filter pre-vetted requests by risk tier, interest yield, repayment term, or loan purpose with full credit profile transparency.
                    </p>
                  </div>
                </div>

                {/* 2. Fund Borrowers */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/70 shadow-soft-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Fund Borrowers</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Allocate fractional amounts starting from just $25 per loan. Build a resilient portfolio diversified across dozens of borrowers.
                    </p>
                  </div>
                </div>

                {/* 3. Earn Returns */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/70 shadow-soft-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Earn Returns</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Receive monthly principal and interest directly. Reinvest automatically to compound yields or withdraw to your bank anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lender Action Button */}
            <div>
              <Link
                to="/register?intent=lender"
                className="w-full py-4 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 text-sm sm:text-base group"
              >
                <span>Fund a Loan as Lender</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-center text-xs text-slate-600 mt-2.5">
                Custodial deposits held with regulated FDIC-insured banking partners.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
