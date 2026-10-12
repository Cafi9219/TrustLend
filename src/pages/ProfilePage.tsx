import React, { useState } from 'react';
import { User, ShieldCheck, CheckCircle2, Building, RefreshCw, Mail, Phone, Calendar } from 'lucide-react';
import { useAuthMock } from '../hooks/useAuthMock';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { currentUser, switchRole, logout } = useAuthMock();
  const [isSwitching, setIsSwitching] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) return null;

  const handleToggleRole = async () => {
    setIsSwitching(true);
    const newRole = currentUser.role === 'borrower' ? 'lender' : 'borrower';
    await switchRole(newRole);
    setIsSwitching(false);
    navigate(newRole === 'borrower' ? '/borrower/dashboard' : '/lender/dashboard');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Member Profile & Verification
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your verified credentials, banking rails, and platform role mode.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
                <span
                  className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    currentUser.role === 'borrower'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {currentUser.role} Account
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          {/* Quick Role Switcher for Testing & Review */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-end gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Role Switcher (Testing):
            </span>
            <button
              onClick={handleToggleRole}
              disabled={isSwitching}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-sm ${
                currentUser.role === 'borrower'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSwitching ? 'animate-spin' : ''}`} />
              <span>Switch to {currentUser.role === 'borrower' ? 'Lender' : 'Borrower'} Mode</span>
            </button>
          </div>
        </div>

        {/* Verification Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">
              Identity Verification (DigiLocker)
            </span>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>PAN & Aadhaar Verified</span>
            </div>
            <div className="text-xs text-slate-400">Government KYC Complete</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">
              Linked Escrow / Bank Account
            </span>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Building className="w-4 h-4 text-blue-600" />
              <span>{currentUser.role === 'borrower' ? 'HDFC Bank (****4109)' : 'ICICI Bank (****8812)'}</span>
            </div>
            <div className="text-xs text-emerald-700 font-medium">e-NACH Autodebit / IMPS Enabled</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">
              Registered Mobile
            </span>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{currentUser.phone || '+91 98765 43210'}</span>
            </div>
            <div className="text-xs text-slate-400">OTP 2-Factor Authentication Active</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">
              Platform Member Since
            </span>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>January 2026</span>
            </div>
            <div className="text-xs text-slate-400">Zero default record</div>
          </div>
        </div>

        {/* Sign Out Action */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Current active session: <strong>{currentUser.email}</strong>
          </span>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            Log Out of TrustLend
          </button>
        </div>
      </div>
    </div>
  );
};
