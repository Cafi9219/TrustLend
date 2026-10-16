import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { HandCoins, TrendingUp, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthMock } from '../hooks/useAuthMock';
import { PublicLandingView } from '../components/home/PublicLandingView';
import { InteractiveEstimator } from '../components/home/InteractiveEstimator';
import { DEMO_BORROWER_ID, DEMO_LENDER_ID } from '../services/dbService';

export const HomePage: React.FC = () => {
  const { currentUser, switchRole } = useAuthMock();
  const location = useLocation();

  // Check if Demo Borrower or Demo Lender
  const isDemoBorrower = currentUser?.id === DEMO_BORROWER_ID;
  const isDemoLender = currentUser?.id === DEMO_LENDER_ID;
  const isDemoUser = isDemoBorrower || isDemoLender;

  // Determine navigation state mode if passed
  const stateMode = (location.state as { mode?: 'borrow' | 'lend' } | null)?.mode;

  // For demo users: skip path selection directly into their mode.
  // For new regular users without role selected yet: enforce Screen 1 ("Choose Your Path").
  // For authenticated real users with saved role: preserve selected role / session.
  const getInitialPath = (): 'borrow' | 'lend' | null => {
    if (isDemoBorrower) return 'borrow';
    if (isDemoLender) return 'lend';
    if (stateMode === 'borrow' || stateMode === 'lend') return stateMode;
    if (currentUser && currentUser.roleSelected === false) {
      return null;
    }
    if (currentUser?.roleSelected) {
      return currentUser.role === 'borrower' ? 'borrow' : 'lend';
    }
    try {
      const saved = sessionStorage.getItem('trustlend_home_selected_path');
      if (saved === 'borrow' || saved === 'lend') return saved;
    } catch {}
    return null;
  };

  const [selectedPath, setSelectedPath] = useState<'borrow' | 'lend' | null>(getInitialPath);

  // Sync if location.state changes
  useEffect(() => {
    if (stateMode === 'borrow' || stateMode === 'lend') {
      setSelectedPath(stateMode);
      try {
        sessionStorage.setItem('trustlend_home_selected_path', stateMode);
      } catch {}
    } else if (isDemoBorrower) {
      setSelectedPath('borrow');
    } else if (isDemoLender) {
      setSelectedPath('lend');
    }
  }, [stateMode, isDemoBorrower, isDemoLender]);

  const handleSelectPath = async (path: 'borrow' | 'lend') => {
    setSelectedPath(path);
    try {
      sessionStorage.setItem('trustlend_home_selected_path', path);
    } catch {}
    if (currentUser) {
      const targetRole = path === 'borrow' ? 'borrower' : 'lender';
      await switchRole(targetRole);
    }
  };

  const handleChangePath = () => {
    setSelectedPath(null);
    try {
      sessionStorage.removeItem('trustlend_home_selected_path');
    } catch {}
  };

  // If visitor is unauthenticated, show the minimal Stage A public landing page
  if (!currentUser) {
    return <PublicLandingView />;
  }

  // Non-demo users must verify their phone before selecting a path or accessing tools
  if (!isDemoUser && currentUser.phoneVerified === false) {
    return <Navigate to="/verify-phone" replace />;
  }

  // Non-demo users must complete identity verification before selecting a path or accessing tools
  if (!isDemoUser && currentUser.identityStatus !== 'verified') {
    return <Navigate to="/verify-identity" replace />;
  }

  // SCREEN 1: Dedicated "Choose Your Path" screen (No calculators shown!)
  if (!selectedPath) {
    return (
      <div className="min-h-[85vh] flex flex-col justify-center items-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Direct Peer-to-Peer Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Choose Your Path
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Select how you would like to participate in TrustLend today to access your financial tools.
            </p>
          </div>

          {/* Path Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
            {/* Borrow Capital Card */}
            <button
              type="button"
              onClick={() => handleSelectPath('borrow')}
              className="group text-left p-6 sm:p-7 rounded-3xl bg-white border-2 border-slate-200 hover:border-blue-600 shadow-soft hover:shadow-soft-lg transition-all flex flex-col justify-between focus:outline-none focus:ring-4 focus:ring-blue-500/10 active:scale-[0.99]"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                  <HandCoins className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Borrow Capital
                    </h3>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                      Fixed 9.5% p.a.
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Access fast loans with zero prepayment fees, structured tenures, and transparent monthly EMIs.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-blue-600">
                <span>Continue as Borrower</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Lend & Earn Card */}
            <button
              type="button"
              onClick={() => handleSelectPath('lend')}
              className="group text-left p-6 sm:p-7 rounded-3xl bg-white border-2 border-slate-200 hover:border-emerald-600 shadow-soft hover:shadow-soft-lg transition-all flex flex-col justify-between focus:outline-none focus:ring-4 focus:ring-emerald-500/10 active:scale-[0.99]"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Lend & Earn
                    </h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      Fixed 9.5% APY
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Deploy capital to verified borrowers with escrow protection and automated monthly cash payouts.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-emerald-600">
                <span>Continue as Lender</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: Corresponding Calculator Screen with Back / Change Option action
  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Navigation Action: Back / Change Option (Regular Users Only) */}
        <div className="flex items-center justify-between max-w-xl mx-auto w-full">
          {!isDemoUser ? (
            <button
              type="button"
              onClick={handleChangePath}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back / Change Path</span>
            </button>
          ) : <div />}

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {selectedPath === 'borrow' ? 'Borrower EMI Calculator' : 'Lender Yield Calculator'}
          </span>
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {selectedPath === 'borrow' ? 'Calculate Your Monthly EMI' : 'Calculate Your Lender Yield Returns'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            {selectedPath === 'borrow'
              ? 'Simulate your loan request with a fixed 9.5% p.a. interest rate and transparent tenure.'
              : 'Estimate your monthly returns and distributions at a fixed 9.5% APY yield.'}
          </p>
        </div>

        {/* Selected Calculator Only */}
        <div className="flex justify-center">
          <InteractiveEstimator
            controlledMode={selectedPath}
            onModeChange={(newMode) => handleSelectPath(newMode)}
            hideTabs={true}
          />
        </div>
      </div>
    </div>
  );
};
