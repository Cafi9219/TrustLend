import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const CtaBanner: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-8 sm:p-12 lg:p-16 text-white shadow-soft-xl relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to Experience Fair, Direct Micro-Lending?
            </h2>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Create your account in under 2 minutes. Whether you are funding an ambition or seeking returns, TrustLend puts the power back in your hands.
            </p>

            {/* Dual CTAs side by side */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register?intent=borrower"
                className="w-full sm:w-auto px-7 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group text-base"
              >
                <span>Request a Loan (Borrower)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/register?intent=lender"
                className="w-full sm:w-auto px-7 py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group text-base"
              >
                <span>Fund a Loan (Lender)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                No credit check impact to preview rates
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Min. $25 to start lending
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Zero setup or hidden subscription fees
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
