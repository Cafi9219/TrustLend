import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  KeyRound, 
  ArrowRight, 
  ShieldAlert,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuthMock } from '../hooks/useAuthMock';
import { smsVerificationService, SmsProviderConfig } from '../services/smsVerificationService';
import { mockAuthService } from '../services/mockAuthService';
import { User } from '../types';

export const PhoneVerificationPage: React.FC = () => {
  const { currentUser, refreshUser, completeLogin2fa, logout } = useAuthMock();
  const navigate = useNavigate();
  const location = useLocation();

  const stateData = location.state as {
    mode?: 'registration' | 'login_2fa';
    pendingUser?: {
      userId: string;
      email: string;
      phone: string;
      phoneDialCode?: string;
      phoneRegion?: string;
      name?: string;
    };
  } | null;

  const storedPending = mockAuthService.getPending2fa();
  const is2faMode = stateData?.mode === 'login_2fa' || Boolean(storedPending);
  const pendingUser = stateData?.pendingUser || storedPending;

  const activeUserId = currentUser?.id || pendingUser?.userId;
  const activePhone = currentUser?.phone || pendingUser?.phone;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [providerConfig, setProviderConfig] = useState<SmsProviderConfig>(() =>
    smsVerificationService.getProviderStatus()
  );

  // Guard: if no active user or pending 2FA session, redirect to login
  useEffect(() => {
    if (!currentUser && !pendingUser) {
      navigate('/login', { replace: true });
      return;
    }

    // Demo accounts bypass phone verification
    if (currentUser?.isTestAccount || currentUser?.id === 'usr_demo_borrower' || currentUser?.id === 'usr_demo_lender') {
      navigate('/', { replace: true });
    }
  }, [currentUser, pendingUser, navigate]);

  // Initial OTP dispatch / cooldown check on mount
  useEffect(() => {
    if (!activeUserId || !activePhone) return;

    const status = smsVerificationService.getProviderStatus();
    setProviderConfig(status);

    if (!status.isConfigured) {
      setError(
        status.errorMessage ||
          'SMS Gateway Configuration Error: No active SMS provider credentials found. Live OTP dispatch is disabled until credentials are provided.'
      );
      return;
    }

    const remainingCooldown = smsVerificationService.getRemainingCooldown(activeUserId);
    if (remainingCooldown > 0) {
      setCooldown(remainingCooldown);
    } else {
      handleSendOtp();
    }
  }, [activeUserId]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!activeUserId || !activePhone) return;
    setError('');
    setSuccessMsg('');
    setIsSending(true);

    try {
      const res = await smsVerificationService.sendVerificationOtp(activeUserId, activePhone);
      setCooldown(res.cooldownSeconds);
      setSuccessMsg(`Verification code dispatched to ${activePhone}. Code is valid for 10 minutes.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification code via SMS provider.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUserId) return;
    setError('');

    const cleaned = code.trim().replace(/\D/g, '');
    if (cleaned.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      let verifiedUser: User | null = null;

      if (is2faMode) {
        verifiedUser = await completeLogin2fa(activeUserId, cleaned);
      } else {
        await smsVerificationService.verifyOtpCode(activeUserId, cleaned);
        refreshUser();
        verifiedUser = mockAuthService.getCurrentUser();
      }

      if (!verifiedUser) {
        navigate('/login', { replace: true });
        return;
      }

      // Check next onboarding / access state
      if (verifiedUser.identityStatus !== 'verified' && verifiedUser.identityStatus !== 'demo_verified') {
        navigate('/verify-identity', { replace: true });
      } else if (verifiedUser.roleSelected === false) {
        sessionStorage.removeItem('trustlend_home_selected_path');
        navigate('/', { replace: true });
      } else {
        navigate(verifiedUser.role === 'borrower' ? '/borrower/dashboard' : '/lender/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = async () => {
    mockAuthService.clearPending2fa();
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shadow-xs">
            {is2faMode ? <Lock className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {is2faMode ? 'Two-Factor Authentication (2FA)' : 'Verify Mobile Number'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {is2faMode
              ? 'Enter the 6-digit authentication code sent to your registered mobile phone to authorize this login session.'
              : 'Security authorization required before identity verification and marketplace access.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-soft-lg space-y-5">
          {/* Registered Phone Display */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
                  Registered Mobile
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {activePhone || 'No phone registered'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
              {is2faMode ? '2FA Check' : 'Pending Verification'}
            </span>
          </div>

          {/* Configuration Missing Alert Banner */}
          {!providerConfig.isConfigured && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-700">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>SMS Provider Required</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                {providerConfig.errorMessage}
              </p>
              <div className="text-[11px] text-rose-600 font-mono mt-1 pt-1 border-t border-rose-200">
                Missing: {providerConfig.missingVariables.join(', ')}
              </div>
            </div>
          )}

          {/* Success Message Banner */}
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* OTP Input Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <span className="text-[11px] text-slate-500">Expires in 10 minutes</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                disabled={isVerifying || !providerConfig.isConfigured}
                className="w-full text-center text-2xl tracking-[0.4em] font-mono font-bold py-3.5 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Resend Action */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Didn't receive the SMS?</span>
              {cooldown > 0 ? (
                <span className="text-slate-400 font-medium">
                  Resend in <strong className="text-slate-600">{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSending || !providerConfig.isConfigured}
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isVerifying || code.trim().length !== 6 || !providerConfig.isConfigured}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:scale-[0.99] disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code on Backend...</span>
                </>
              ) : (
                <>
                  <span>{is2faMode ? 'Verify 2FA & Log In' : 'Verify Phone & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Back/Cancel */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel & Return to Login</span>
            </button>
            <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SHA-256 Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
