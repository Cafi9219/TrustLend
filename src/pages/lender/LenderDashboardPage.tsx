import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Coins, 
  ArrowUpRight, 
  Calendar, 
  Clock, 
  Compass, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Check, 
  Wallet,
  TrendingUp,
  Layers,
  ShieldCheck,
  X,
  FileText,
  Briefcase
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { useAuthMock } from '../../hooks/useAuthMock';
import { dbService, DEMO_LENDER_ID } from '../../services/dbService';
import { BorrowerLoanRequest, LenderInvestment, PayoutInstallment, PayoutStatus } from '../../types';
import { AddToWalletModal } from '../../components/wallet/AddToWalletModal';

export const LenderDashboardPage: React.FC = () => {
  const { currentUser } = useAuthMock();
  const [investments, setInvestments] = useState<LenderInvestment[]>([]);
  const [schedules, setSchedules] = useState<PayoutInstallment[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<'All' | PayoutStatus>('All');
  const [selectedInvestmentFilter, setSelectedInvestmentFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState<boolean>(false);

  // Individual Loan Requests state (Separate from Marketplace)
  const [loanRequests, setLoanRequests] = useState<BorrowerLoanRequest[]>([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState<'All' | 'Pending' | 'Accepted'>('All');
  const [reviewingRequest, setReviewingRequest] = useState<BorrowerLoanRequest | null>(null);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [selectedPresetAmt, setSelectedPresetAmt] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem('trustlend_calc_amount');
      if (stored) {
        const val = Number(stored);
        if ([5000, 10000, 20000].includes(val)) return val;
      }
    } catch {}
    return 5000;
  });

  const loadData = () => {
    if (!currentUser) return;
    const userInvestments = dbService.getInvestments(currentUser.id);
    const userSchedules = dbService.getPayoutSchedules(currentUser.id);
    const balance = dbService.getWalletBalance(currentUser.id);
    const allRequests = dbService.getAllLoanRequests();
    setInvestments(userInvestments);
    setSchedules(userSchedules);
    setWalletBalance(balance);
    setLoanRequests(allRequests);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRecordRepayment = (installmentId: string) => {
    const updated = dbService.recordPayoutRepayment(installmentId);
    if (updated) {
      loadData();
      showToast(`Repayment for installment #${updated.installmentNumber} of ${formatINR(updated.totalAmount)} recorded as Paid.`);
    }
  };

  const handleConfirmAcceptance = (request: BorrowerLoanRequest) => {
    if (!currentUser) return;
    setIsAccepting(true);
    try {
      const accepted = dbService.acceptLoanRequest(request.id, currentUser.id, currentUser.name);
      showToast(`Loan request #${accepted.id} from ${accepted.borrowerName} accepted successfully! Status updated on borrower dashboard.`);
      setReviewingRequest(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept loan request.');
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

  // Metrics (Single Source of Truth & Duplicate-Protected)
  const uniqueInvestments = Array.from(new Map(investments.map(i => [i.id, i])).values());
  const activeInvestments = uniqueInvestments.filter(i => i.status === 'Performing');
  const activePortfolioValue = activeInvestments.reduce((sum, i) => sum + i.investedAmount, 0);
  const totalInvestedCapital = uniqueInvestments.reduce((sum, i) => sum + i.investedAmount, 0);
  const totalInvested = totalInvestedCapital;

  const uniqueSchedules = Array.from(new Map(schedules.map(s => [s.id, s])).values());
  const paidSchedules = uniqueSchedules.filter(s => s.status === 'Paid');
  const totalEarned = paidSchedules.reduce((sum, s) => sum + (s.actualPaidAmount || s.totalAmount), 0);

  const totalMonthlyIncome = activeInvestments.reduce((sum, i) => sum + i.monthlyPayout, 0);

  const weightedYield = activePortfolioValue > 0
    ? (activeInvestments.reduce((sum, i) => sum + (i.investedAmount * i.annualYield), 0) / activePortfolioValue).toFixed(1)
    : totalInvestedCapital > 0
    ? (uniqueInvestments.reduce((sum, i) => sum + (i.investedAmount * i.annualYield), 0) / totalInvestedCapital).toFixed(1)
    : '0.0';

  // Next Payout & Expected Returns
  const unpaidSchedules = uniqueSchedules
    .filter(s => s.status !== 'Paid')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const nextPayout = unpaidSchedules[0] || null;
  const finalPayoutInstallment = [...uniqueSchedules].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0] || null;
  const totalExpectedReturns = uniqueSchedules.reduce((sum, s) => sum + s.interestAmount, 0);
  const remainingExpectedReturns = unpaidSchedules.reduce((sum, s) => sum + s.interestAmount, 0);

  // Section 5: Monthly Earnings Summary Calculations
  const expectedMonthlyPrincipal = activeInvestments
    .reduce((sum, i) => sum + Math.floor(i.investedAmount / i.tenureMonths), 0);

  const expectedMonthlyInterest = Math.max(0, totalMonthlyIncome - expectedMonthlyPrincipal);
  const platformFee = 0; // 0.0% unconfigured fee
  const netEstimatedInterestRemaining = Math.max(0, remainingExpectedReturns - platformFee);

  const actualPrincipalReceived = paidSchedules
    .reduce((sum, s) => sum + s.principalAmount, 0);

  const actualInterestReceived = paidSchedules
    .reduce((sum, s) => sum + s.interestAmount, 0);

  const totalRepaymentsActuallyReceived = actualPrincipalReceived + actualInterestReceived;

  // Section 6: Investment-Wise Breakdown Calculations
  const investmentBreakdowns = investments.map(inv => {
    const invSchedules = schedules.filter(s => s.investmentId === inv.id);
    const paidSchedules = invSchedules.filter(s => s.status === 'Paid');
    const unpaidSchedulesForInv = invSchedules
      .filter(s => s.status !== 'Paid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const paidPrincipal = paidSchedules.reduce((sum, s) => sum + s.principalAmount, 0);
    const currentOutstandingPrincipal = Math.max(0, inv.investedAmount - paidPrincipal);
    const actualReceived = paidSchedules.reduce((sum, s) => sum + (s.actualPaidAmount || s.totalAmount), 0);

    const monthlyPrincipal = Math.floor(inv.investedAmount / inv.tenureMonths);
    const monthlyInterest = Math.max(0, inv.monthlyPayout - monthlyPrincipal);
    const fee = 0;
    const netMonthlyInterest = monthlyInterest - fee;

    const nextDueDate = unpaidSchedulesForInv[0]?.dueDateFormatted || (inv.status === 'Matured' ? 'Matured' : 'Completed');

    return {
      investment: inv,
      currentOutstandingPrincipal,
      monthlyPrincipal,
      monthlyInterest,
      fee,
      netMonthlyInterest,
      nextDueDate,
      actualReceived,
    };
  });

  // Group monthly payouts for Expected vs Actual Graph
  interface MonthGroup {
    key: string; // YYYY-MM
    label: string;
    expected: number;
    actual: number;
    paidCount: number;
    totalCount: number;
  }

  const monthlyGroupMap = new Map<string, MonthGroup>();

  schedules.forEach(s => {
    const d = new Date(s.dueDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;

    const current = monthlyGroupMap.get(key) || {
      key,
      label,
      expected: 0,
      actual: 0,
      paidCount: 0,
      totalCount: 0,
    };

    current.expected += s.totalAmount;
    if (s.status === 'Paid') {
      current.actual += (s.actualPaidAmount || s.totalAmount);
      current.paidCount += 1;
    }
    current.totalCount += 1;

    monthlyGroupMap.set(key, current);
  });

  const sortedMonthGroups = Array.from(monthlyGroupMap.values()).sort((a, b) => a.key.localeCompare(b.key));
  const maxGraphAmount = sortedMonthGroups.reduce((max, g) => Math.max(max, g.expected, g.actual), 0) || 1;

  // Filtered timeline installments
  const filteredSchedules = schedules
    .filter(s => {
      if (statusFilter !== 'All') {
        if (statusFilter === 'Upcoming') {
          if (s.status !== 'Upcoming' && s.status !== 'Scheduled') return false;
        } else if (s.status !== statusFilter) {
          return false;
        }
      }
      if (selectedInvestmentFilter !== 'All' && s.investmentId !== selectedInvestmentFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Portfolio Overview, {currentUser?.name || 'Investor'}
          </h1>
          <p className="text-sm text-emerald-100/90 mt-1.5 max-w-xl">
            Review your peer-funded portfolio, monthly yield distributions, and browse verified borrower opportunities.
          </p>
        </div>

        <Link
          to="/lender/browse"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors shadow-md shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>Browse Marketplace</span>
        </Link>
      </div>

      {/* College Demo 3-Preset Investment Selector (Option 1: ₹5,000, Option 2: ₹10,000, Option 3: ₹20,000) - Demo Account Only */}
      {currentUser?.id === DEMO_LENDER_ID && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Demo Portfolio Model • 3 Presets</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Three Active Preset Investments (₹35,000 Total Portfolio)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any preset to highlight it as your primary selected investment. The other two remain active supporting investments.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 self-start sm:self-center">
              Fixed 9.5% APY • 3-Month Tenure
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              { id: 'INV-401', opt: 'Option 1', amt: 5000, name: 'Commercial Inventory Expansion (Rajesh K.)' },
              { id: 'INV-402', opt: 'Option 2', amt: 10000, name: 'Diagnostic Lab Equipment (Priya Sharma)' },
              { id: 'INV-403', opt: 'Option 3', amt: 20000, name: 'Retail Store Renovation (Sunil Verma)' },
            ].map((preset) => {
              const isSelected = selectedPresetAmt === preset.amt;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPresetAmt(preset.amt);
                    try {
                      sessionStorage.setItem('trustlend_calc_amount', String(preset.amt));
                    } catch {}
                    if (currentUser?.id === DEMO_LENDER_ID) {
                      dbService.syncDemoWalletBalance(preset.amt);
                    }
                  }}
                  className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {preset.opt} • {preset.id}
                      </span>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                          <Check className="w-2.5 h-2.5" />
                          Primary Selected
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          Supporting
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-black text-slate-900 tracking-tight">
                      {formatINR(preset.amt)}
                    </div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      9.5% APY • 3 Months
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium mt-1 truncate">
                      {preset.name}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">Status:</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                      Active Performing
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Key Metrics: Available Wallet, Active Portfolio, Earned Returns, Yield, Projected Cashflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Accurate Available Wallet Balance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Available Wallet Balance
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {formatINR(walletBalance)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Available to deploy or withdraw
            </div>

            {/* Real-time Demo Wallet Slider for instant adjustment */}
            {currentUser?.id === DEMO_LENDER_ID && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                  <span>Slide to adjust wallet:</span>
                  <span className="font-extrabold text-emerald-700">{formatINR(walletBalance)}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="500"
                  value={Math.min(Math.max(walletBalance, 100), 100000)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    dbService.syncDemoWalletBalance(val);
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>₹100</span>
                  <span>₹50k</span>
                  <span>₹1,00,000</span>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsAddWalletModalOpen(true)}
            className="mt-3 w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs"
          >
            + Add to Wallet
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Active Portfolio Value
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatINR(activePortfolioValue)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {activeInvestments.length > 0 
              ? `Across ${activeInvestments.length} active performing micro-loans`
              : '0 active allocations'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Returns Earned (₹)
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            +{formatINR(totalEarned)}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            {totalEarned > 0 ? 'Directly credited to escrow account' : 'No payouts collected yet'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Weighted Average Yield
          </span>
          <div className="text-2xl font-black text-blue-600 mt-2">
            {weightedYield}% Net APY
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalInvested > 0 ? '+3.9% higher than standard Bank FD' : 'Based on funded loan tiers'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Projected Monthly Cashflow
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatINR(totalMonthlyIncome)}
            <span className="text-xs font-normal text-slate-500">/mo</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Principal + Interest distributions
          </div>
        </div>
      </div>

      {/* SEPARATE SECTION: Individual Loan Requests (Kept strictly separate from Marketplace) */}
      <div id="individual-requests" className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Peer Underwriting</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Individual Loan Requests</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Separate from Marketplace
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review direct borrower applications and choose to accept individual requests. Acceptance updates borrower status without immediately deploying funds.
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
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {requestStatusFilter === 'All' ? 'No Individual Loan Requests Submitted Yet' : `No ${requestStatusFilter} Requests`}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When borrowers submit loan requests through their application form, they will appear here for peer review and acceptance.
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
                        req.status === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'Approved'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : req.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {req.status === 'Accepted' && <CheckCircle2 className="w-3 h-3" />}
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

                  {/* Financial Breakdown Chips */}
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
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Monthly EMI</span>
                      <span className="text-sm font-extrabold text-blue-700">{formatINR(req.monthlyEMI)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Area */}
                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0">
                  {req.status === 'Accepted' ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold space-y-0.5 text-right">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold justify-end">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accepted by {req.acceptedByLenderName === currentUser?.name ? 'You' : (req.acceptedByLenderName || 'Lender')}</span>
                      </div>
                      <span className="text-[11px] text-emerald-600 block">
                        Status persisted for borrower dashboard
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

      {/* Review & Acceptance Modal */}
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
                    Review Loan Request
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
            </div>

            {/* Preservation & Scope Disclosure */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
              <span className="font-bold block">Important Notice:</span>
              <p>
                Accepting this request updates the request status to <strong>Accepted</strong> and notifies the borrower on their dashboard. Acceptance alone does not mark the loan as fully funded, deduct funds from your wallet, or activate repayment schedules until the formal funding confirmation.
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

      {/* Next Payout & Expected Returns Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Next Payout Date & Amount
              </span>
              {nextPayout && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  nextPayout.status === 'Due' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {nextPayout.status}
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                {nextPayout ? formatINR(nextPayout.totalAmount) : '₹0'}
              </div>
              <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  {nextPayout 
                    ? `Scheduled for ${nextPayout.dueDateFormatted}`
                    : 'No upcoming payouts scheduled'}
                </span>
              </div>
            </div>
          </div>
          {nextPayout && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Loan: <strong>{nextPayout.purpose}</strong> ({nextPayout.borrowerName})
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Expected Lifetime Returns
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-3">
              +{formatINR(totalExpectedReturns)}
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              Net interest profit generated over full loan tenures
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
            <span>Remaining to collect:</span>
            <strong className="text-slate-900">{formatINR(remainingExpectedReturns)}</strong>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Repayment Realization Rate
            </span>
            <div className="text-2xl font-black text-blue-600 mt-3">
              {schedules.length > 0 
                ? `${Math.round((schedules.filter(s => s.status === 'Paid').length / schedules.length) * 100)}%`
                : '100%'}
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              {schedules.filter(s => s.status === 'Paid').length} of {schedules.length} installments completed
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>e-NACH Automated Mandate Active</span>
          </div>
        </div>
      </div>

      {/* Monthly Expected-vs-Actual Payout Graph */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Monthly Expected vs Actual Payout Graph</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track actual cashflow distributions against expected schedule in INR
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
              <span className="text-slate-600">Expected Payout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span className="text-slate-600">Actual Received</span>
            </div>
          </div>
        </div>

        {sortedMonthGroups.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Payout Data Recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Fund a borrower loan listing from the marketplace to generate scheduled payouts and monitor expected vs actual returns.
            </p>
            <Link
              to="/lender/browse"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Opportunities</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual Bar Chart */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[580px] h-64 flex items-end gap-5 pt-8 pb-4 px-2 border-b border-slate-200">
                {sortedMonthGroups.map((group) => {
                  const expectedHeight = Math.max(4, Math.round((group.expected / maxGraphAmount) * 100));
                  const actualHeight = Math.max(0, Math.round((group.actual / maxGraphAmount) * 100));

                  return (
                    <div
                      key={group.key}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Hover Tooltip */}
                      <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] p-2 rounded-xl shadow-lg pointer-events-none z-20 whitespace-nowrap">
                        <div className="font-bold">{group.label}</div>
                        <div>Expected: {formatINR(group.expected)}</div>
                        <div className="text-emerald-400">Actual: {formatINR(group.actual)}</div>
                      </div>

                      {/* Adjacent Bars */}
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        {/* Expected Bar */}
                        <div
                          style={{ height: `${expectedHeight}%` }}
                          className="w-1/2 max-w-[20px] bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all duration-300 relative"
                          title={`Expected: ${formatINR(group.expected)}`}
                        />
                        {/* Actual Bar */}
                        <div
                          style={{ height: `${actualHeight}%` }}
                          className={`w-1/2 max-w-[20px] rounded-t-md transition-all duration-300 relative ${
                            group.actual > 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-200'
                          }`}
                          title={`Actual: ${formatINR(group.actual)}`}
                        />
                      </div>

                      {/* Month Label */}
                      <span className="text-[11px] font-bold text-slate-600 mt-2 block whitespace-nowrap">
                        {group.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Summary Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
              {sortedMonthGroups.slice(0, 6).map((group) => (
                <div key={group.key} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{group.label}</span>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    Exp: {formatINR(group.expected)}
                  </div>
                  <div className={`text-xs font-extrabold mt-0.5 ${group.actual > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    Act: {formatINR(group.actual)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED SECTION: Monthly Earnings & Payout Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Earnings Intelligence & Portfolio Servicing</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Monthly Earnings & Payout Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Complete visibility into monthly principal amortizations, fixed 9.5% interest distributions, and net receipts across your peer-funded portfolio.
            </p>
          </div>
        </div>

        {/* Subsection 5: Monthly Earnings Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>1. Monthly Earnings Summary</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Aggregated across active investments</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Invested Capital
              </span>
              <div className="text-lg font-black text-slate-900 mt-1.5">
                {formatINR(totalInvested)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Across {investments.length} allocation{investments.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Exp. Monthly Principal
              </span>
              <div className="text-lg font-black text-slate-900 mt-1.5">
                {formatINR(expectedMonthlyPrincipal)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Capital recovery portion
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Exp. Monthly Interest
              </span>
              <div className="text-lg font-black text-emerald-600 mt-1.5">
                +{formatINR(expectedMonthlyInterest)}
              </div>
              <span className="text-[10px] text-emerald-700/80 mt-0.5 block">
                At fixed 9.5% p.a.
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Expected Payout
              </span>
              <div className="text-lg font-black text-blue-700 mt-1.5">
                {formatINR(totalMonthlyIncome)}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Principal + Interest combined
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Platform Servicing Fee
              </span>
              <div className="text-lg font-black text-slate-700 mt-1.5">
                ₹0 <span className="text-xs font-normal text-slate-400">(0.0%)</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                Zero fee for lenders
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Estimated Net Interest
              </span>
              <div className="text-lg font-black text-emerald-700 mt-1.5">
                +{formatINR(netEstimatedInterestRemaining)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Remaining tenure profit
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Repayments Received
              </span>
              <div className="text-lg font-black text-emerald-600 mt-1.5">
                {formatINR(totalRepaymentsActuallyReceived)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Actual settled to escrow
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 col-span-2 sm:col-span-1 lg:col-span-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Next Expected Payout Schedule
              </span>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-base font-black text-slate-900">
                  {nextPayout ? formatINR(nextPayout.totalAmount) : '₹0'}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {nextPayout ? nextPayout.dueDateFormatted : 'None scheduled'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {nextPayout ? `${nextPayout.purpose} (${nextPayout.borrowerName})` : 'All payouts realized or no active loans'}
              </span>
            </div>
          </div>
        </div>

        {/* Subsection 6: Investment-Wise Breakdown */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>2. Investment-Wise Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{investments.length} Active Investments</span>
          </div>

          {investmentBreakdowns.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-xs font-bold text-slate-700">No active investments found</p>
              <p className="text-[11px] text-slate-400">Deploy capital from the marketplace to start earning monthly returns.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3">Investment / Loan</th>
                    <th className="p-3">Invested Amount</th>
                    <th className="p-3">Outstanding Principal</th>
                    <th className="p-3">Rate (Fixed)</th>
                    <th className="p-3">Disbursed / Tenure</th>
                    <th className="p-3">Monthly Principal</th>
                    <th className="p-3">Monthly Interest</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Net Monthly Interest</th>
                    <th className="p-3">Next Payout</th>
                    <th className="p-3">Actual Received</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                  {investmentBreakdowns.map(({ investment: inv, currentOutstandingPrincipal, monthlyPrincipal, monthlyInterest, fee, netMonthlyInterest, nextDueDate, actualReceived }) => {
                    const isSelected = selectedPresetAmt === inv.investedAmount;
                    return (
                    <tr 
                      key={inv.id} 
                      onClick={() => {
                        setSelectedPresetAmt(inv.investedAmount);
                        try {
                          sessionStorage.setItem('trustlend_calc_amount', String(inv.investedAmount));
                        } catch {}
                        if (currentUser?.id === DEMO_LENDER_ID) {
                          dbService.syncDemoWalletBalance(inv.investedAmount);
                        }
                      }}
                      className={`transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50/80 font-bold border-l-4 border-l-emerald-600' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 block">{inv.purpose}</span>
                          {isSelected && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                              Selected
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{inv.id} • {inv.borrowerName}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {formatINR(inv.investedAmount)}
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        {formatINR(currentOutstandingPrincipal)}
                      </td>
                      <td className="p-3 font-bold text-emerald-700">
                        {inv.annualYield}% p.a.
                      </td>
                      <td className="p-3 text-slate-600">
                        <div>{inv.disbursedDate || 'Active'}</div>
                        <div className="text-[10px] text-slate-400">{inv.tenureMonths} Months</div>
                      </td>
                      <td className="p-3 text-slate-700">
                        {formatINR(monthlyPrincipal)}
                      </td>
                      <td className="p-3 font-semibold text-emerald-600">
                        +{formatINR(monthlyInterest)}
                      </td>
                      <td className="p-3 text-slate-400">
                        ₹{fee} (0%)
                      </td>
                      <td className="p-3 font-bold text-emerald-700">
                        +{formatINR(netMonthlyInterest)}
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">
                        {nextDueDate}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {formatINR(actualReceived)}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'Performing'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subsection 7: Monthly Payout Schedule */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>3. Month-by-Month Payout Schedule</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Full amortization breakdown showing opening principal, interest yield, platform fee, and repayment status
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'Due', 'Overdue', 'Upcoming', 'Paid'] as const).map((st) => {
                const count = st === 'All' 
                  ? schedules.length 
                  : schedules.filter(s => (st === 'Upcoming' ? (s.status === 'Upcoming' || s.status === 'Scheduled') : s.status === st)).length;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                      statusFilter === st
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

          {/* Timeline Highlights: Next Payment and Final Repayment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-slate-50 to-purple-50/70 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Next Payment Highlight
                </span>
                <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-2">
                  <span>{nextPayout ? nextPayout.dueDateFormatted : 'All Payouts Received'}</span>
                  {nextPayout && (
                    <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                      {formatINR(nextPayout.totalAmount)} • Inst #{nextPayout.installmentNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Final Repayment Date Highlight
                </span>
                <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-2">
                  <span>{finalPayoutInstallment ? finalPayoutInstallment.dueDateFormatted : '—'}</span>
                  {finalPayoutInstallment && (
                    <span className="text-xs font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                      Inst #{finalPayoutInstallment.installmentNumber} • Maturity
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Investment Selector if multiple */}
          {investments.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Filter by Loan:</span>
              <select
                value={selectedInvestmentFilter}
                onChange={(e) => setSelectedInvestmentFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Loans ({investments.length})</option>
                {investments.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} - {inv.purpose} ({inv.borrowerName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Installment Table */}
          {filteredSchedules.length === 0 ? (
            <div className="py-10 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-200/60 text-slate-400 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {schedules.length === 0 
                  ? 'No payout installments generated yet. Invest in a borrower loan listing to establish a schedule.'
                  : 'No installments match the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-3">Inst #</th>
                    <th className="p-3">Loan / Borrower</th>
                    <th className="p-3">Payout Date</th>
                    <th className="p-3">Opening Principal</th>
                    <th className="p-3">Principal Repayment</th>
                    <th className="p-3">Expected Interest (9.5%)</th>
                    <th className="p-3">Total Expected</th>
                    <th className="p-3">Platform Fee</th>
                    <th className="p-3">Estimated Net Payout</th>
                    <th className="p-3">Actual Received</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Repayment Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  {filteredSchedules.map((inst) => {
                    const fee = inst.applicableFee ?? 0;
                    const netPayout = inst.totalAmount - fee;
                    const opening = inst.openingPrincipal !== undefined ? formatINR(inst.openingPrincipal) : '—';
                    const isNextPayment = nextPayout && inst.id === nextPayout.id;
                    const isFinalRepayment = finalPayoutInstallment && inst.id === finalPayoutInstallment.id;

                    return (
                      <tr 
                        key={inst.id} 
                        className={`transition-colors ${
                          isNextPayment 
                            ? 'bg-blue-50/60 hover:bg-blue-50/90 font-medium' 
                            : isFinalRepayment 
                            ? 'bg-purple-50/40 hover:bg-purple-50/70 font-medium' 
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-slate-700">#{inst.installmentNumber}</span>
                            {isNextPayment && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                                Next Payout
                              </span>
                            )}
                            {isFinalRepayment && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-purple-100 text-purple-800 border border-purple-200">
                                Final Repayment
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{inst.purpose}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {inst.loanId} • {inst.borrowerName}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium whitespace-nowrap">
                          {inst.dueDateFormatted}
                        </td>
                        <td className="p-3 text-slate-600">
                          {opening}
                        </td>
                        <td className="p-3 text-slate-700 font-semibold">
                          {formatINR(inst.principalAmount)}
                        </td>
                        <td className="p-3 font-bold text-emerald-700">
                          +{formatINR(inst.interestAmount)}
                        </td>
                        <td className="p-3 font-extrabold text-blue-700">
                          {formatINR(inst.totalAmount)}
                        </td>
                        <td className="p-3 text-slate-400">
                          ₹{fee} (0%)
                        </td>
                        <td className="p-3 font-extrabold text-emerald-800">
                          {formatINR(netPayout)}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {inst.status === 'Paid' ? formatINR(inst.actualPaidAmount || inst.totalAmount) : '₹0'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              inst.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inst.status === 'Due'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : inst.status === 'Overdue'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {inst.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                            {inst.status === 'Due' && <Clock className="w-3 h-3" />}
                            {inst.status === 'Overdue' && <AlertCircle className="w-3 h-3" />}
                            {(inst.status === 'Upcoming' || inst.status === 'Scheduled') && <Calendar className="w-3 h-3" />}
                            <span>{inst.status === 'Scheduled' ? 'Upcoming' : inst.status}</span>
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {inst.status === 'Paid' ? (
                            <span className="text-xs text-emerald-700 font-medium flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Paid ({inst.paidDate})</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRecordRepayment(inst.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors whitespace-nowrap"
                              title="Record repayment credit for this installment"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Record Repayment</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subsection 9: Platform Fee Transparency Policy */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-extrabold text-slate-900">
              Platform Fee Policy — 0.0% Lender Fee
            </h4>
            <p className="text-slate-600 leading-relaxed">
              TrustLend does not charge lenders any management or servicing fees on loan returns. Platform operations and credit assessments are funded exclusively by borrower origination fees. Gross interest earned at <strong>9.5% p.a.</strong> equals your net interest earnings.
            </p>
          </div>
        </div>
      </div>

      {/* Active Loan Slices List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Active Investment Allocations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified borrower micro-loans generating monthly returns
            </p>
          </div>
          <Link
            to="/lender/investments"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All Allocations</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {investments.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Investment Allocations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any active loan investments in your portfolio yet. Browse verified opportunities in the marketplace to get started.
            </p>
            <Link
              to="/lender/browse"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse Marketplace</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {investments.map((inv) => (
              <div
                key={inv.id}
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{inv.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === 'Performing'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                    <span className="text-xs text-slate-500">Borrower: <strong>{inv.borrowerName}</strong></span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{inv.purpose}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>Tenure: <strong>{inv.tenureMonths} Mo</strong></span>
                    <span>•</span>
                    <span>Yield: <strong className="text-emerald-700">{inv.annualYield}% APY</strong></span>
                    <span>•</span>
                    <span>Next Payout: <strong>{inv.nextPayoutDate}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                      Invested Slice
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      {formatINR(inv.investedAmount)}
                    </span>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                      Monthly Payout
                    </span>
                    <span className="text-base font-extrabold text-emerald-600">
                      {formatINR(inv.monthlyPayout)}
                    </span>
                  </div>

                  <Link
                    to="/lender/returns"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                  >
                    Returns
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add To Wallet Modal */}
      <AddToWalletModal
        isOpen={isAddWalletModalOpen}
        onClose={() => setIsAddWalletModalOpen(false)}
        onSuccess={() => {
          loadData();
          showToast('Wallet balance refreshed successfully');
        }}
      />
    </div>
  );
};
