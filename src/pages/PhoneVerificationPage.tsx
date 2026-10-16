import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Phone, AlertCircle, CheckCircle2, RefreshCw, KeyRound, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuthMock } from '../hooks/useAuthMock';
import { smsVerificationService, SmsProviderConfig } from '../services/smsVerificationService';

export const PhoneVerificationPage: React.FC = () => {
  const { currentUser, refreshUser, logout } = useAuthMock();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [providerConfig, setProviderConfig] = useState<SmsProviderConfig>(() =>
    smsVerificationService.getProviderStatus()
  );

  // If already verified or demo account, redirect immediately
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    const isDemo = currentUser.id === 'usr_demo_borrower' || currentUser.id === 'usr_demo_lender';
    if (isDemo || currentUser.phoneVerified === true) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  // Attempt initial OTP send on mount if provider is configured and not in cooldown
  useEffect(() => {
    if (!currentUser) return;
    const isDemo = currentUser.id === 'usr_demo_borrower' || currentUser.id === 'usr_demo_lender';
    if (isDemo || currentUser.phoneVerified === true) return;

    const status = smsVerificationService.getProviderStatus();
    setProviderConfig(status);

    if (!status.isConfigured) {
      setError(
        status.errorMessage ||
          'SMS Gateway Configuration Error: No active SMS provider credentials found. Live OTP dispatch is disabled until credentials are provided.'
      );
      return;
    }

    const remainingCooldown = smsVerificationService.getRemainingCooldown(currentUser.id);
    if (remainingCooldown > 0) {
      setCooldown(remainingCooldown);
    } else {
      handleSendOtp();
    }
  }, [currentUser]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!currentUser || !currentUser.phone) return;
    setError('');
    setSuccessMsg('');
    setIsSending(true);

    try {
      const res = await smsVerificationService.sendVerificationOtp(currentUser.id, currentUser.phone);
      setCooldown(res.cooldownSeconds);
      setSuccessMsg(`Verification code sent to ${currentUser.phone}. Code is valid for 10 minutes.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification code via SMS provider.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError('');

    const cleaned = code.trim().replace(/\D/g, '');
    if (cleaned.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      await smsVerificationService.verifyOtpCode(currentUser.id, cleaned);
      refreshUser();
      // Redirect to homepage which will show "Choose Your Path" screen
      sessionStorage.removeItem('trustlend_home_selected_path');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shadow-xs">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verify Mobile Number
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Security authorization required before role selection and marketplace access.
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
                  {currentUser?.phone || 'No phone registered'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
              Pending Verification
            </span>
          </div>

          {/* SMS Provider Missing Error Banner */}
          {!providerConfig.isConfigured && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    SMS Gateway Configuration Required
                  </h4>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    Active SMS provider credentials are not configured in the environment. Direct simulation of successful verification is disabled.
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-rose-600 bg-white/70 p-2.5 rounded-xl border border-rose-100 font-mono space-y-1">
                <span className="font-bold block text-slate-700">Missing environment variables:</span>
                {providerConfig.missingVariables.map((v) => (
                  <div key={v} className="flex items-center gap-1.5 text-rose-700">
                    <span>•</span>
                    <code>{v}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Error Notification */}
          {error && providerConfig.isConfigured && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Notification */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* OTP Submission Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Enter 6-Digit One-Time Code *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                disabled={!providerConfig.isConfigured || isVerifying}
                className="w-full py-3 px-4 text-center font-mono font-black text-2xl tracking-[0.4em] rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 block text-center mt-1">
                Single-use code expires in 10 minutes (Max 5 attempts)
              </span>
            </div>

            <button
              type="submit"
              disabled={!providerConfig.isConfigured || code.length !== 6 || isVerifying}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-sm disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code on Backend...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Proceed to Role Selection</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend Cooldown Section */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Didn't receive the SMS code?</span>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={!providerConfig.isConfigured || cooldown > 0 || isSending}
              className="font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
          >
            Cancel and Return to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
