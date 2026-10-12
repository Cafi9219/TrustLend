import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Users, 
  Coins, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const FintechMarketAnimation: React.FC = () => {
  // Animated Count-Up state for Trust Metrics
  const [volumeCount, setVolumeCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [repaymentCount, setRepaymentCount] = useState<number>(0);
  const [speedCount, setSpeedCount] = useState<number>(0);

  // Live real-time stream simulation
  const [activeNetworkMatch, setActiveNetworkMatch] = useState({
    borrower: 'Kavita S. (Pune)',
    amount: 85000,
    tenure: '12 Mo',
    lendersCount: 4,
    status: 'Instant Escrow Match'
  });

  // Simulated live matching queue rotation
  useEffect(() => {
    const queue = [
      { borrower: 'Kavita S. (Pune)', amount: 85000, tenure: '12 Mo', lendersCount: 4, status: 'Instant Escrow Match' },
      { borrower: 'Amit Verma (Bengaluru)', amount: 150000, tenure: '18 Mo', lendersCount: 6, status: '95% Co-Funded' },
      { borrower: 'Pooja Nair (Kochi)', amount: 50000, tenure: '6 Mo', lendersCount: 2, status: 'IMPS Disbursed' },
      { borrower: 'Rakesh Mehta (Ahmedabad)', amount: 220000, tenure: '24 Mo', lendersCount: 8, status: '100% Funded' },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % queue.length;
      setActiveNetworkMatch(queue[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Smooth Count-Up on Mount
  useEffect(() => {
    const duration = 1400; // ms
    const steps = 40;
    const intervalTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      setVolumeCount(parseFloat((18.4 * ease).toFixed(1)));
      setUsersCount(Math.round(34000 * ease));
      setRepaymentCount(parseFloat((99.4 * ease).toFixed(1)));
      setSpeedCount(parseFloat((4.2 * ease).toFixed(1)));

      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-6xl mx-auto my-1 sm:my-2 px-2 sm:px-4 select-none">
      {/* Background Soft Glows (Very subtle, light blue and green) */}
      <div className="absolute -top-6 -left-6 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Glassmorphic Network Container */}
      <div className="relative bg-white/95 rounded-3xl border border-slate-200/90 shadow-soft-xl overflow-hidden p-3 sm:p-4.5 backdrop-blur-md transition-all">
        {/* Subtle Financial Grid Texture */}
        <div className="absolute inset-0 fintech-grid-pattern opacity-40 pointer-events-none" />

        {/* Laser Scanner Beam traversing network */}
        <div className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent pointer-events-none -skew-x-12 animate-scanner z-0" />

        {/* Top Activity Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-2 sm:pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              Live Capital Flow Network
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[11px] text-slate-500">Live Matching:</span>
              <span className="font-bold text-slate-800 text-[11px]">{activeNetworkMatch.borrower}</span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              RBI P2P Compliant Escrow
            </span>
          </div>
        </div>

        {/* CENTRAL CAPITAL FLOW NETWORK VISUALIZATION */}
        <div className="relative z-10 py-2 sm:py-3">
          {/* Three Structural Ecosystem Nodes (Borrowers ↔ TrustLend ↔ Lenders) */}
          <div className="grid grid-cols-3 gap-2 text-center mb-2 px-2 sm:px-6">
            {/* 1. Borrower Node */}
            <div className="flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:-translate-y-0.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-extrabold text-slate-900 mt-1.5 block">
                Verified Borrowers
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Capital Requests & Fair EMIs
              </span>
            </div>

            {/* 2. TrustLend Central Network Node */}
            <div className="flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md ring-4 ring-blue-500/10 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-blue-700 mt-1 block tracking-tight">
                TrustLend Marketplace
              </span>
              <span className="text-[10px] text-slate-500 font-semibold hidden sm:block">
                e-KYC • Risk Scoring • Escrow
              </span>
            </div>

            {/* 3. Lender Node */}
            <div className="flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:-translate-y-0.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                <Coins className="w-5 h-5" />
              </div>
              <span className="text-xs font-extrabold text-slate-900 mt-1.5 block">
                Community Lenders
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Direct Capital & Net Yields
              </span>
            </div>
          </div>

          {/* Canvas Area with Animated SVG Lines, Moving Particles & Floating Activity Cards */}
          <div className="relative h-44 sm:h-52 w-full flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50/70 via-blue-50/20 to-white border border-slate-100">
            {/* SVG Interactive Financial Stream */}
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 960 200"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="mainFlowGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E40AF" />
                  <stop offset="50%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="returnGradient" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>

              {/* Area gradient under financial curve */}
              <path
                d="M0,150 C160,135 240,165 380,105 C480,55 580,120 720,65 C820,20 890,55 960,25 L960,200 L0,200 Z"
                fill="url(#curveGradient)"
              />

              {/* Path 1: Primary Capital Flow (Lenders → TrustLend → Borrowers) */}
              <path
                d="M0,150 C160,135 240,165 380,105 C480,55 580,120 720,65 C820,20 890,55 960,25"
                stroke="url(#mainFlowGradient)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Animated stream dashes moving forward */}
              <path
                d="M0,150 C160,135 240,165 380,105 C480,55 580,120 720,65 C820,20 890,55 960,25"
                stroke="#60A5FA"
                strokeWidth="3"
                strokeLinecap="round"
                className="animate-trend-flow opacity-70"
              />

              {/* Path 2: Return Flow (Borrowers Repaying EMIs → Returns Distributed to Lenders) */}
              <path
                d="M0,165 C160,155 260,185 400,125 C500,75 600,140 740,85 C840,40 900,75 960,45"
                stroke="url(#returnGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-return-flow opacity-50"
              />

              {/* Network Node Beacons & Radar Halos */}
              <g className="cursor-pointer">
                <circle cx="160" cy="135" r="5" fill="#1E40AF" />
                <circle cx="160" cy="135" r="13" fill="#1E40AF" className="animate-halo" />
              </g>

              <g className="cursor-pointer">
                <circle cx="480" cy="55" r="7" fill="#2563EB" />
                <circle cx="480" cy="55" r="16" fill="#2563EB" className="animate-halo" />
              </g>

              <g className="cursor-pointer">
                <circle cx="720" cy="65" r="6" fill="#059669" />
                <circle cx="720" cy="65" r="15" fill="#059669" className="animate-halo" />
              </g>

              <g className="cursor-pointer">
                <circle cx="960" cy="25" r="7" fill="#059669" />
                <circle cx="960" cy="25" r="18" fill="#059669" className="animate-halo" />
              </g>
            </svg>

            {/* FLOATING LIVE ACTIVITY CARD 1: Live Loan Request (Top Left) */}
            <div className="absolute left-[6%] sm:left-[10%] top-[8%] bg-white/95 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-md animate-float-card z-20 fintech-card-hover max-w-[210px] sm:max-w-[230px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                  Live Loan Request
                </span>
                <span className="text-[10px] font-extrabold text-blue-600">95% Funded</span>
              </div>
              <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                ₹1,50,000
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate mb-1.5">
                Education & Skill Loan
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: '95%' }} />
              </div>
            </div>

            {/* FLOATING LIVE ACTIVITY CARD 2: Live Investment (Top Right) */}
            <div className="absolute right-[6%] sm:right-[10%] top-[8%] bg-white/95 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-md animate-float-card-delay z-20 fintech-card-hover max-w-[210px] sm:max-w-[230px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                  Live Investment
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600">10.4% Net APY</span>
              </div>
              <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                ₹25,000 Invested
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>e-NACH Protected</span>
              </div>
            </div>

            {/* FLOATING LIVE ACTIVITY CARD 3: Loan Matched & Disbursed (Bottom Center) */}
            <div className="absolute bottom-[6%] bg-white/95 border border-slate-200/90 rounded-xl px-3.5 py-2 shadow-md animate-float-card-3 z-20 fintech-card-hover hidden sm:flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    Loan Matched
                  </span>
                  <span className="text-[10px] text-slate-400">Funding Completed • 2 mins ago</span>
                </div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  ₹75,000 Disbursed via Instant IMPS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TRUST METRICS WITH COUNT-UP ANIMATION */}
        <div className="relative z-10 pt-2 sm:pt-2.5 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 text-center">
          {/* Metric 1 */}
          <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:border-blue-200 transition-colors">
            <div className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              ₹{volumeCount} Cr+
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
              Facilitated Volume
            </div>
            <div className="text-[9px] sm:text-[10px] text-blue-600 font-semibold mt-0.5">
              Direct Peer Exchange
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:border-blue-200 transition-colors">
            <div className="text-base sm:text-xl font-black text-blue-600 tracking-tight">
              {usersCount.toLocaleString('en-IN')}+
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
              Registered Users
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5">
              Verified Borrowers & Lenders
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:border-emerald-200 transition-colors">
            <div className="text-base sm:text-xl font-black text-emerald-600 tracking-tight">
              {repaymentCount}%
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
              Repayment Rate
            </div>
            <div className="text-[9px] sm:text-[10px] text-emerald-700 font-medium mt-0.5">
              Backed by e-NACH Autodebit
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:border-indigo-200 transition-colors">
            <div className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              {speedCount} Hours
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
              Average Funding Time
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5">
              Listing to Bank Disbursement
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
