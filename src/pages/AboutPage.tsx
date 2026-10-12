import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Target, Users, Scale, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuthMock } from '../hooks/useAuthMock';

export const AboutPage: React.FC = () => {
  const { currentUser } = useAuthMock();

  const principles = [
    {
      title: 'Financial Inclusion for India',
      description: 'Traditional commercial banks ignore micro-credit under ₹2,00,000 because of high physical branch overhead. We make micro-loans (₹10,000 to ₹10,00,000) cost-effective, accessible, and dignified for MSMEs and individuals.',
      icon: <Target className="w-6 h-6 text-blue-600" />,
    },
    {
      title: 'Symmetrical Fairness',
      description: 'Neither the borrower nor the lender should be exploited. Borrowers deserve reasonable fixed EMIs with zero hidden charges; lenders deserve honest yields matching the true value of capital.',
      icon: <Scale className="w-6 h-6 text-emerald-600" />,
    },
    {
      title: 'Radical Fee Transparency',
      description: 'Zero foreclosure penalties, no escalating compound charges, and no hidden fine print. All terms and repayment schedules in Indian Rupees are locked before commitment.',
      icon: <Shield className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: 'Community-Powered Capital',
      description: 'Instead of banking profits being captured by corporate monopolies, returns circulate between verified citizens, strengthening domestic businesses and households.',
      icon: <HeartHandshake className="w-6 h-6 text-blue-600" />,
    },
  ];

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Rebuilding Trust in Everyday Finance
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            TrustLend operates as a technology facilitator connecting creditworthy Indian borrowers directly with community lenders, eliminating legacy banking intermediaries.
          </p>
        </div>

        {/* Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4 text-slate-600 leading-relaxed text-sm sm:text-base">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              The Broken Banking Model
            </h2>
            <p>
              For decades, traditional financial institutions paid Indian depositors less than 6% on fixed deposits while lending that same money out at 16% to 28% on personal credit and micro-loans.
            </p>
            <p>
              Meanwhile, hardworking entrepreneurs, small shop owners, and gig economy professionals who only needed ₹50,000 or ₹1,50,000 were forced to deal with bureaucratic paperwork or high-interest predatory apps.
            </p>
            <p className="font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 py-1 italic">
              "TrustLend was built to bridge this divide: direct peer-to-peer lending governed by verified e-KYC, partner bank escrow accounts, and total transparency."
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-soft">
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Platform Commitments
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>No Foreclosure Fees:</strong> Prepay or close your loan anytime without penalties.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Escrow Separation:</strong> Funds never touch company operations; settlements happen via trustee bank accounts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>RBI-Compliant Standards:</strong> Adherence to fair practice codes, e-NACH mandate security, and data privacy.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Symmetrical Respect:</strong> Equal transparency for borrowers seeking funds and lenders supplying capital.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {principles.map((p, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                {p.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>

        {/* Call to action */}
        {!currentUser && (
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center max-w-3xl mx-auto space-y-4">
            <h3 className="text-2xl font-extrabold tracking-tight">
              Ready to Join the Direct Lending Revolution?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Create your account in under 2 minutes with DigiLocker PAN/Aadhaar verification.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
