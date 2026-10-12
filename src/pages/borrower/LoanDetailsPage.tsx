import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ShieldCheck, 
  Briefcase, 
  DollarSign, 
  FileText, 
  User, 
  ChevronRight,
  TrendingUp,
  Percent,
  Check
} from 'lucide-react';
import { formatINR, formatPercent } from '../../utils/formatters';
import { dbService } from '../../services/dbService';
import { useAuthMock } from '../../hooks/useAuthMock';
import { BorrowerLoanRequest, PayoutInstallment, BorrowerLoan } from '../../types';

export const LoanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthMock();

  const [request, setRequest] = useState<BorrowerLoanRequest | null>(null);
  const [matchingLoan, setMatchingLoan] = useState<BorrowerLoan | null>(null);
  const [schedules, setSchedules] = useState<PayoutInstallment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    if (!id || !currentUser) return;
    const allRequests = dbService.getAllLoanRequests();
    const req = allRequests.find(r => r.id === id && r.userId === currentUser.id);

    if (req) {
      setRequest(req);
      // Check if this request has a corresponding loan record or is funded
      const allLoans = dbService.getLoans(currentUser.id);
      const loan = allLoans.find(l => 
        (req.loanId && l.id === req.loanId) || 
        l.id === `LN-REQ-${req.id.replace('REQ-', '')}` ||
        l.purpose.toLowerCase() === req.purpose.toLowerCase()
      );
      setMatchingLoan(loan || null);

      // If funded, fetch repayment schedule
      if (req.status === 'Funded' || req.status === 'Completed' || (loan && (loan.status === 'Active' || loan.status === 'Completed'))) {
        const targetLoanId = loan ? loan.id : (req.loanId || `LN-REQ-${req.id.replace('REQ-', '')}`);
        const scheds = dbService.getRepaymentScheduleForLoan(targetLoanId);
        setSchedules(scheds);
      } else {
        setSchedules([]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [id, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Loan Request Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested loan application could not be found or does not belong to your account.
        </p>
        <Link
          to="/borrower/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const isFunded = request.status === 'Funded' || request.status === 'Completed' || (matchingLoan && (matchingLoan.status === 'Active' || matchingLoan.status === 'Completed'));
  const isAccepted = request.status === 'Accepted';
  const isRejected = request.status === 'Rejected';
  const isPending = request.status === 'Pending' || request.status === 'Pending Review' || request.status === 'Approved';

  // Repayment Schedule Calculations (Source of truth from persisted records)
  const totalRepayment = Math.round(request.monthlyEMI * request.tenureMonths);
  const totalInterest = Math.round(totalRepayment - request.amount);

  const paidInstallments = schedules.filter(s => s.status === 'Paid');
  const totalPaidAmount = paidInstallments.reduce((sum, s) => sum + (s.actualPaidAmount || s.totalAmount), 0);
  const totalPrincipalRepaid = paidInstallments.reduce((sum, s) => sum + s.principalAmount, 0);
  const outstandingPrincipal = isFunded 
    ? Math.max(0, request.amount - totalPrincipalRepaid)
    : request.amount;

  const unpaidSchedules = schedules
    .filter(s => s.status !== 'Paid')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  const nextInstallment = unpaidSchedules[0] || null;
  const isCompleted = isFunded && schedules.length > 0 && unpaidSchedules.length === 0;

  // Stages definition for visual lifecycle
  const stages = [
    { 
      number: 1, 
      label: 'Application Submitted', 
      desc: `Submitted on ${request.createdAt}`,
      isDone: true,
      isCurrent: isPending && !isAccepted
    },
    { 
      number: 2, 
      label: 'Under Lender Review', 
      desc: isAccepted || isFunded ? 'Review completed' : 'Awaiting lender review in Individual Loan Requests',
      isDone: isAccepted || isFunded || isCompleted,
      isCurrent: isPending
    },
    { 
      number: 3, 
      label: 'Accepted by Lender', 
      desc: isAccepted 
        ? `Accepted by ${request.acceptedByLenderName || 'Investor'} • Awaiting funding` 
        : isFunded 
        ? `Accepted by ${request.acceptedByLenderName || 'Investor'}` 
        : 'Pending lender acceptance',
      isDone: isAccepted || isFunded || isCompleted,
      isCurrent: isAccepted
    },
    { 
      number: 4, 
      label: 'Loan Funded', 
      desc: isFunded ? `Disbursed on ${request.fundedAt || matchingLoan?.disbursedDate || 'Funding Date'}` : 'Awaiting capital disbursement',
      isDone: isFunded || isCompleted,
      isCurrent: isFunded && !isCompleted && paidInstallments.length === 0
    },
    { 
      number: 5, 
      label: 'EMI Repayments in Progress', 
      desc: isFunded 
        ? (isCompleted ? 'All installments repaid' : `${paidInstallments.length} of ${schedules.length} installments paid`)
        : 'Repayment schedule inactive until funded',
      isDone: isCompleted,
      isCurrent: isFunded && !isCompleted && paidInstallments.length > 0
    },
    { 
      number: 6, 
      label: 'Loan Completed', 
      desc: isCompleted ? 'All obligations settled' : 'Matures after final installment',
      isDone: isCompleted,
      isCurrent: isCompleted
    },
  ];

  const handlePayInstallment = (installmentId: string) => {
    try {
      const updated = dbService.recordPayoutRepayment(installmentId);
      if (updated) {
        setToastMessage(`Payment of ${formatINR(updated.totalAmount)} recorded successfully!`);
        loadData();
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (e: any) {
      setToastMessage(e.message || 'Failed to record repayment.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Breadcrumb & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/borrower/dashboard" className="hover:text-blue-600 transition-colors">
              Borrower Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">My Loan Requests</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-600 font-mono">{request.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Loan Details & Lifecycle</span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                request.status === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : request.status === 'Funded'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : request.status === 'Accepted'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : request.status === 'Rejected'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {request.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {request.status === 'Funded' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {request.status === 'Accepted' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {request.status === 'Rejected' && <AlertCircle className="w-3.5 h-3.5" />}
              {isPending && <Clock className="w-3.5 h-3.5" />}
              <span>{request.status}</span>
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive lifecycle tracking, lender matching progress, and monthly EMI amortization schedule.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/borrower/dashboard')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs self-start cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* A. Loan Summary Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Loan Application Summary</span>
          </h2>
          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            Request ID: {request.id}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Loan Capital
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatINR(request.amount)}
            </div>
            <span className="text-[11px] text-slate-500">Requested Amount</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tenure
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {request.tenureMonths} Months
            </div>
            <span className="text-[11px] text-slate-500">Fixed Term</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Annual Rate
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {request.interestRate}% p.a.
            </div>
            <span className="text-[11px] text-slate-500">Fixed APR</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Monthly EMI
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-700">
              {formatINR(request.monthlyEMI)}
            </div>
            <span className="text-[11px] text-slate-500">Per Month</span>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 block font-medium">Loan Purpose</span>
            <p className="font-bold text-slate-900 text-sm">{request.purpose}</p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 block font-medium">Applicant Details</span>
            <p className="font-semibold text-slate-800">
              {request.borrowerName} • {request.employmentType || 'Self-Employed'}
            </p>
            {request.monthlyIncome && (
              <span className="text-slate-500 block">
                Net Monthly Income: {formatINR(request.monthlyIncome)}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 block font-medium">Financial Obligations</span>
            <p className="font-semibold text-slate-800">
              Total Repayment: <strong className="text-slate-900">{formatINR(totalRepayment)}</strong>
            </p>
            <span className="text-slate-500 block">
              Total Interest Payable: <strong>{formatINR(totalInterest)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* B. Application Progress Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Application Progress Lifecycle</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {isRejected ? 'Application Terminated' : `Current Status: ${request.status}`}
          </span>
        </div>

        {isRejected ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Application Rejected</span>
            </div>
            <p className="text-xs text-rose-700 pl-7">
              {request.rejectionReason || 'This loan request has been rejected during credit assessment and is ineligible for lender matching.'}
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stages.map((stage) => {
                return (
                  <div
                    key={stage.number}
                    className={`p-4 rounded-2xl border transition-all ${
                      stage.isCurrent
                        ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
                        : stage.isDone
                        ? 'bg-slate-50 border-emerald-200'
                        : 'bg-white border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            stage.isDone
                              ? 'bg-emerald-600 text-white'
                              : stage.isCurrent
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {stage.isDone ? <Check className="w-3.5 h-3.5" /> : stage.number}
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          {stage.label}
                        </span>
                      </div>
                      {stage.isCurrent && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 pl-8 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* C & E. Monthly EMI Repayment Schedule & Repayment Summary */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Monthly EMI Repayment Schedule</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard fixed-rate amortized monthly installment timeline.
            </p>
          </div>
          {isFunded && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
              Schedule Active • e-NACH Mandate Linked
            </span>
          )}
        </div>

        {!isFunded ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Repayment Schedule Awaiting Loan Funding
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {isAccepted
                ? 'A lender has accepted this request. Once the funding operation is confirmed, the repayment schedule will activate automatically with the first EMI due exactly one calendar month after the funding date.'
                : 'This loan application is currently awaiting lender review and acceptance. The official repayment schedule will become active once the loan is funded.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* E. Repayment Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Repayment</span>
                <span className="text-base font-extrabold text-slate-900">{formatINR(totalRepayment)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Interest: {formatINR(totalInterest)}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Principal Repaid</span>
                <span className="text-base font-extrabold text-emerald-700">{formatINR(totalPrincipalRepaid)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Paid to Date: {formatINR(totalPaidAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Outstanding Principal</span>
                <span className="text-base font-extrabold text-blue-700">{formatINR(outstandingPrincipal)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {schedules.length > 0 ? `${schedules.length - paidInstallments.length} EMIs remaining` : '0 remaining'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Next EMI Due</span>
                <span className="text-base font-extrabold text-slate-900">
                  {nextInstallment ? formatINR(nextInstallment.totalAmount) : 'Completed'}
                </span>
                <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                  {nextInstallment ? nextInstallment.dueDateFormatted : 'All paid'}
                </span>
              </div>
            </div>

            {/* Installments Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">EMI Due Date</th>
                    <th className="py-3 px-4 text-right">Opening Principal</th>
                    <th className="py-3 px-4 text-right">Principal</th>
                    <th className="py-3 px-4 text-right">Interest</th>
                    <th className="py-3 px-4 text-right">Total EMI</th>
                    <th className="py-3 px-4 text-right">Remaining Principal</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.map((inst) => {
                    const remainingAfter = Math.max(0, (inst.openingPrincipal ?? 0) - inst.principalAmount);
                    return (
                      <tr key={inst.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">
                          {inst.installmentNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {inst.dueDateFormatted}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {formatINR(inst.openingPrincipal ?? 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-700">
                          {formatINR(inst.principalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          {formatINR(inst.interestAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-blue-700">
                          {formatINR(inst.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {formatINR(remainingAfter)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              inst.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inst.status === 'Due'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : inst.status === 'Overdue'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {inst.status === 'Paid' && <CheckCircle2 className="w-2.5 h-2.5" />}
                            <span>{inst.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {inst.status !== 'Paid' ? (
                            <button
                              type="button"
                              onClick={() => handlePayInstallment(inst.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              Pay EMI
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600">
                              Paid on {inst.paidDate || inst.dueDateFormatted}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
