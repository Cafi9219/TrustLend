import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Send, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Calculator, 
  UserCheck, 
  Briefcase,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { calculateLoanSimulation, formatINR } from '../../utils/formatters';
import { dbService } from '../../services/dbService';
import { useAuthMock } from '../../hooks/useAuthMock';

export const LoanApplicationsPage: React.FC = () => {
  const { currentUser } = useAuthMock();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Read loan amount and tenure already configured in the existing calculator
  const getInitialAmount = (): number => {
    if (location.state?.requestedAmount && typeof location.state.requestedAmount === 'number') {
      return location.state.requestedAmount;
    }
    try {
      const saved = sessionStorage.getItem('trustlend_calc_amount');
      if (saved) {
        const n = Number(saved);
        if (n >= 100 && n <= 100000) return n;
      }
    } catch {}
    return 25000;
  };

  const getInitialTenure = (): number => {
    if (location.state?.requestedTenure && typeof location.state.requestedTenure === 'number') {
      return location.state.requestedTenure;
    }
    try {
      const saved = sessionStorage.getItem('trustlend_calc_months');
      if (saved) {
        const n = Number(saved);
        if (n >= 1 && n <= 60) return n;
      }
    } catch {}
    return 12;
  };

  const [amount] = useState<number>(getInitialAmount);
  const [tenure] = useState<number>(getInitialTenure);
  const fixedRate = 9.5;

  // 2. Information to collect from borrower (if not in profile)
  const [purpose, setPurpose] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<string>('Self-Employed / Business');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('65000');

  // 3. Password Authentication Modal State (modal triggered upon clicking submit)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [modalPassword, setModalPassword] = useState<string>('');
  const [showModalPassword, setShowModalPassword] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const simulation = calculateLoanSimulation(amount, tenure);

  // 1. Borrower clicks Submit Loan Request on the form
  const handleInitiateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentUser) {
      setErrorMessage('Please sign in to submit a loan application.');
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage('Please state the specific purpose for this micro-loan.');
      return;
    }

    // Open password authentication modal
    setModalPassword('');
    setModalError(null);
    setIsPasswordModalOpen(true);
  };

  // 2. Borrower verifies password inside the modal
  const handleConfirmPasswordAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!modalPassword.trim()) {
      setModalError('Please enter your account password.');
      return;
    }

    if (!currentUser) {
      setModalError('User session not found. Please log in again.');
      return;
    }

    setIsVerifying(true);

    try {
      // Validate password using existing authentication system
      const isVerified = await dbService.verifyLenderPassword(currentUser.id, modalPassword);
      if (!isVerified) {
        setIsVerifying(false);
        setModalError('Incorrect password. Please try again.');
        // Note: form details remain completely intact for retry
        return;
      }

      // 3. Save request persistently in the existing database with status Pending
      const newRequest = dbService.createLoanRequest({
        userId: currentUser.id,
        borrowerName: currentUser.name,
        borrowerEmail: currentUser.email,
        purpose: purpose.trim(),
        amount,
        tenureMonths: tenure,
        employmentType,
        monthlyIncome: Number(monthlyIncome) || undefined,
        interestRate: fixedRate,
      });

      setIsVerifying(false);
      setIsPasswordModalOpen(false);
      setModalPassword('');

      // Redirect borrower to dashboard with confirmation message
      navigate('/borrower/dashboard', {
        state: {
          loanSubmittedSuccess: true,
          requestId: newRequest.id,
          loanAmount: amount,
          loanPurpose: purpose.trim()
        }
      });
    } catch (err: any) {
      setIsVerifying(false);
      setModalError(err.message || 'Verification error. Please try again.');
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/borrower/dashboard" className="hover:text-blue-600 transition-colors">
              Borrower Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-600">Apply for Loan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Borrower Loan Application
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your pre-selected loan terms, provide essential details, and submit your loan request.
          </p>
        </div>

        <Link
          to="/borrower/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Loan Application Form */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 md:p-10 shadow-soft space-y-6">
          <form onSubmit={handleInitiateSubmission} className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span>Application Details</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                Peer-to-Peer Micro-Credit
              </span>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SECTION 1: Pre-selected Calculator Parameters (Read-only, do not ask borrower to select again) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Selected Loan Parameters (From Calculator)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Fixed Selection
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Loan Capital</span>
                  <span className="text-base font-extrabold text-slate-900">{formatINR(amount)}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Tenure</span>
                  <span className="text-base font-extrabold text-slate-900">{tenure} Months</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Annual Rate</span>
                  <span className="text-base font-extrabold text-emerald-700">{fixedRate}% p.a.</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Monthly EMI</span>
                  <span className="text-base font-extrabold text-blue-700">{formatINR(simulation.monthlyEMI)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-blue-900/80">
                <span>Total Repayment across {tenure} months: <strong>{formatINR(simulation.totalRepayment)}</strong></span>
                <Link to="/" className="text-blue-600 hover:underline font-semibold text-[11px]">
                  Change in Calculator
                </Link>
              </div>
            </div>

            {/* SECTION 2: Borrower Account Information (Already saved in profile - Read-only) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Applicant Profile (Verified Account)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Borrower Name</span>
                  <span className="text-xs font-bold text-slate-800">{currentUser?.name || 'Borrower'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Registered Mobile</span>
                  <span className="text-xs font-bold text-slate-800">{currentUser?.phone || '+91 98765 43210'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">KYC Verification</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Verified (Aadhaar / PAN)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 3: Essential Information to Collect */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Loan Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Commercial Inventory Expansion / Working Capital"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Employment Category *
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Self-Employed / Business</option>
                    <option>Salaried Professional</option>
                    <option>Freelancer / Micro-Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Net Monthly Income (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="65000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Action: Submit Loan Request Button */}
            <button
              type="submit"
              className="w-full py-4 px-5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2 text-sm active:scale-[0.99] cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Loan Request</span>
            </button>
          </form>
        </div>
      </div>

      {/* Password Authentication Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-modal-title"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 id="password-modal-title" className="text-base font-bold text-slate-900">
                  Account Security Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Enter your password to authorize this loan request
                </p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmPasswordAndSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Account Password *
                </label>
                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    disabled={isVerifying}
                    value={modalPassword}
                    onChange={(e) => {
                      setModalPassword(e.target.value);
                      setModalError(null);
                    }}
                    placeholder="Enter account password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label="Toggle password visibility"
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Default demo password: <strong className="text-slate-600">12345</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setModalError(null);
                    setModalPassword('');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-xs disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 active:scale-[0.99]"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize & Submit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
