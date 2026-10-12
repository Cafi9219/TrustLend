import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Shield, LogOut, ArrowRight, Wallet } from 'lucide-react';
import { useAuthMock } from '../../hooks/useAuthMock';
import { formatINR } from '../../utils/formatters';
import { dbService, DEMO_LENDER_ID } from '../../services/dbService';
import { AddToWalletModal } from '../wallet/AddToWalletModal';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { currentUser, logout } = useAuthMock();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (currentUser) {
      setWalletBalance(dbService.getWalletBalance(currentUser.id));
      const unsubscribe = dbService.subscribe((type, payload) => {
        if (
          type === 'wallet_updated' ||
          type === 'investment_confirmed' ||
          type === 'funding_request_verified' ||
          type === 'repayment_recorded'
        ) {
          setWalletBalance(dbService.getWalletBalance(currentUser.id));
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // If NOT authenticated, render the Stage A minimal public navbar
  if (!currentUser) {
    return (
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3.5'
            : 'bg-white border-b border-slate-100 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: TrustLend Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
                  Trust<span className="text-blue-600">Lend</span>
                </span>
                <span className="text-[10px] tracking-wider font-semibold text-slate-500 uppercase">
                  P2P Marketplace
                </span>
              </div>
            </Link>

            {/* Right: Sign In | Create Account ONLY (Strict Requirement: Remove all other links) */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.99]"
              >
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // STAGE B: Authenticated User (Product Mode)
  // Dynamic links based on user role (Borrower vs Lender - Strict Separation)
  const roleLinks = currentUser.role === 'borrower'
    ? [
        { name: 'Dashboard', path: '/borrower/dashboard' },
        { name: 'My Loans', path: '/borrower/my-loans' },
        { name: 'Loan Applications', path: '/borrower/applications' },
        { name: 'Repayment Status', path: '/borrower/repayments' },
      ]
    : [
        { name: 'Dashboard', path: '/lender/dashboard' },
        { name: 'Browse Opportunities', path: '/lender/browse' },
        { name: 'Investments', path: '/lender/investments' },
        { name: 'Returns', path: '/lender/returns' },
      ];

  const standardLinks = [
    { name: 'Home', path: '/' },
    ...roleLinks,
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3'
          : 'bg-white border-b border-slate-100 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Trust<span className="text-blue-600">Lend</span>
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                {currentUser.role === 'borrower' ? 'Borrower Mode' : 'Lender Mode'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {standardLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Section: Profile & Logout */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {currentUser && (
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 shadow-2xs border transition-all cursor-pointer hover:shadow-sm active:scale-95 ${
                  currentUser.role === 'lender'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/70'
                    : 'bg-blue-50 text-blue-800 border-blue-200/80 hover:bg-blue-100/70'
                }`}
                title="Click to Add Funds or Manage Wallet"
              >
                <Wallet className={`w-3.5 h-3.5 shrink-0 ${currentUser.role === 'lender' ? 'text-emerald-600' : 'text-blue-600'}`} />
                <span>{formatINR(walletBalance)}</span>
                {currentUser.id === DEMO_LENDER_ID && (
                  <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                    Wallet
                  </span>
                )}
              </button>
            )}

            <Link
              to="/profile"
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-full transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <span className="text-xs font-bold text-slate-800 max-w-[100px] truncate">
                {currentUser.name}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  currentUser.role === 'borrower'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {currentUser.role}
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="px-4 pt-3 pb-6 space-y-2">
            <div className="p-3 mb-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{currentUser.role} Mode</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>

            {currentUser && (
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(true)}
                className={`w-full p-3 mb-2 rounded-xl flex items-center justify-between border transition-all text-left ${
                  currentUser.role === 'lender'
                    ? 'bg-emerald-50 border-emerald-200/80 text-emerald-950 hover:bg-emerald-100/70'
                    : 'bg-blue-50 border-blue-200/80 text-blue-950 hover:bg-blue-100/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className={`w-4 h-4 ${currentUser.role === 'lender' ? 'text-emerald-600' : 'text-blue-600'}`} />
                  <span className="text-xs font-bold">Available Wallet</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold">{formatINR(walletBalance)}</span>
                  <span className="text-[10px] bg-white/80 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                    + Add
                  </span>
                </div>
              </button>
            )}

            <div className="space-y-1">
              {standardLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `block px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50 font-bold'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 font-bold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                Profile & Settings
              </NavLink>
            </div>
          </div>
        </div>
      )}
      {/* Wallet Deposit / Management Modal accessible from navbar */}
      <AddToWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={(newBal) => {
          setWalletBalance(newBal);
        }}
      />
    </header>
  );
};
