import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Info,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuthMock } from '../hooks/useAuthMock';
import { 
  identityVerificationService, 
  getIdentityProviderConfig, 
  getSimulatedDemoIdentity, 
  validateAge, 
  maskIdNumber, 
  IdentityProviderConfig 
} from '../services/identityVerificationService';
import { DEMO_BORROWER_ID, DEMO_LENDER_ID } from '../services/dbService';

export const IdentityVerificationPage: React.FC = () => {
  const { currentUser, refreshUser } = useAuthMock();
  const navigate = useNavigate();

  const isDemoUser = Boolean(
    currentUser?.id === DEMO_BORROWER_ID ||
    currentUser?.id === DEMO_LENDER_ID ||
    currentUser?.isTestAccount
  );

  const [providerConfig] = useState<IdentityProviderConfig>(() =>
    getIdentityProviderConfig()
  );

  // Form fields
  const [legalFullName, setLegalFullName] = useState(currentUser?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [idType, setIdType] = useState<'national_id' | 'passport' | 'drivers_license'>('national_id');
  const [idNumber, setIdNumber] = useState('');
  const [livenessConfirmed, setLivenessConfirmed] = useState(true);
  const [documentFileName, setDocumentFileName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Auto-prefill simulated identity details for Demo accounts
  useEffect(() => {
    if (isDemoUser && currentUser) {
      const demoData = getSimulatedDemoIdentity(currentUser.id);
      setLegalFullName(demoData.legalFullName);
      setDateOfBirth(demoData.dateOfBirth);
      setIdType(demoData.idType);
      setIdNumber(demoData.idNumberMasked);
      setDocumentFileName('simulated_government_id_scan.png');
      setLivenessConfirmed(true);
    }
  }, [isDemoUser, currentUser]);

  // If user is not logged in, redirect to login
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleDemoVerify = async () => {
    if (!currentUser) return;
    setError('');
    setIsSubmitting(true);

    try {
      const res = await identityVerificationService.submitDemoVerification(currentUser.id);
      if (res.success) {
        refreshUser();
        setSuccessNotice('Simulated demo verification successful. Redirecting to Choose Your Path...');
        setTimeout(() => {
          sessionStorage.removeItem('trustlend_home_selected_path');
          navigate('/', { replace: true });
        }, 800);
      } else {
        setError(res.error || 'Failed to complete demo verification.');
      }
    } catch (err: any) {
      setError(err?.message || 'Demo verification error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegularVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError('');
    setSuccessNotice('');

    // Field validations
    if (!legalFullName.trim()) {
      setError('Please provide your legal full name as shown on your government ID.');
      return;
    }

    const ageCheck = validateAge(dateOfBirth);
    if (!ageCheck.isValid) {
      setError(ageCheck.error || 'Invalid date of birth.');
      return;
    }

    if (!idNumber.trim()) {
      setError('Please enter your government ID number.');
      return;
    }

    if (!providerConfig.isConfigured) {
      setError(
        providerConfig.errorMessage ||
        'Identity Verification Provider Configuration Required: No active identity verification provider API key configured. Direct simulation is disabled for regular accounts.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await identityVerificationService.submitRegularUserVerification(currentUser.id, {
        legalFullName,
        dateOfBirth,
        idType,
        idNumber,
        documentFileName,
        livenessConfirmed,
      });

      if (res.success && res.status === 'verified') {
        refreshUser();
        setSuccessNotice('Identity verification confirmed by provider! Redirecting to Choose Your Path...');
        setTimeout(() => {
          sessionStorage.removeItem('trustlend_home_selected_path');
          navigate('/', { replace: true });
        }, 800);
      } else {
        setError(res.error || 'Identity verification could not be confirmed by the provider.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please review your details and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadyVerified = 
    currentUser?.identityStatus === 'verified' || 
    currentUser?.identityStatus === 'demo_verified';

  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Account-Linked Identity Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verify Your Legal Identity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Direct peer-to-peer lending requires verified, accountable identities to protect capital, prevent identity fraud, and ensure borrower/lender safety.
          </p>
        </div>

        {/* Demo Callout vs Production Notice */}
        {isDemoUser ? (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Simulated Demo Environment — Not a Real Government ID Check</span>
            </div>
            <p className="text-xs text-amber-800/90 leading-relaxed">
              This demo account is prefilled with simulated identity information for evaluation purposes. No real government ID checks or third-party calls will be made. Simulated verification applies exclusively to this demo account and can never verify real user records.
            </p>
          </div>
        ) : (
          !providerConfig.isConfigured && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-700">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Identity Provider Configuration Required</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                {providerConfig.errorMessage}
              </p>
            </div>
          )
        )}

        {/* Already Verified Banner */}
        {isAlreadyVerified && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  {currentUser?.identityStatus === 'demo_verified'
                    ? 'Simulated Demo Identity Verified'
                    : 'Legal Identity Verified via Authorized Provider'}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Ref: {currentUser?.identityProviderRef || 'IDV-CONFIRMED'} • Verified: {currentUser?.identityVerifiedAt ? new Date(currentUser.identityVerifiedAt).toLocaleDateString() : 'Active'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('trustlend_home_selected_path');
                navigate('/', { replace: true });
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shrink-0"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={isDemoUser ? (e) => { e.preventDefault(); handleDemoVerify(); } : handleRegularVerify} className="space-y-5">
            {/* Full Legal Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={legalFullName}
                  onChange={(e) => setLegalFullName(e.target.value)}
                  disabled={isDemoUser || isSubmitting}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-80"
                />
                {isDemoUser && (
                  <span className="absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    Simulated
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Must exactly match your government-issued identification document.
              </p>
            </div>

            {/* Date of Birth & ID Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={isDemoUser || isSubmitting}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-80"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Applicants must be 18+ years old.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Government ID Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as any)}
                  disabled={isDemoUser || isSubmitting}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-80"
                >
                  <option value="national_id">National ID (Aadhaar / Voter ID / PAN)</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Select issuing government document.</p>
              </div>
            </div>

            {/* ID Number & Masking Info */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Government ID Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  disabled={isDemoUser || isSubmitting}
                  placeholder={isDemoUser ? '•••• •••• 9281' : 'Enter ID number'}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-80 font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Privacy Safe: TrustLend masks ID numbers ({maskIdNumber('9281')}) and never stores raw unencrypted ID copies.</span>
              </div>
            </div>

            {/* Document Upload Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Document Verification Scan / Photo
              </label>
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {documentFileName || 'Upload clear photo or PDF scan'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isDemoUser ? 'Simulated Document Attached' : 'JPG, PNG, or PDF up to 5MB. Verified directly by identity provider.'}
                  </span>
                </div>
                {!isDemoUser && (
                  <button
                    type="button"
                    onClick={() => setDocumentFileName('government_id_verified_document.jpg')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Select File
                  </button>
                )}
              </div>
            </div>

            {/* Liveness / Selfie Check */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Facial Liveness & Biometric Check
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isDemoUser ? 'Simulated Liveness Check Passed' : 'Provider confirms applicant presence and matches ID photo.'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {livenessConfirmed ? 'Ready / Confirmed' : 'Pending'}
              </span>
            </div>

            {/* Regulatory Transparency Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <span>
                <strong>Regulatory Notice:</strong> TrustLend uses third-party automated identity verification providers to validate document authenticity and prevent impersonation. Identity verification does not constitute a government endorsement or regulatory license.
              </span>
            </div>

            {/* Submit Actions */}
            <div className="pt-2">
              {isDemoUser ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Simulated Verification...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Demo Verification (Simulated)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !providerConfig.isConfigured}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Contacting Identity Verification Provider...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for Provider Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Navigation Action */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
            <span className="text-[11px] text-slate-400">Step 2 of Onboarding</span>
          </div>
        </div>
      </div>
    </div>
  );
};
