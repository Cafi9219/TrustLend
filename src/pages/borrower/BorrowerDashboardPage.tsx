import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  CreditCard, 
  ArrowUpRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  TrendingUp, 
  AlertCircle,
  Check,
  ChevronRight
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { useAuthMock } from '../../hooks/useAuthMock';
import { dbService } from '../../services/dbService';
import { BorrowerLoan, BorrowerLoanRequest, LoanRequestStatus, PayoutInstallment, PayoutStatus } from '../../types';

export const BorrowerDashboardPage: React.FC = () => {
  const { currentUser } = useAuthMock();
  const location = useLocation();
  const [loans, setLoans] = useState<BorrowerLoan[]>([]);
  const [loanRequests, setLoanRequests] = useState<BorrowerLoanRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState<'All' | 'Pending' | 'Accepted' | 'Funded' | 'Rejected' | 'Completed'>('All');
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [schedules, setSchedules] = useState<PayoutInstallment[]>([]);
  const [statusFilter, setStatusFilter] = useState<'All' | PayoutStatus>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [submissionNotice, setSubmissionNotice] = useState<{ id: string; amount: number; purpose: string } | null>(null);
  const [approvingRequest, setApprovingRequest] = useState<BorrowerLoanRequest | null>(null);
  const [approvalPassword, setApprovalPassword] = useState<string>('');
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  useEffect(() => {
    if (location.state?.loanSubmittedSuccess) {
      setSubmissionNotice({
        id: location.state.requestId || 'REQ-LN',
        amount: location.state.loanAmount || 0,
        purpose: location.state.loanPurpose || 'Loan Request',
      });
      // Clear history state to avoid repeatedly showing on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRequest || !currentUser) return;
    setApprovalError(null);
    setIsApproving(true);
    try {
      await dbService.approveAcceptedLoanRequest({
        requestId: approvingRequest.id,
        borrowerId: currentUser.id,
        password: approvalPassword,
      });
      setToastMessage(`Loan request #${approvingRequest.id} authorized & approved successfully with password verification!`);
      setApprovingRequest(null);
      setApprovalPassword('');
      loadData();
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setApprovalError(err.message || 'Authorization failed. Incorrect account password.');
    } finally {
      setIsApproving(false);
    }
  };

  const loadData = () => {
    if (!currentUser) return;
    const userLoans = dbService.getLoans(currentUser.id);
    setLoans(userLoans);

    const userRequests = dbService.getLoanRequests(currentUser.id);
    setLoanRequests(userRequests);

    const active = userLoans.filter(l => l.status === 'Active');
    const targetLoanId = selectedLoanId || active[0]?.id || userLoans[0]?.id || '';
    if (targetLoanId) {
      if (!selectedLoanId) setSelectedLoanId(targetLoanId);
      const loanScheds = dbService.getRepaymentScheduleForLoan(targetLoanId);
      setSchedules(loanScheds);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [currentUser, selectedLoanId]);

  const handleSelectLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    const loanScheds = dbService.getRepaymentScheduleForLoan(loanId);
    setSchedules(loanScheds);
  };

  const handleRecordPayment = (installmentId: string) => {
    setIsProcessing(installmentId);
    try {
      const updated = dbService.recordPayoutRepayment(installmentId);
      if (updated) {
        setToastMessage(`Payment for Installment #${updated.installmentNumber} of ${formatINR(updated.totalAmount)} recorded successfully as Paid!`);
        loadData();
        setTimeout(() => setToastMessage(null), 3500);
      }
    } finally {
      setIsProcessing(null);
    }
  };

  const activeLoans = loans.filter(l => l.status === 'Active');
  const totalActivePrincipal = activeLoans.reduce((sum, l) => sum + (l.remainingAmount ?? l.amount), 0);
  const nextEMI = activeLoans[0]?.monthlyEMI || 0;
  const nextDueDate = activeLoans[0]?.nextDueDate || (activeLoans.length > 0 ? '10 Oct 2026' : 'No upcoming dues');

  const selectedLoan = loans.find(l => l.id === selectedLoanId) || activeLoans[0] || loans[0];
  const uniqueSchedules = Array.from(new Map(schedules.map(s => [s.id, s])).values());
  const unpaidInstallments = uniqueSchedules
    .filter(s => s.status !== 'Paid')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const nextPayment = unpaidInstallments[0] || null;
  const finalPayment = [...uniqueSchedules].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0] || null;

  const totalPaidAmount = uniqueSchedules
    .filter(s => s.status === 'Paid')
    .reduce((sum, s) => sum + (s.actualPaidAmount || s.totalAmount), 0);

  const filteredSchedules = uniqueSchedules
    .filter(s => {
      if (statusFilter !== 'All') {
        if (statusFilter === 'Upcoming') {
          if (s.status !== 'Upcoming' && s.status !== 'Scheduled') return false;
        } else if (s.status !== statusFilter) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const filteredRequests = loanRequests.filter((req) => {
    if (requestFilter === 'Pending') {
      return req.status === 'Pending' || req.status === 'Pending Review';
    }
    if (requestFilter !== 'All') {
      return req.status === requestFilter;
    }
    return true;
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Banner After Loan Submission */}
      {submissionNotice && (
        <div className="p-5 rounded-3xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 shadow-soft-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900">
                Loan Request Submitted Successfully!
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your loan request <strong className="font-mono">{submissionNotice.id}</strong> for <strong>{formatINR(submissionNotice.amount)}</strong> has been recorded with status <span className="font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">Pending</span>. It is now listed in the lender portal's <strong>Individual Loan Requests</strong> section.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionNotice(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-950 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-200 shrink-0 shadow-2xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.name || 'Borrower'}
          </h1>
          <p className="text-sm text-blue-100/90 mt-1.5 max-w-xl">
            Track your peer micro-loans, monitor upcoming Monthly EMIs, and apply for flexible credit with zero prepayment charges.
          </p>
        </div>

        <Link
          to="/borrower/applications"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-900 font-bold text-sm hover:bg-blue-50 transition-colors shadow-md shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-blue-600" />
          <span>New Loan Application</span>
        </Link>
      </div>

      {/* Key Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Next Monthly EMI Due
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatINR(nextEMI)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{activeLoans.length > 0 ? `Due on ${nextDueDate}` : 'No upcoming dues'}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Outstanding Principal
          </span>
          <div className="text-2xl font-black text-blue-600 mt-2">
            {formatINR(totalActivePrincipal)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {activeLoans.length > 0 
              ? `Across ${activeLoans.length} active micro-loans`
              : '0 active loans'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Credit Health (CIBIL)
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-2 flex items-center gap-2">
            <span>785</span>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              Excellent
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Qualifies for lowest 8.9% - 9.5% p.a. tier
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            e-NACH Auto-Debit
          </span>
          <div className="text-base font-bold text-slate-900 mt-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{loans.length > 0 ? 'Active & Linked' : 'Pre-approved'}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {loans.length > 0 ? 'HDFC Bank (A/C ending in 4109)' : 'Mandate registered on first disbursal'}
          </div>
        </div>
      </div>

      {/* My Loan Requests Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-2">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Application Pipeline</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              My Loan Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track your submitted loan requests, lender acceptance status, and active funding progression.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Pending', 'Accepted', 'Funded', 'Rejected', 'Completed'] as const).map((status) => {
              const count = status === 'All'
                ? loanRequests.length
                : status === 'Pending'
                ? loanRequests.filter((r) => r.status === 'Pending' || r.status === 'Pending Review' || r.status === 'Approved').length
                : loanRequests.filter((r) => r.status === status).length;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRequestFilter(status)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                    requestFilter === status
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {requestFilter === 'All' ? 'No Loan Requests Submitted' : `No ${requestFilter} Requests`}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {requestFilter === 'All'
                ? 'Submit a new micro-loan request to initiate credit review and peer lender matching.'
                : `There are currently no loan requests with status "${requestFilter}".`}
            </p>
            {requestFilter === 'All' && (
              <Link
                to="/borrower/applications"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Loan Request</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const totalRepay = Math.round(req.monthlyEMI * req.tenureMonths);
              return (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {req.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          req.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : req.status === 'Funded'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : req.status === 'Accepted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                        {req.status === 'Funded' && <CheckCircle2 className="w-3 h-3" />}
                        {req.status === 'Accepted' && <CheckCircle2 className="w-3 h-3" />}
                        {req.status === 'Rejected' && <AlertCircle className="w-3 h-3" />}
                        {(req.status === 'Pending' || req.status === 'Pending Review' || req.status === 'Approved') && <Clock className="w-3 h-3" />}
                        <span>{req.status === 'Pending Review' ? 'Pending' : req.status}</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • Submitted on {req.createdAt}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{req.purpose}</h3>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Requested: <strong className="text-slate-900">{formatINR(req.amount)}</strong></span>
                        <span>•</span>
                        <span>Tenure: <strong className="text-slate-900">{req.tenureMonths} Months</strong></span>
                        <span>•</span>
                        <span>Fixed Rate: <strong className="text-emerald-700">{req.interestRate}% p.a.</strong></span>
                        <span>•</span>
                        <span>Monthly EMI: <strong className="text-blue-700">{formatINR(req.monthlyEMI)}</strong></span>
                        <span>•</span>
                        <span>Total Repayment: <strong className="text-slate-900">{formatINR(totalRepay)}</strong></span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                        <span>Category: <strong className="text-slate-600">{req.employmentType || 'Self-Employed'}</strong></span>
                        {req.monthlyIncome ? (
                          <>
                            <span>•</span>
                            <span>Monthly Income: <strong className="text-slate-600">{formatINR(req.monthlyIncome)}</strong></span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Status Helper Callout */}
                    <div className="pt-0.5">
                      {req.status === 'Completed' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Loan fully repaid and successfully completed</span>
                        </div>
                      ) : req.status === 'Funded' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Loan Funded • Repayment schedule active ({req.fundedAt || 'Disbursed'})</span>
                        </div>
                      ) : req.status === 'Accepted' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Accepted by lender {req.acceptedByLenderName || 'Investor'} • Awaiting funding completion</span>
                        </div>
                      ) : (req.status === 'Pending' || req.status === 'Pending Review' || req.status === 'Approved') ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Pending • Submitted and awaiting lender review in Individual Loan Requests</span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col sm:flex-row sm:items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Request Rejected</span>
                          </div>
                          {req.rejectionReason && (
                            <span className="text-rose-600 font-normal sm:pl-1">
                              — {req.rejectionReason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                        Monthly EMI
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {formatINR(req.monthlyEMI)}/mo
                      </span>
                    </div>

                    <Link
                      to={`/borrower/requests/${req.id}`}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs whitespace-nowrap flex items-center gap-1.5"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Loans Overview */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Active Loan Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Peer-funded micro-loans in repayment phase
            </p>
          </div>
          <Link
            to="/borrower/my-loans"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All ({loans.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loans.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Micro-Loans Active</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't requested any loans yet. Apply for a flexible peer-to-peer micro-loan with zero prepayment charges.
            </p>
            <Link
              to="/borrower/applications"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Apply for a Loan</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{loan.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        loan.status === 'Active'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : loan.status === 'Funding'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{loan.purpose}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>Sanctioned: <strong>{formatINR(loan.amount)}</strong></span>
                    <span>•</span>
                    <span>Interest: <strong>{loan.interestRate}% p.a.</strong></span>
                    <span>•</span>
                    <span>Tenure: <strong>{loan.tenureMonths} Months</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                      Monthly EMI
                    </span>
                    <span className="text-base font-extrabold text-blue-600">
                      {formatINR(loan.monthlyEMI)}
                    </span>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                      Remaining
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatINR(loan.remainingAmount)}
                    </span>
                  </div>

                  <Link
                    to="/borrower/repayments"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                  >
                    EMI Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Repayment Schedule & Chronological Monthly Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Amortized Payment Servicing</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Repayment Schedule & Monthly Timeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear, chronological monthly timeline showing EMI breakdown, due dates, principal amortization, and payment statuses.
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
                      ? 'bg-blue-900 text-white shadow-xs'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/80 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Next Payment Highlight
              </span>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {nextPayment ? nextPayment.dueDateFormatted : 'All EMIs Paid'}
              </div>
              <div className="text-xs text-blue-700 font-bold">
                {nextPayment ? `${formatINR(nextPayment.totalAmount)} (Inst #${nextPayment.installmentNumber})` : 'Loan Settled'}
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
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {finalPayment ? finalPayment.dueDateFormatted : '—'}
              </div>
              <div className="text-xs text-purple-700 font-bold">
                {finalPayment ? `Inst #${finalPayment.installmentNumber} • Loan Maturity` : '—'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Total Repaid to Date
              </span>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {formatINR(totalPaidAmount)}
              </div>
              <div className="text-xs text-emerald-700 font-medium">
                {schedules.filter(s => s.status === 'Paid').length} of {schedules.length} installments paid
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Outstanding Principal
              </span>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {formatINR(selectedLoan?.remainingAmount ?? 0)}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {selectedLoan?.status || 'Active'} • 0% Prepayment Penalty
              </div>
            </div>
          </div>
        </div>

        {/* Loan selector if multiple loans */}
        {loans.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Select Loan Schedule:</span>
            <select
              value={selectedLoanId}
              onChange={(e) => handleSelectLoan(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loans.map(loan => (
                <option key={loan.id} value={loan.id}>
                  {loan.id} - {loan.purpose} ({loan.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Chronological Installment Table */}
        {filteredSchedules.length === 0 ? (
          <div className="py-10 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-200/60 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {schedules.length === 0
                ? 'No repayment installments found for this loan. Apply or activate a loan to view the schedule.'
                : 'No installments match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-3">Inst #</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Principal Amount</th>
                  <th className="p-3">Interest (Fixed 9.5%)</th>
                  <th className="p-3">Total Payment (EMI)</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3 text-right">Repayment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                {filteredSchedules.map((inst) => {
                  const isNext = nextPayment && inst.id === nextPayment.id;
                  const isFinal = finalPayment && inst.id === finalPayment.id;

                  return (
                    <tr
                      key={inst.id}
                      className={`transition-colors ${
                        isNext 
                          ? 'bg-blue-50/60 hover:bg-blue-50/90 font-medium' 
                          : isFinal 
                          ? 'bg-purple-50/40 hover:bg-purple-50/70 font-medium' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-slate-700">#{inst.installmentNumber}</span>
                          {isNext && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                              Next Payment
                            </span>
                          )}
                          {isFinal && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-purple-100 text-purple-800 border border-purple-200">
                              Final Repayment
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-semibold whitespace-nowrap">
                        {inst.dueDateFormatted}
                      </td>
                      <td className="p-3 text-slate-700 font-semibold">
                        {formatINR(inst.principalAmount)}
                      </td>
                      <td className="p-3 text-emerald-700 font-semibold">
                        +{formatINR(inst.interestAmount)}
                      </td>
                      <td className="p-3 font-extrabold text-blue-700 text-sm">
                        {formatINR(inst.totalAmount)}
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
                            onClick={() => handleRecordPayment(inst.id)}
                            disabled={isProcessing === inst.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-2xs transition-colors whitespace-nowrap"
                            title="Record EMI payment for this installment"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isProcessing === inst.id ? 'Recording...' : 'Pay EMI'}</span>
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

      {/* Borrower Security Approval Modal (Password authorization required upon loan approval) */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 relative space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Authorize Loan Agreement</h3>
                  <p className="text-xs text-slate-500 font-mono">{approvingRequest.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Confirm your account password to authorize and approve this accepted loan offer.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Loan Purpose:</span>
                <span className="font-semibold text-slate-900">{approvingRequest.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Approved Principal:</span>
                <span className="font-bold text-slate-900">{formatINR(approvingRequest.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tenure & Rate:</span>
                <span className="font-semibold text-slate-900">{approvingRequest.tenureMonths} Mo @ {approvingRequest.interestRate}% p.a.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly EMI:</span>
                <span className="font-bold text-blue-700">{formatINR(approvingRequest.monthlyEMI)}/mo</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Underwritten by:</span>
                <span className="font-semibold text-emerald-800">{approvingRequest.acceptedByLenderName || 'Verified Lender'}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Account Password Authorization *
                </label>
                <input
                  type="password"
                  required
                  value={approvalPassword}
                  onChange={(e) => {
                    setApprovalPassword(e.target.value);
                    setApprovalError(null);
                  }}
                  placeholder="Enter your account password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Demo borrower password: <strong className="text-slate-600">12345</strong>
                </span>
              </div>

              {approvalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{approvalError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingRequest(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApproving}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isApproving ? 'Authorizing...' : 'Authorize & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
