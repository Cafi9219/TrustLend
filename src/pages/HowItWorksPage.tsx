import React from 'react';
import { Link } from 'react-router-dom';
import { ConceptWorkflow } from '../components/home/ConceptWorkflow';
import { ArrowRight, ShieldCheck, CheckCircle2, Shield } from 'lucide-react';
import { useAuthMock } from '../hooks/useAuthMock';

export const HowItWorksPage: React.FC = () => {
  const { currentUser } = useAuthMock();

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            How Peer-to-Peer Micro-Lending Works
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            By connecting borrowers directly with community lenders, TrustLend eliminates costly banking overhead and passes those financial savings back in Indian Rupees.
          </p>
        </div>

        {/* Change 5: 5-Stage Process Flow Relocated to this dedicated page */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-soft">
          <ConceptWorkflow />
        </div>

        {/* Comparison Matrix: TrustLend vs Indian Banks vs Credit Cards */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-soft space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Why P2P Lending Outperforms Traditional Indian Banks
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Direct comparison on interest rates, speed, and fee transparency.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                  <th className="p-4">Feature / Metric</th>
                  <th className="p-4 text-blue-600 bg-blue-50/70 border-x border-blue-100">TrustLend (P2P)</th>
                  <th className="p-4">Commercial Banks / NBFCs</th>
                  <th className="p-4">Credit Cards / Instant Apps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm text-slate-700">
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Borrower Interest Rates</td>
                  <td className="p-4 font-bold text-blue-700 bg-blue-50/30 border-x border-blue-100">
                    Fixed 9.5% p.a. (Max)
                  </td>
                  <td className="p-4 text-slate-600">14% – 24% Variable</td>
                  <td className="p-4 text-rose-600 font-semibold">36% – 48%+ APR traps</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Lender Net Yield</td>
                  <td className="p-4 font-bold text-emerald-700 bg-blue-50/30 border-x border-blue-100">
                    Fixed 9.5% Net APY (Max)
                  </td>
                  <td className="p-4 text-slate-600">6.0% – 7.2% Fixed Deposits</td>
                  <td className="p-4 text-slate-600">N/A (Bank absorbs profit)</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Disbursement Speed</td>
                  <td className="p-4 font-bold text-blue-700 bg-blue-50/30 border-x border-blue-100">
                    4 to 24 Hours (IMPS)
                  </td>
                  <td className="p-4 text-slate-600">7 to 15 Days</td>
                  <td className="p-4 text-slate-600">Instant (predatory traps)</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Foreclosure & Prepayment</td>
                  <td className="p-4 font-bold text-blue-700 bg-blue-50/30 border-x border-blue-100">
                    ₹0 (Zero Charges)
                  </td>
                  <td className="p-4 text-slate-600">3% – 5% penalty + GST</td>
                  <td className="p-4 text-slate-600">High compound penalty</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Micro-Loan Ticket</td>
                  <td className="p-4 font-bold text-blue-700 bg-blue-50/30 border-x border-blue-100">
                    Starting from ₹10,000
                  </td>
                  <td className="p-4 text-slate-600">Rarely under ₹1,00,000</td>
                  <td className="p-4 text-slate-600">High fee micro-limits</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Blueprint Paths for Borrowers & Lenders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-7 rounded-3xl border border-slate-200 bg-white shadow-soft">
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Borrower Path: Securing Peer Capital
            </h3>
            <ol className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li><strong>1. Submit Request:</strong> Choose ₹25k to ₹10 Lakhs and your repayment tenure.</li>
              <li><strong>2. Algorithmic KYC:</strong> Automated credit check with zero score damage.</li>
              <li><strong>3. Direct Payout:</strong> Once peer-funded, funds are transferred directly via IMPS.</li>
              <li><strong>4. Predictable EMI:</strong> Repay automatically through e-NACH mandates.</li>
            </ol>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link
                to={currentUser ? "/borrower/applications" : "/register"}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>{currentUser ? "Go to Loan Applications" : "Register to Request Loan"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-7 rounded-3xl border border-slate-200 bg-white shadow-soft">
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Lender Path: Building High-Yield Cashflow
            </h3>
            <ol className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li><strong>1. Complete Escrow Link:</strong> Link your verified bank account.</li>
              <li><strong>2. Fractional Allocations:</strong> Fund micro-slices starting from just ₹500.</li>
              <li><strong>3. Diversify Risk:</strong> Spread ₹10,000 across 20 distinct verified loans.</li>
              <li><strong>4. Monthly Dividends:</strong> Receive principal + interest payouts every month.</li>
            </ol>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link
                to={currentUser ? "/lender/browse" : "/register"}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>{currentUser ? "Browse Lending Marketplace" : "Register as Lender"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Security, Escrow & Regulatory Disclosures Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-slate-700" />
                <span>Security & Regulatory Compliance Standards</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Institutional-grade security protocols governing all peer-to-peer micro-lending transactions.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-lg border border-slate-200">
                <Shield className="w-3.5 h-3.5 text-slate-600" />
                256-Bit SSL Encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                100% KYC Verified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Dual-Sign Escrow Accounts</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                TrustLend never touches or holds user funds on its balance sheet. All transfers are facilitated through RBI-compliant nodal escrow partner banks.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h4 className="text-sm font-bold text-slate-900 mb-1">e-NACH Automated Recovery</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Borrower repayments are bound by legally enforceable NPCI e-NACH auto-debit mandates, guaranteeing disciplined monthly distributions to lenders.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Algorithmic Risk Scoring</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-factor credit appraisal examining banking statements, employment verification, and alternative data to score borrowers from A+ to C-.
              </p>
            </div>
          </div>

          {/* Regulatory Disclosure Disclaimer */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed space-y-1.5 bg-slate-50/50 p-4 rounded-2xl">
            <p className="font-semibold text-slate-700">P2P Facilitation Notice & Regulatory Disclaimer:</p>
            <p>
              TrustLend operates solely as an intermediary technology marketplace connecting borrowers and lenders. TrustLend does not provide balance sheet credit. All borrower funds are settled via escrow accounts managed by regulated banking partners in accordance with Reserve Bank of India (RBI) P2P NBFC master directions.
            </p>
            <p>
              Lending through peer-to-peer marketplaces involves risk of credit loss. Diversification across multiple borrower slices is strongly recommended. Past on-time repayment performance does not guarantee future results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
