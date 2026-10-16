import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle2, 
  Coins, 
  X, 
  Wallet, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Briefcase, 
  Clock, 
  Check,
  Sparkles 
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { dbService, MIN_TRANSACTION_AMOUNT, MAX_TRANSACTION_AMOUNT, DEMO_LENDER_ID } from '../../services/dbService';
import { useAuthMock } from '../../hooks/useAuthMock';
import { BorrowerLoanRequest, MarketplaceOpportunity } from '../../types';
import { AddToWalletModal } from '../../components/wallet/AddToWalletModal';

export const BrowseOpportunitiesPage: React.FC = () => {
  const { currentUser } = useAuthMock();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation between Marketplace and Individual Loan Requests
  const [activeSection, setActiveSection] = useState<'marketplace' | 'requests'>(() => {
    if (location.hash === '#individual-requests' || location.state?.view === 'requests') {
      return 'requests';
    }
    return 'marketplace';
  });

  const getInitialFundAmount = (): number => {
    const stateAmt = location.state?.selectedAmount;
    if (typeof stateAmt === 'number' && stateAmt >= MIN_TRANSACTION_AMOUNT && stateAmt <= MAX_TRANSACTION_AMOUNT) {
      return stateAmt;
    }
    try {
      const saved = sessionStorage.getItem('trustlend_calc_amount');
      if (saved) {
        const parsed = Number(saved);
        if (parsed >= MIN_TRANSACTION_AMOUNT && parsed <= MAX_TRANSACTION_AMOUNT) {
          return parsed;
        }
      }
    } catch {}
    return 2000;
  };

  const [opportunities, setOpportunities] = useState<MarketplaceOpportunity[]>([]);
  const [loanRequests, setLoanRequests] = useState<BorrowerLoanRequest[]>([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState<'All' | 'Pending' | 'Accepted'>('All');
  const [reviewingRequest, setReviewingRequest] = useState<BorrowerLoanRequest | null>(null);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedOpportunity, setSelectedOpportunity] = useState<MarketplaceOpportunity | null>(null);
  const [fundAmount, setFundAmount] = useState<number>(getInitialFundAmount);
  const [fundAmountInput, setFundAmountInput] = useState<string>(() => getInitialFundAmount().toLocaleString('en-IN'));
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Flow states: 'calculator' -> 'confirm' -> 'password' -> 'success'
  const [modalStep, setModalStep] = useState<'calculator' | 'confirm' | 'password' | 'success'>('calculator');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState<boolean>(false);
  const isDemoLender = currentUser?.id === DEMO_LENDER_ID;

  useEffect(() => {
    if (location.hash === '#individual-requests' || location.state?.view === 'requests') {
      setActiveSection('requests');
    }
  }, [location.hash, location.state]);

  // Sync fund amount when navigating with location.state
  useEffect(() => {
    if (location.state?.selectedAmount && typeof location.state.selectedAmount === 'number') {
      const amt = Math.min(Math.max(location.state.selectedAmount, MIN_TRANSACTION_AMOUNT), MAX_TRANSACTION_AMOUNT);
      setFundAmount(amt);
      setFundAmountInput(amt.toLocaleString('en-IN'));
      if (isDemoLender) {
        dbService.syncDemoWalletBalance(amt);
      }
    }
  }, [location.state, isDemoLender]);

  const loadData = () => {
    setOpportunities(dbService.getMarketplaceOpportunities());
    setLoanRequests(dbService.getAllLoanRequests());
    if (currentUser) {
      setWalletBalance(dbService.getWalletBalance(currentUser.id));
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribe((type) => {
      if (
        type === 'wallet_updated' || 
        type === 'investment_confirmed' || 
        type === 'repayment_recorded' || 
        type === 'loan_updated' ||
        type === 'loan_request_created' ||
        type === 'loan_request_updated'
      ) {
        loadData();
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleConfirmAcceptance = (request: BorrowerLoanRequest) => {
    if (!currentUser) return;
    setIsAccepting(true);
    try {
      const accepted = dbService.acceptLoanRequest(request.id, currentUser.id, currentUser.name);
      setToastMessage(`Loan request #${accepted.id} from ${accepted.borrowerName} accepted successfully! Status updated on borrower dashboard.`);
      setReviewingRequest(null);
      loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to accept loan request.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsAccepting(false);
    }
  };

  const filteredLoanRequests = loanRequests.filter((req) => {
    if (requestStatusFilter === 'Pending') {
      return req.status === 'Pending' || req.status === 'Pending Review';
    }
    if (requestStatusFilter === 'Accepted') {
      return req.status === 'Accepted';
    }
    return true;
  });

  const handleFundAmountChange = (valStr: string) => {
    const rawDigits = valStr.replace(/\D/g, '');
    if (!rawDigits) {
      setFundAmountInput('');
      return;
    }
    const val = Number(rawDigits);
    setFundAmountInput(val.toLocaleString('en-IN'));
    setFundAmount(val);
    setErrorMessage(null);
  };

  const handleFundAmountBlur = () => {
    let finalVal = Number(fundAmountInput.replace(/\D/g, ''));
    if (!finalVal || finalVal < MIN_TRANSACTION_AMOUNT) {
      finalVal = MIN_TRANSACTION_AMOUNT;
    } else if (finalVal > MAX_TRANSACTION_AMOUNT) {
      finalVal = MAX_TRANSACTION_AMOUNT;
    }
    setFundAmount(finalVal);
    setFundAmountInput(finalVal.toLocaleString('en-IN'));
    if (isDemoLender) {
      dbService.syncDemoWalletBalance(finalVal);
    }
  };

  const handleSelectPreset = (amt: number) => {
    setFundAmount(amt);
    setFundAmountInput(amt.toLocaleString('en-IN'));
    setErrorMessage(null);
    if (isDemoLender) {
      dbService.syncDemoWalletBalance(amt);
    }
  };

  const handleOpenModal = (opp: MarketplaceOpportunity) => {
    setSelectedOpportunity(opp);
    setErrorMessage(null);
    setPasswordInput('');
    setShowPassword(false);
    setIsProcessing(false);
    setModalStep('calculator');

    // Retain exact confirmed amount from calculator/input; clamp within permitted range and remaining allocation if needed
    const remaining = Math.max(0, opp.amount - opp.fundedAmount);
    let targetAmt = fundAmount;
    if (targetAmt < MIN_TRANSACTION_AMOUNT) {
      targetAmt = MIN_TRANSACTION_AMOUNT;
    } else if (targetAmt > MAX_TRANSACTION_AMOUNT) {
      targetAmt = MAX_TRANSACTION_AMOUNT;
    }
    if (remaining > 0 && targetAmt > remaining) {
      targetAmt = remaining;
    }

    setFundAmount(targetAmt);
    setFundAmountInput(targetAmt.toLocaleString('en-IN'));
    if (currentUser) {
      setWalletBalance(dbService.getWalletBalance(currentUser.id));
    }
  };

  const handleCloseModal = () => {
    setSelectedOpportunity(null);
    setModalStep('calculator');
    setPasswordInput('');
    setErrorMessage(null);
    setIsProcessing(false);
  };

  // Step 1 -> Step 2 validation
  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!selectedOpportunity || !currentUser) return;

    const remainingAmount = Math.max(0, selectedOpportunity.amount - selectedOpportunity.fundedAmount);
    if (remainingAmount <= 0) {
      setErrorMessage('This loan listing has already reached 100% funding.');
      return;
    }

    if (fundAmount < MIN_TRANSACTION_AMOUNT || fundAmount > MAX_TRANSACTION_AMOUNT) {
      setErrorMessage(`Investment amount must be between ₹${MIN_TRANSACTION_AMOUNT.toLocaleString('en-IN')} and ₹${MAX_TRANSACTION_AMOUNT.toLocaleString('en-IN')}.`);
      return;
    }

    if (fundAmount > remainingAmount) {
      setErrorMessage(`Investment amount exceeds the remaining available allocation of ₹${remainingAmount.toLocaleString('en-IN')}.`);
      return;
    }

    if (!isDemoLender && walletBalance < fundAmount) {
      setErrorMessage(`Insufficient wallet balance. You have ₹${walletBalance.toLocaleString('en-IN')}, but require ₹${fundAmount.toLocaleString('en-IN')}.`);
      return;
    }

    setModalStep('confirm');
  };

  // Step 3: Password Re-Verification & Atomic execution
  const handleAuthorizeInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity || !currentUser) return;

    if (!passwordInput || passwordInput.trim().length === 0) {
      setErrorMessage('Please enter your account password to authorize.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await dbService.verifyAndFundOpportunity({
        lenderId: currentUser.id,
        lenderName: currentUser.name,
        opportunityId: selectedOpportunity.id,
        amount: fundAmount,
        password: passwordInput,
      });

      // Refresh listings and active selected opportunity with latest database state
      const updatedOpps = dbService.getMarketplaceOpportunities();
      setOpportunities(updatedOpps);
      const updatedSelected = updatedOpps.find(o => o.id === selectedOpportunity.id);
      if (updatedSelected) {
        setSelectedOpportunity(updatedSelected);
      }
      setWalletBalance(result.remainingBalance);
      setModalStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authorization failed. No funds were deducted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const estimatedReturns = selectedOpportunity
    ? Math.round((fundAmount || 0) * (selectedOpportunity.interestRate / 100) * (selectedOpportunity.tenureMonths / 12))
    : 0;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Lender Opportunities & Requests
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore peer micro-loan investment listings or review direct individual borrower applications.
        </p>
      </div>

      {/* Navigation: Marketplace vs Individual Loan Requests */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl max-w-md border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveSection('marketplace')}
          className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeSection === 'marketplace'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Marketplace</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            activeSection === 'marketplace' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
          }`}>
            {opportunities.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('requests')}
          className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeSection === 'requests'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Individual Loan Requests</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            activeSection === 'requests' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
          }`}>
            {loanRequests.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: Marketplace (Retains all existing investment listings and current functionality) */}
      {activeSection === 'marketplace' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs text-slate-500">
            <span className="font-bold text-slate-800 text-sm">Verified P2P Investment Listings</span>
            <span>Showing <strong>{opportunities.length}</strong> active listings</span>
          </div>

          {/* Active Calculator Allocation Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-slate-50 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                ₹
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">
                    Selected Allocation: {formatINR(fundAmount)}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    From Calculator
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Available Wallet: <strong className="text-slate-900">{formatINR(walletBalance)}</strong> • Projected Wallet After Allocation: <strong className={!isDemoLender && walletBalance < fundAmount ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>{formatINR(isDemoLender ? Math.max(0, walletBalance - fundAmount) : walletBalance - fundAmount)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {isDemoLender ? (
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/70 px-2.5 py-1 rounded-xl">
                  ✓ Ready to Allocate (Demo Mode)
                </span>
              ) : walletBalance < fundAmount ? (
                <button
                  type="button"
                  onClick={() => setIsAddWalletModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors"
                >
                  + Add Funds to Wallet
                </button>
              ) : (
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/70 px-2.5 py-1 rounded-xl">
                  ✓ Ready to Allocate
                </span>
              )}
            </div>
          </div>

          {/* Opportunities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map((opp) => {
              const remainingAmount = Math.max(0, opp.amount - opp.fundedAmount);
          const fundingPct = Math.min(100, Math.max(0, Math.round((opp.fundedAmount / opp.amount) * 100)));

          return (
            <div
              key={opp.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft flex flex-col justify-between space-y-5"
            >
              <div>
                {/* Top Badge - Grade/Rating area removed, clean tenure badge preserved */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{opp.id}</span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {opp.tenureMonths} Mo Tenure
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {opp.interestRate}% Net APY
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {opp.purpose}
                </h3>
                <div className="text-xs text-slate-500 mb-4">
                  Borrower: <strong>{opp.borrowerName}</strong> • Verified Income & KYC
                </div>

                {/* Amount details */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                      Target Loan
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {formatINR(opp.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                      Tenure
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {opp.tenureMonths} Mo
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                      Min Slice
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {formatINR(opp.minTicket)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Funded: {formatINR(opp.fundedAmount)} ({fundingPct}%)</span>
                    <span>Remaining: {formatINR(remainingAmount)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${fundingPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{opp.daysRemaining} days remaining</span>
                    <span>Automated e-NACH</span>
                  </div>
                </div>
              </div>

              {/* Fund Action */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Est. Monthly: <strong>{formatINR(Math.round((opp.amount * (opp.interestRate / 100 / 12))))} /mo</strong>
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenModal(opp)}
                  disabled={remainingAmount <= 0}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 ${
                    remainingAmount <= 0
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{remainingAmount <= 0 ? 'Fully Funded' : 'Fund This Loan'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

  {/* VIEW 2: Individual Loan Requests (Separate view for borrower applications) */}
  {activeSection === 'requests' && (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-2">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Direct Borrower Applications</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Individual Loan Requests</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Separate from Marketplace
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review individual borrower credit applications. Check amount, purpose, tenure, calculated EMI, and borrower details, then choose to accept a request.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', 'Pending', 'Accepted'] as const).map((st) => {
            const count = st === 'All'
              ? loanRequests.length
              : st === 'Pending'
              ? loanRequests.filter(r => r.status === 'Pending' || r.status === 'Pending Review').length
              : loanRequests.filter(r => r.status === 'Accepted').length;

            return (
              <button
                key={st}
                type="button"
                onClick={() => setRequestStatusFilter(st)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                  requestStatusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filteredLoanRequests.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {requestStatusFilter === 'All' ? 'No Individual Loan Requests Available' : `No ${requestStatusFilter} Loan Requests`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When borrowers submit loan applications, they appear here separately from marketplace investment listings for individual review and acceptance.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoanRequests.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
            >
              <div className="space-y-2 flex-1">
                {/* Top Bar: ID, Date, Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-600">{req.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      req.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : req.status === 'Funded'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : req.status === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : req.status === 'Approved'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : req.status === 'Rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {(req.status === 'Completed' || req.status === 'Funded' || req.status === 'Accepted' || req.status === 'Approved') && <CheckCircle2 className="w-3 h-3" />}
                    {(req.status === 'Pending' || req.status === 'Pending Review') && <Clock className="w-3 h-3" />}
                    <span>{req.status === 'Pending Review' ? 'Pending' : req.status}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    • Submitted on {req.createdAt}
                  </span>
                </div>

                {/* Purpose & Borrower info */}
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{req.purpose}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                    <span className="font-semibold text-slate-800">{req.borrowerName}</span>
                    <span>•</span>
                    <span>{req.employmentType || 'Self-Employed'}</span>
                    {req.monthlyIncome ? (
                      <>
                        <span>•</span>
                        <span>Income: {formatINR(req.monthlyIncome)}/mo</span>
                      </>
                    ) : null}
                    <span>•</span>
                    <span className="text-emerald-700 font-medium inline-flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      KYC Verified
                    </span>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 max-w-2xl">
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Requested Capital</span>
                    <span className="text-sm font-extrabold text-slate-900">{formatINR(req.amount)}</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tenure</span>
                    <span className="text-sm font-extrabold text-slate-900">{req.tenureMonths} Months</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Annual Rate</span>
                    <span className="text-sm font-extrabold text-emerald-700">{req.interestRate}% p.a.</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Calculated Monthly EMI</span>
                    <span className="text-sm font-extrabold text-blue-700">{formatINR(req.monthlyEMI)}</span>
                  </div>
                </div>

                {/* Additional Calculated Repayment Details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                  <span>Total Repayment: <strong className="text-slate-800">{formatINR(req.totalRepayment || (req.monthlyEMI * req.tenureMonths))}</strong></span>
                  <span>•</span>
                  <span>Total Interest: <strong className="text-emerald-700">{formatINR(req.totalInterest || Math.max(0, (req.monthlyEMI * req.tenureMonths) - req.amount))}</strong></span>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0">
                {req.status === 'Accepted' ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold space-y-0.5 text-right">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold justify-end">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accepted by {req.acceptedByLenderName === currentUser?.name ? 'You' : (req.acceptedByLenderName || 'Lender')}</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 block">
                      Status updated on borrower dashboard
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReviewingRequest(req)}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    <span>Review & Accept Request</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

  {/* Review & Acceptance Modal for Individual Loan Requests */}
  {reviewingRequest && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Review Individual Loan Request
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {reviewingRequest.id}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReviewingRequest(null)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Request Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Applicant:</span>
            <strong className="text-slate-900">{reviewingRequest.borrowerName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Loan Purpose:</span>
            <strong className="text-slate-900">{reviewingRequest.purpose}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Requested Capital:</span>
            <strong className="text-slate-900 text-sm font-extrabold">{formatINR(reviewingRequest.amount)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tenure:</span>
            <strong className="text-slate-900">{reviewingRequest.tenureMonths} Months</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Fixed Rate:</span>
            <strong className="text-emerald-700">{reviewingRequest.interestRate}% p.a.</strong>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
            <span>Calculated Monthly EMI:</span>
            <span className="text-blue-700">{formatINR(reviewingRequest.monthlyEMI)}/mo</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Total Repayment:</span>
            <strong className="text-slate-900">{formatINR(reviewingRequest.totalRepayment || (reviewingRequest.monthlyEMI * reviewingRequest.tenureMonths))}</strong>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Total Interest Payable:</span>
            <strong className="text-emerald-700">{formatINR(reviewingRequest.totalInterest || Math.max(0, (reviewingRequest.monthlyEMI * reviewingRequest.tenureMonths) - reviewingRequest.amount))}</strong>
          </div>
        </div>

        {/* Important Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
          <span className="font-bold block">Important Notice:</span>
          <p>
            Accepting this individual request marks the application as <strong>Accepted</strong> and notifies the borrower on their dashboard. Acceptance alone does not mark the loan as fully funded or deduct funds from your wallet until formal disbursement.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setReviewingRequest(null)}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isAccepting}
            onClick={() => handleConfirmAcceptance(reviewingRequest)}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAccepting ? (
              <span>Saving Acceptance...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm Acceptance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )}

      {/* Multi-step Secure Investment Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              disabled={isProcessing}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ================= STEP 1: INVESTMENT CALCULATOR ================= */}
            {modalStep === 'calculator' && (
              <form onSubmit={handleProceedToConfirmation} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                      Funding Slice • {selectedOpportunity.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Target: {formatINR(selectedOpportunity.amount)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">
                    {selectedOpportunity.purpose}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Borrower: <strong>{selectedOpportunity.borrowerName}</strong> • Fixed Yield: <strong>{selectedOpportunity.interestRate}% Net APY</strong> • Tenure: <strong>{selectedOpportunity.tenureMonths} Mo</strong>
                  </p>
                </div>

                {/* Target, Remaining Allocation & Min Slice Breakdown */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Target Loan</span>
                    <span className="font-extrabold text-slate-900">{formatINR(selectedOpportunity.amount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Remaining</span>
                    <span className="font-extrabold text-emerald-700">{formatINR(Math.max(0, selectedOpportunity.amount - selectedOpportunity.fundedAmount))}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Min Slice</span>
                    <span className="font-extrabold text-slate-900">{formatINR(selectedOpportunity.minTicket)}</span>
                  </div>
                </div>

                {/* Amount input & presets */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                      Investment Amount (₹)
                    </label>
                    <span className="text-xs font-bold text-slate-500">
                      ₹100 – ₹1,00,000
                    </span>
                  </div>

                  {/* Preset quick buttons matching Demo Options (Demo Only) */}
                  {isDemoLender && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Option 1', amt: 5000 },
                        { label: 'Option 2', amt: 10000 },
                        { label: 'Option 3', amt: 20000 }
                      ].map((opt) => (
                        <button
                          key={opt.amt}
                          type="button"
                          onClick={() => handleSelectPreset(opt.amt)}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center ${
                            fundAmount === opt.amt
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/25 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-semibold text-slate-500">{opt.label}</span>
                          <span className="font-extrabold">{formatINR(opt.amt)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Direct input */}
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 font-bold text-slate-400 select-none pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fundAmountInput}
                      onChange={(e) => handleFundAmountChange(e.target.value)}
                      onBlur={handleFundAmountBlur}
                      placeholder="2,000"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min="100"
                    max="100000"
                    step="500"
                    value={Math.min(Math.max(fundAmount || 100, 100), 100000)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFundAmount(val);
                      setFundAmountInput(val.toLocaleString('en-IN'));
                      setErrorMessage(null);
                      if (isDemoLender) {
                        dbService.syncDemoWalletBalance(val);
                      }
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>₹100 min</span>
                    <span>₹50,000</span>
                    <span>₹1,00,000 max</span>
                  </div>
                </div>

                {/* Projected Remaining Wallet & Returns */}
                <div className="text-xs text-slate-600 space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between">
                    <span>Est. Projected Returns:</span>
                    <strong className="text-emerald-700">
                      +{formatINR(estimatedReturns)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Repayment Channel:</span>
                    <span>Automated Escrow e-NACH</span>
                  </div>
                </div>

                {/* Available Wallet Balance & Add to Wallet Action */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-slate-600 font-medium">Available Wallet Balance:</span>
                    </div>
                    <strong className="text-slate-900 font-bold">{formatINR(walletBalance)}</strong>
                  </div>

                  {isDemoLender ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Demo Mode: Selected allocation ({formatINR(fundAmount)}) is ready. Seamless auto-funding active upon authorization without manual top-up.
                        </span>
                      </div>
                    </div>
                  ) : walletBalance < fundAmount ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>
                          Available wallet balance ({formatINR(walletBalance)}) is insufficient for selected allocation ({formatINR(fundAmount)}).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddWalletModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] whitespace-nowrap transition-colors shadow-2xs"
                      >
                        + Add Funds
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500">Remaining after allocation:</span>
                      <strong className="text-slate-800">{formatINR(walletBalance - fundAmount)}</strong>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={(!isDemoLender && walletBalance < fundAmount) || (fundAmount < MIN_TRANSACTION_AMOUNT) || (fundAmount > MAX_TRANSACTION_AMOUNT)}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                      (!isDemoLender && walletBalance < fundAmount) || (fundAmount < MIN_TRANSACTION_AMOUNT) || (fundAmount > MAX_TRANSACTION_AMOUNT)
                        ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {!isDemoLender && walletBalance < fundAmount ? (
                      'Insufficient Wallet Balance'
                    ) : (
                      <>
                        <span>Review & Confirm Allocation of {formatINR(fundAmount)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {!isDemoLender && walletBalance < fundAmount && (
                    <button
                      type="button"
                      onClick={() => setIsAddWalletModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Add Funds to Wallet to Continue</span>
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* ================= STEP 2: MANDATORY CONFIRMATION DIALOG ================= */}
            {modalStep === 'confirm' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Investment Review & Confirmation
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Review Loan Allocation
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Please review the investment details carefully before authorizing the transaction.
                  </p>
                </div>

                {/* Structured Details Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Business / Loan Purpose:</span>
                    <span className="font-bold text-slate-900 text-right">{selectedOpportunity.purpose}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Borrower Name & ID:</span>
                    <span className="font-bold text-slate-900">{selectedOpportunity.borrowerName} ({selectedOpportunity.id})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Target Loan Amount:</span>
                    <span className="font-bold text-slate-900">{formatINR(selectedOpportunity.amount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Remaining Available:</span>
                    <span className="font-bold text-slate-900">{formatINR(Math.max(0, selectedOpportunity.amount - selectedOpportunity.fundedAmount))}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Investment Amount:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{formatINR(fundAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Annual Yield Rate:</span>
                    <span className="font-bold text-slate-900">{selectedOpportunity.interestRate}% Net APY (Fixed Max 9.5%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Loan Tenure:</span>
                    <span className="font-bold text-slate-900">{selectedOpportunity.tenureMonths} Months</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Estimated Returns:</span>
                    <span className="font-bold text-emerald-700">+{formatINR(estimatedReturns)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Current Available Wallet:</span>
                    <span className="font-bold text-slate-900">{formatINR(walletBalance)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 bg-rose-50/60 px-2 rounded-lg">
                    <span className="text-rose-800 font-semibold">Deduction from Wallet:</span>
                    <span className="font-bold text-rose-600">-{formatINR(fundAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 bg-emerald-50/70 px-2 rounded-lg">
                    <span className="text-emerald-900 font-semibold">Projected Wallet Remaining:</span>
                    <span className="font-black text-emerald-800">{formatINR(walletBalance - fundAmount)}</span>
                  </div>
                </div>

                {/* Regulatory Disclaimer */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                  <strong>Notice:</strong> Estimated returns are projections based on agreed loan terms and are not guaranteed bank earnings. Peer micro-lending transactions are subject to borrower credit performance.
                </div>

                {/* Mandatory Confirmation Question */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-sm font-bold text-emerald-950">
                    Are you sure you want to proceed with this investment?
                  </p>
                </div>

                {/* Action Buttons: Cancel & Continue */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setModalStep('password');
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>Continue to Authorize</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: PASSWORD RE-VERIFICATION ================= */}
            {modalStep === 'password' && (
              <form onSubmit={handleAuthorizeInvestment} className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Lock className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Security Authorization
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Re-Enter Account Password
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    To authorize deducting <strong>{formatINR(fundAmount)}</strong> from your wallet, please re-enter your account login password.
                  </p>
                </div>

                {currentUser?.id === DEMO_LENDER_ID && (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800">
                    <strong>Demo Lender Hint:</strong> Default password is <code className="font-bold bg-blue-100 px-1 py-0.5 rounded">12345</code>
                  </div>
                )}

                {/* Money authorization preview */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Available Wallet Balance:</span>
                    <strong className="text-slate-900 font-bold">{formatINR(walletBalance)}</strong>
                  </div>
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Amount to Deduct:</span>
                    <strong className="font-bold">-{formatINR(fundAmount)}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 font-bold">
                    <span className="text-slate-700">Wallet Balance After Debit:</span>
                    <strong className="text-emerald-700">{formatINR(isDemoLender ? Math.max(0, walletBalance - fundAmount) : walletBalance - fundAmount)}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Account Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setErrorMessage(null);
                      }}
                      disabled={isProcessing}
                      autoFocus
                      placeholder="Enter your account password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium pr-10 disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isProcessing}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !passwordInput}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying & Allocating...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authorize & Allocate {formatINR(fundAmount)}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 4: INVESTMENT SUCCESSFUL SCREEN ================= */}
            {modalStep === 'success' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Investment Successful!
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    You have successfully allocated <strong>{formatINR(fundAmount)}</strong> to "{selectedOpportunity.purpose}". Escrow ledger & payout schedules have been generated.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2.5 max-w-sm mx-auto text-left shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Confirmed Investment:</span>
                    <span className="font-extrabold text-emerald-800 text-sm">{formatINR(fundAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Previous Wallet Balance:</span>
                    <strong className="text-slate-800">{formatINR(walletBalance + fundAmount)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-rose-700 font-semibold">
                    <span>Deducted from Wallet:</span>
                    <strong className="font-bold">-{formatINR(fundAmount)}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200 items-center">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-700" />
                      <span className="font-extrabold text-slate-800">Updated Wallet Balance:</span>
                    </div>
                    <span className="font-black text-emerald-950 text-base">{formatINR(walletBalance)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-emerald-200/60">
                    <span>Target Loan Funding:</span>
                    <span className="font-semibold text-slate-700">
                      {formatINR(selectedOpportunity.fundedAmount)} / {formatINR(selectedOpportunity.amount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      navigate('/lender/dashboard');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      navigate('/lender/investments');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    View My Investments
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add to Wallet Modal */}
      <AddToWalletModal
        isOpen={isAddWalletModalOpen}
        onClose={() => setIsAddWalletModalOpen(false)}
        suggestedAmount={Math.max(fundAmount - walletBalance, MIN_TRANSACTION_AMOUNT)}
        onSuccess={(newBal) => {
          setWalletBalance(newBal);
          setIsAddWalletModalOpen(false);
        }}
      />
    </div>
  );
};
