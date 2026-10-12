import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Check, Sparkles, Wallet, AlertCircle } from 'lucide-react';
import { calculateLoanSimulation, formatINR, formatPercent } from '../../utils/formatters';
import { useAuthMock } from '../../hooks/useAuthMock';
import { dbService, DEMO_LENDER_ID, DEMO_BORROWER_ID } from '../../services/dbService';
import { AddToWalletModal } from '../wallet/AddToWalletModal';

interface InteractiveEstimatorProps {
  controlledMode?: 'borrow' | 'lend';
  onModeChange?: (mode: 'borrow' | 'lend') => void;
  hideTabs?: boolean;
}

export const InteractiveEstimator: React.FC<InteractiveEstimatorProps> = ({
  controlledMode,
  onModeChange,
  hideTabs = false,
}) => {
  const { currentUser, switchRole } = useAuthMock();
  const isDemoBorrower = currentUser?.id === DEMO_BORROWER_ID;
  const isDemoLender = currentUser?.id === DEMO_LENDER_ID;
  const isDemoUser = isDemoBorrower || isDemoLender || !!currentUser?.isTestAccount;
  // If borrower is logged in, default to borrow; if lender is logged in, default to lend
  const defaultMode = controlledMode || (currentUser?.role === 'lender' ? 'lend' : 'borrow');
  const [internalMode, setInternalMode] = useState<'borrow' | 'lend'>(defaultMode);

  // Effective mode prefers controlledMode when passed
  const mode = controlledMode ?? internalMode;

  const getSavedAmount = (): number => {
    try {
      const s = sessionStorage.getItem('trustlend_calc_amount');
      if (s) {
        const n = Number(s);
        if (n >= 100 && n <= 100000) return n;
      }
    } catch {}
    return defaultMode === 'lend' ? 10000 : 25000;
  };

  const getSavedMonths = (): number => {
    try {
      const s = sessionStorage.getItem('trustlend_calc_months');
      if (s) {
        const n = Number(s);
        if (n >= 1 && n <= 60) return n;
      }
    } catch {}
    return 12;
  };

  const [amount, setAmount] = useState<number>(getSavedAmount);
  const [amountInput, setAmountInput] = useState<string>(() => getSavedAmount().toLocaleString('en-IN'));
  const [termMonths, setTermMonths] = useState<number>(getSavedMonths);
  const [monthsInput, setMonthsInput] = useState<string>(() => String(getSavedMonths()));
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    return currentUser ? dbService.getWalletBalance(currentUser.id) : 0;
  });
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setWalletBalance(dbService.getWalletBalance(currentUser.id));
      const unsubscribe = dbService.subscribe((type) => {
        if (
          type === 'wallet_updated' ||
          type === 'investment_confirmed' ||
          type === 'funding_request_verified' ||
          type === 'repayment_recorded'
        ) {
          setWalletBalance(dbService.getWalletBalance(currentUser.id));
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  // Track previous mode to only reset amount if user explicitly switches between modes
  const prevModeRef = React.useRef(mode);

  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      // When switching to lend mode, default to 10,000 (Option 2) if previous was borrower default (25,000) or unset
      const saved = sessionStorage.getItem('trustlend_calc_amount');
      if (mode === 'lend') {
        if (!saved || saved === '25000') {
          saveAmount(10000);
          setAmountInput((10000).toLocaleString('en-IN'));
        }
      } else if (mode === 'borrow') {
        if (!saved || saved === '10000') {
          saveAmount(25000);
          setAmountInput((25000).toLocaleString('en-IN'));
        }
      }
    }
  }, [mode]);

  const syncDemoWallet = (val: number) => {
    if (currentUser?.id === DEMO_LENDER_ID) {
      dbService.syncDemoWalletBalance(val);
    } else if (currentUser?.id === 'usr_demo_borrower') {
      dbService.setWalletBalance(currentUser.id, val, `Demo Allocation: ₹${val.toLocaleString('en-IN')}`);
    }
  };

  // Sync demo wallet balance with selected calculator amount for demo accounts
  useEffect(() => {
    if (currentUser?.id === DEMO_LENDER_ID || currentUser?.id === 'usr_demo_borrower') {
      syncDemoWallet(amount);
    }
  }, [currentUser?.id, mode]);

  const saveAmount = (val: number) => {
    setAmount(val);
    try {
      sessionStorage.setItem('trustlend_calc_amount', String(val));
    } catch {}
    syncDemoWallet(val);
  };

  const saveMonths = (val: number) => {
    setTermMonths(val);
    try {
      sessionStorage.setItem('trustlend_calc_months', String(val));
    } catch {}
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setAmountInput('');
      return;
    }
    const val = Number(rawDigits);
    setAmountInput(val.toLocaleString('en-IN'));
    if (val > 0) {
      saveAmount(val);
    }
  };

  const handleAmountBlur = () => {
    let finalAmount = Number(amountInput.replace(/\D/g, ''));
    if (!finalAmount || finalAmount < 100) {
      finalAmount = 100;
    } else if (finalAmount > 100000) {
      finalAmount = 100000;
    }
    saveAmount(finalAmount);
    setAmountInput(finalAmount.toLocaleString('en-IN'));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    saveAmount(val);
    setAmountInput(val.toLocaleString('en-IN'));
  };

  const handleMonthsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    setMonthsInput(rawDigits);
    const val = Number(rawDigits);
    if (val >= 1 && val <= 60) {
      saveMonths(val);
    }
  };

  const handleMonthsBlur = () => {
    let finalMonths = Number(monthsInput.replace(/\D/g, ''));
    if (!finalMonths || finalMonths < 1) {
      finalMonths = 1;
    } else if (finalMonths > 60) {
      finalMonths = 60;
    }
    saveMonths(finalMonths);
    setMonthsInput(String(finalMonths));
  };

  const handleMonthsStep = (delta: number) => {
    const next = Math.min(Math.max(termMonths + delta, 1), 60);
    saveMonths(next);
    setMonthsInput(String(next));
  };

  const handleSelectPreset = (m: number) => {
    saveMonths(m);
    setMonthsInput(String(m));
  };

  const handleModeSwitch = async (newMode: 'borrow' | 'lend') => {
    setInternalMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
    if (currentUser) {
      const targetRole = newMode === 'borrow' ? 'borrower' : 'lender';
      if (currentUser.role !== targetRole) {
        await switchRole(targetRole);
      }
    }
  };

  const simulation = calculateLoanSimulation(amount, termMonths);

  const handleAction = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (mode === 'borrow') {
      navigate('/borrower/applications', { state: { requestedAmount: amount, requestedTenure: termMonths } });
    } else {
      if (!isDemoUser && walletBalance < amount) {
        setIsAddWalletModalOpen(true);
        return;
      }
      navigate('/lender/browse', { state: { selectedAmount: amount } });
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto space-y-4 sm:space-y-5">
      {/* 1. MAIN CALCULATOR CARD */}
      <div className="bg-white rounded-3xl shadow-soft-lg border border-slate-200/90 p-6 sm:p-8 w-full transition-all">
        {/* Mode Details Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              {mode === 'borrow' ? 'Monthly EMI Simulator' : 'P2P Net Yield Estimator'}
            </span>
            <p className="text-sm font-medium text-slate-800">
              {mode === 'borrow' ? 'Transparent interest, zero prepayment charges' : 'Compounding monthly distributions'}
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold ${
              mode === 'borrow' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {mode === 'borrow' ? 'Fixed 9.5% p.a.' : 'Fixed 9.5% APY'}
          </span>
        </div>

        {/* Amount Section with direct input & range slider */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {mode === 'borrow' ? 'Loan Principal Amount (₹)' : 'Investment Amount (₹)'}
            </label>
            <div className="relative flex items-center">
              <span
                className={`absolute left-3.5 font-black text-lg sm:text-xl pointer-events-none select-none ${
                  mode === 'borrow' ? 'text-blue-600' : 'text-emerald-600'
                }`}
              >
                ₹
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={handleAmountInputChange}
                onBlur={handleAmountBlur}
                aria-label="Amount in Rupees"
                placeholder="25,000"
                className={`pl-8 pr-3 py-1.5 sm:py-2 text-right font-black text-xl sm:text-2xl rounded-2xl border transition-all focus:outline-none focus:ring-2 w-44 sm:w-52 shadow-2xs ${
                  mode === 'borrow'
                    ? 'text-blue-600 bg-blue-50/50 border-blue-200 focus:bg-white focus:ring-blue-500 focus:border-blue-500'
                    : 'text-emerald-600 bg-emerald-50/50 border-emerald-200 focus:bg-white focus:ring-emerald-500 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* Range Slider linked automatically */}
          <input
            type="range"
            min="100"
            max="100000"
            step="500"
            value={Math.min(Math.max(amount, 100), 100000)}
            onChange={handleSliderChange}
            className={`w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none ${
              mode === 'borrow' ? 'accent-blue-600' : 'accent-emerald-600'
            }`}
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>₹100 min</span>
            <span>₹50,000</span>
            <span>₹1,00,000 max</span>
          </div>

          {/* Preset Selectable Options Pills - Visible for Demo Accounts Only */}
          {isDemoUser && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(mode === 'lend' ? [5000, 10000, 20000] : [10000, 25000, 50000]).map((presetAmt, idx) => {
                const isPresetSelected = amount === presetAmt;
                return (
                  <button
                    key={presetAmt}
                    type="button"
                    onClick={() => {
                      saveAmount(presetAmt);
                      setAmountInput(presetAmt.toLocaleString('en-IN'));
                    }}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center flex items-center justify-center gap-1 active:scale-95 ${
                      isPresetSelected
                        ? mode === 'lend'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isPresetSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>Option {idx + 1}: {formatINR(presetAmt)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tenure Section with direct input, steppers & quick preset buttons */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Repayment Tenure</span>
            </label>

            {/* Direct Months Input with - / + Stepper */}
            <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-2xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleMonthsStep(-1)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-extrabold text-sm flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-95"
                title="Decrease tenure by 1 month"
              >
                -
              </button>
              <div className="flex items-center px-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={monthsInput}
                  onChange={handleMonthsInputChange}
                  onBlur={handleMonthsBlur}
                  aria-label="Tenure in months"
                  className="w-10 text-center font-black text-lg sm:text-xl text-slate-900 bg-transparent outline-none"
                />
                <span className="text-xs font-bold text-slate-500 ml-0.5">Months</span>
              </div>
              <button
                type="button"
                onClick={() => handleMonthsStep(1)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-extrabold text-sm flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-95"
                title="Increase tenure by 1 month"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Preset Tenure Buttons (auto-synced) */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {[3, 6, 12, 18, 24, 36].map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => handleSelectPreset(months)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                  termMonths === months
                    ? mode === 'borrow'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {months} Mo
              </button>
            ))}
          </div>
        </div>

        {/* Result Metrics */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6">
          {mode === 'borrow' ? (
            <div className="grid grid-cols-2 gap-4 divide-x divide-slate-200">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Estimated Monthly EMI
                </span>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                  {formatINR(simulation.monthlyEMI)}
                  <span className="text-xs font-normal text-slate-500">/mo</span>
                </span>
              </div>
              <div className="pl-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Total Repayment (₹)
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {formatINR(simulation.totalRepayment)}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Total Interest: {formatINR(simulation.totalInterest)}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 divide-x divide-slate-200">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Total Return (₹)
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                  +{formatINR(simulation.lenderEstimatedReturn)}
                </span>
              </div>
              <div className="pl-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Investment Value (₹)
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {formatINR(amount + simulation.lenderEstimatedReturn)}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                  Principal + {formatPercent(simulation.lenderApy)} APY
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Highlights */}
        <div className="flex items-center justify-between text-xs text-slate-600 mb-5 px-1">
          <span className="inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            No foreclosure charges
          </span>
          <span className="inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            e-NACH automated debits
          </span>
          <span className="inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Escrow settlement
          </span>
        </div>

        {/* Live Wallet & Allocation Balance Panel */}
        {currentUser && mode === 'lend' && (() => {
          const isDemoLender = currentUser?.id === DEMO_LENDER_ID;
          const isCovered = walletBalance >= amount;
          const shortfall = Math.max(0, amount - walletBalance);

          return (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 mb-5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-600 font-semibold">Available Wallet Balance:</span>
                </div>
                <strong className="text-slate-900 font-black text-sm">{formatINR(walletBalance)}</strong>
              </div>

              <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
                <span className="text-slate-600 font-medium">Selected Investment Amount:</span>
                <strong className="text-emerald-700 font-bold text-sm">{formatINR(amount)}</strong>
              </div>

              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span className="text-slate-500 font-medium">Projected Wallet Remaining:</span>
                <strong className={`font-bold ${!isDemoLender && !isCovered ? 'text-slate-700' : 'text-slate-900'}`}>
                  {formatINR(isDemoLender ? Math.max(0, walletBalance - amount) : walletBalance - amount)}
                </strong>
              </div>

              {isDemoLender ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-2 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-semibold">
                      Demo Mode: Selected amount ({formatINR(amount)}) directly applied. Seamless auto-funding active on confirmation without manual top-up.
                    </span>
                  </div>
                </div>
              ) : !isCovered ? (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px]">
                      Shortfall: <strong className="text-slate-800">{formatINR(shortfall)}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddWalletModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs whitespace-nowrap shadow-xs transition-all cursor-pointer"
                  >
                    + Add to Wallet
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-200/60">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Wallet balance is sufficient to fund this allocation.</span>
                </div>
              )}
            </div>
          );
        })()}

        {currentUser && mode === 'borrow' && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1 mb-5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600 font-semibold">Available Wallet Balance:</span>
              </div>
              <strong className="text-slate-900 font-black text-sm">{formatINR(walletBalance)}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
              <span>Selected Loan Amount:</span>
              <strong className="text-blue-700 font-bold">{formatINR(amount)}</strong>
            </div>
          </div>
        )}

        <button
          onClick={handleAction}
          className={`w-full py-4 px-5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-sm cursor-pointer ${
            mode === 'borrow'
              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
          }`}
        >
          <span>{mode === 'borrow' ? `Apply for ${formatINR(amount)} Loan` : `Explore Opportunities with ${formatINR(amount)}`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. DEDICATED SECTION IMMEDIATELY BELOW THE CALCULATOR: THREE SELECTABLE OPTIONS (Demo Only) */}
      {isDemoUser && (
        <div className="bg-white rounded-3xl shadow-soft border border-slate-200/90 p-5 sm:p-6 w-full transition-all">
        {mode === 'lend' ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>College Demo Presets</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Three Selectable Investment Amounts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any demo option below to dynamically update the calculator. You can also customize any amount from ₹100 to ₹1,00,000 above.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 self-start sm:self-center">
                Fixed 9.5% APY
              </span>
            </div>

            {/* 3 Selectable Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Option 1', amt: 5000 },
                { label: 'Option 2', amt: 10000 },
                { label: 'Option 3', amt: 20000 },
              ].map((opt) => {
                const optSim = calculateLoanSimulation(opt.amt, termMonths);
                const isSelected = amount === opt.amt;

                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      saveAmount(opt.amt);
                      setAmountInput(opt.amt.toLocaleString('en-IN'));
                    }}
                    className={`text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between active:scale-[0.98] ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {opt.label}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                            <Check className="w-2.5 h-2.5" />
                            Selected
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Select
                          </span>
                        )}
                      </div>

                      <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {formatINR(opt.amt)}
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                        9.5% APY • {termMonths} Mo
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-[11px]">Est. Interest:</span>
                        <strong className="text-emerald-700 font-bold">
                          +{formatINR(optSim.lenderEstimatedReturn)}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-900 font-extrabold text-[11px]">
                        <span>Total Return:</span>
                        <strong className="text-slate-900 font-black">
                          {formatINR(opt.amt + optSim.lenderEstimatedReturn)}
                        </strong>
                      </div>
                      {currentUser && (
                        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span>Wallet After:</span>
                          <span className={`font-bold ${walletBalance < opt.amt ? 'text-rose-600' : 'text-slate-700'}`}>
                            {formatINR(walletBalance - opt.amt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between">
              <span>Selected option amount is loaded into calculator and confirmed upon allocation.</span>
              <span className="font-semibold text-emerald-700">Range: ₹100 – ₹1,00,000</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>College Demo Presets</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Three Selectable Loan Amounts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any demo option below to dynamically update the loan calculator. You can also customize any amount from ₹100 to ₹1,00,000 above.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 self-start sm:self-center">
                Fixed 9.5% p.a.
              </span>
            </div>

            {/* 3 Selectable Borrower Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Option 1', amt: 10000 },
                { label: 'Option 2', amt: 25000 },
                { label: 'Option 3', amt: 50000 },
              ].map((opt) => {
                const optSim = calculateLoanSimulation(opt.amt, termMonths);
                const isSelected = amount === opt.amt;

                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      saveAmount(opt.amt);
                      setAmountInput(opt.amt.toLocaleString('en-IN'));
                    }}
                    className={`text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between active:scale-[0.98] ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {opt.label}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                            <Check className="w-2.5 h-2.5" />
                            Selected
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Select
                          </span>
                        )}
                      </div>

                      <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {formatINR(opt.amt)}
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 block mt-0.5">
                        9.5% p.a. • {termMonths} Mo
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-[11px]">Monthly EMI:</span>
                        <strong className="text-blue-700 font-bold">
                          {formatINR(optSim.monthlyEMI)}/mo
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-900 font-extrabold text-[11px]">
                        <span>Total Repayment:</span>
                        <strong className="text-slate-900 font-black">
                          {formatINR(optSim.totalRepayment)}
                        </strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between">
              <span>Selected loan amount is loaded into calculator and applied upon application submission.</span>
              <span className="font-semibold text-blue-700">Range: ₹100 – ₹1,00,000</span>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Quick Add Funds Modal */}
      {currentUser && (
        <AddToWalletModal
          isOpen={isAddWalletModalOpen}
          onClose={() => setIsAddWalletModalOpen(false)}
          suggestedAmount={Math.max(100, amount - walletBalance)}
          onSuccess={(newBal) => setWalletBalance(newBal)}
        />
      )}
    </div>
  );
};
