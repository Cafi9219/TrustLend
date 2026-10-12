import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Coins, 
  TrendingUp, 
  UserCheck, 
  Layers, 
  ArrowUpRight,
  FileText
} from 'lucide-react';
import { useAuthMock } from '../hooks/useAuthMock';
import { ForgotPasswordModal } from '../components/modals/ForgotPasswordModal';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const stateData = location.state as { registeredEmail?: string; message?: string } | null;

  const [activeTab, setActiveTab] = useState<'account' | 'demo'>('account');
  const [email, setEmail] = useState(stateData?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [role, setRole] = useState<UserRole>('borrower');
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState(stateData?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingTarget, setSubmittingTarget] = useState<'account' | 'borrower' | 'lender' | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login } = useAuthMock();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Please enter your password (minimum 4 characters).');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmittingTarget('account');
      const user = await login({ email, password, rememberMe, role });
      const isDemo = user.id === 'usr_demo_lender' || user.id === 'usr_demo_borrower' || !!user.isTestAccount;
      if (isDemo) {
        if (user.role === 'lender') {
          navigate('/lender/dashboard', { replace: true });
        } else {
          navigate('/borrower/dashboard', { replace: true });
        }
      } else {
        // Regular user: Sign In → Choose Your Path
        sessionStorage.removeItem('trustlend_home_selected_path');
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
      setSubmittingTarget(null);
    }
  };

  const handleQuickDemo = async (selectedRole: UserRole) => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    setSubmittingTarget(selectedRole);

    try {
      const demoEmail = selectedRole === 'borrower'
        ? 'rohan.borrower@trustlend.in'
        : 'ananya.lender@trustlend.in';

      const user = await login({
        email: demoEmail,
        password: '12345',
        role: selectedRole,
      });

      // Demo Borrower opens calculator directly in Borrower mode
      // Demo Lender opens calculator directly in Lender mode
      navigate('/', {
        replace: true,
        state: { mode: selectedRole === 'borrower' ? 'borrow' : 'lend' }
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with demo account.');
    } finally {
      setIsSubmitting(false);
      setSubmittingTarget(null);
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-4">
      <div className="max-w-xl w-full space-y-5">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to TrustLend
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Direct peer-to-peer micro-lending & transparent monthly cashflow in India
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="relative p-1.5 bg-slate-100 rounded-2xl flex items-center border border-slate-200/80 max-w-sm mx-auto shadow-2xs">
          {/* Sliding Pill Indicator */}
          <div
            className={`absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-sm border border-slate-200/50 transition-all duration-300 ease-out motion-reduce:transition-none ${
              activeTab === 'account' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[calc(50%+1.5px)] w-[calc(50%-6px)]'
            }`}
          />

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`relative flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors duration-200 flex items-center justify-center gap-1.5 z-10 ${
              activeTab === 'account' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Account Login</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`relative flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors duration-200 flex items-center justify-center gap-1.5 z-10 ${
              activeTab === 'demo' ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Try Demo</span>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full hidden sm:inline">
              1-Click
            </span>
          </button>
        </div>

        {/* Main Card with Smooth Animated Mode Transition */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft-lg relative transition-all duration-300 ease-out">
          {successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: Account Login */}
          {activeTab === 'account' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
              <div className="pb-2 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Sign In to Your Account</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered credentials to access your personal dashboard & calculator
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300"
                    />
                    <span className="text-slate-600 font-medium">Keep me signed in</span>
                  </label>
                  <span className="text-slate-400 text-xs">Escrow Protected</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-bold text-white transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] motion-reduce:transform-none"
                >
                  {isSubmitting && submittingTarget === 'account' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Mode 2: Try Demo */}
          {activeTab === 'demo' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
              <div className="pb-2 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Explore Pre-Configured Demo Accounts</span>
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    No Setup
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click either profile to sign in instantly and explore realistic workflows, loans, and yield returns.
                </p>
              </div>

              {/* Demo Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Demo Borrower Card */}
                <div className="p-5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 hover:border-blue-500 hover:shadow-soft transition-all duration-200 flex flex-col justify-between space-y-4 group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Borrower
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                        Demo Borrower
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">
                        Rohan Mehra • Café Owner
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Pre-seeded with 4 active micro-loans, automated e-NACH debits, CIBIL 785 score, and loan request pipeline.
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        4 Active Loans
                      </span>
                      <span className="text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        ₹1,06,250 Principal
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('borrower')}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.99] motion-reduce:transform-none"
                  >
                    {isSubmitting && submittingTarget === 'borrower' ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Launching Borrower Mode...</span>
                      </span>
                    ) : (
                      <>
                        <span>Login as Demo Borrower</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform motion-reduce:transform-none" />
                      </>
                    )}
                  </button>
                </div>

                {/* Demo Lender Card */}
                <div className="p-5 rounded-2xl border-2 border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 hover:border-emerald-500 hover:shadow-soft transition-all duration-200 flex flex-col justify-between space-y-4 group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Lender
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Demo Lender
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">
                        Ananya Roy • Portfolio Investor
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Pre-seeded with ₹90,000 deployed portfolio, 48 monthly payout installments, repayment timeline, and cashflow graph.
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        ₹90,000 Portfolio
                      </span>
                      <span className="text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        10.4% Net APY
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('lender')}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.99] motion-reduce:transform-none"
                  >
                    {isSubmitting && submittingTarget === 'lender' ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Launching Lender Mode...</span>
                      </span>
                    ) : (
                      <>
                        <span>Login as Demo Lender</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform motion-reduce:transform-none" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 text-center">
                Demo accounts operate in isolated sandbox mode with seeded mock loans and cashflow ledgers.
              </div>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs sm:text-sm text-slate-500">
          New to TrustLend?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800 underline">
            Create an Account
          </Link>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        defaultEmail={email}
      />
    </div>
  );
};
