import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Phone, ArrowRight, AlertCircle, Globe } from 'lucide-react';
import { useAuthMock } from '../hooks/useAuthMock';
import {
  SUPPORTED_REGIONS,
  getRegionByCode,
  validatePhoneNumber,
  extractDigits,
} from '../utils/phoneValidation';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('IN');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuthMock();
  const navigate = useNavigate();

  const currentRegion = getRegionByCode(selectedRegion);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: 'Too short', color: 'bg-slate-300' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please provide your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate phone number according to selected region
    const phoneValidation = validatePhoneNumber(selectedRegion, phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Please enter a valid phone number for the selected country.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (!acceptTerms) {
      setError('You must accept the terms of service and consumer disclosures.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        fullName,
        email,
        password,
        phone,
        phoneRegion: selectedRegion,
        phoneDialCode: currentRegion.dialCode,
        acceptTerms,
      });

      // Clear any prior path and navigate to Phone Verification
      sessionStorage.removeItem('trustlend_home_selected_path');
      navigate('/verify-phone', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-6 sm:py-10">
      <div className="max-w-xl w-full space-y-4 sm:space-y-5 px-4 sm:px-0">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Join the peer-to-peer micro-lending marketplace in under 2 minutes
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft-lg">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Legal Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Legal Full Name *
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rohan Mehra"
                  autoComplete="name"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Phone Number with Region / Country Code Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Mobile Phone Number *
              </label>
              <div className="flex gap-2">
                {/* Region Selector */}
                <div className="relative w-36 sm:w-44 shrink-0">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    aria-label="Country region dialing code"
                    className="w-full pl-9 pr-7 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer truncate"
                  >
                    {SUPPORTED_REGIONS.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.flag} {r.code} ({r.dialCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Local Number Input */}
                <div className="relative flex-1">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(extractDigits(e.target.value))}
                    placeholder={currentRegion.placeholder}
                    autoComplete="tel"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Region: {currentRegion.name} ({currentRegion.dialCode}) • {currentRegion.patternDesc}
              </span>
            </div>

            {/* Create Password */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Create Password *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${(strength.score / 4) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Password strength</span>
                    <span className="font-semibold text-slate-700">{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  I agree to the <span className="text-blue-600 underline">Terms of Service</span>,{' '}
                  <span className="text-blue-600 underline">Privacy Policy</span>, and consent to electronic phone verification for peer-to-peer micro-lending.
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-bold text-white transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 mt-2 bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Account & Verify Phone</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link to Login */}
        <div className="text-center text-xs sm:text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-800 underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
