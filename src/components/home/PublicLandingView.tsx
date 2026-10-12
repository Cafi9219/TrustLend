import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { FintechMarketAnimation } from './FintechMarketAnimation';

export const PublicLandingView: React.FC = () => {
  return (
    <div className="fintech-mesh-bg text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* 1. Fullscreen Primary Viewport (Takes 100vh so everything is visible upfront without initial footer) */}
      {/* Fixed Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3 px-4 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: TrustLend Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1">
                Trust<span className="text-blue-600">Lend</span>
              </span>
              <span className="text-[9px] tracking-wider font-semibold text-slate-400 uppercase">
                Peer-to-Peer Network
              </span>
            </div>
          </Link>

          {/* Right: Sign In | Create Account */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Sign In
            </Link>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.99]"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 1. Fullscreen Primary Viewport (Takes 100vh with pt-16 for fixed header so everything is visible upfront without initial footer) */}
      <section className="min-h-screen flex flex-col justify-between pt-16 sm:pt-20 pb-2 sm:pb-3 relative overflow-hidden">
        {/* Subtle Ambient Mesh Lights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

        {/* Center Hero: Expands across the page with lean side margins */}
        <main className="flex-1 flex flex-col items-center justify-center py-1 sm:py-2 px-3 sm:px-6 lg:px-8 text-center w-full max-w-7xl mx-auto z-10">
          <div className="w-full space-y-1.5 sm:space-y-2">
            {/* Improved Fintech Headline (Badge removed to give room to adjust down line properly) */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Borrow Smarter. Invest Better.
              <span className="text-slate-600 text-lg sm:text-xl lg:text-2xl font-semibold block mt-0.5 tracking-normal">
                Powered by India's Trusted Peer-to-Peer Lending Network.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Connect verified borrowers and lenders through a transparent marketplace designed for trust, growth, and financial inclusion.
            </p>

            {/* LIVE CAPITAL FLOW NETWORK VISUALIZATION */}
            <FintechMarketAnimation />

            {/* Down Line: Closing Tagline adjusted to sit cleanly above fold */}
            <div className="pt-1 pb-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900">
                Fair Loans. Better Returns.
              </div>
            </div>
          </div>
        </main>
      </section>

      {/* 2. Small Footer (Placed strictly BELOW the 100vh fold, so it is ONLY visible when scrolling down) */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 px-4 sm:px-8 text-center text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} TrustLend Financial Technologies India. All rights reserved.</p>
          <p className="text-slate-400">
            Peer-to-Peer Lending Marketplace Facilitator. All transactions are held in partner escrow accounts.
          </p>
        </div>
      </footer>
    </div>
  );
};
