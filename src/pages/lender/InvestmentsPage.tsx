import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coins, TrendingUp, Calendar, ArrowRight, ShieldCheck, CheckCircle2, Compass } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { dbService } from '../../services/dbService';
import { useAuthMock } from '../../hooks/useAuthMock';
import { LenderInvestment } from '../../types';

export const InvestmentsPage: React.FC = () => {
  const { currentUser } = useAuthMock();
  const [investments, setInvestments] = useState<LenderInvestment[]>([]);

  useEffect(() => {
    if (currentUser) {
      setInvestments(dbService.getInvestments(currentUser.id));
      const unsubscribe = dbService.subscribe(() => {
        setInvestments(dbService.getInvestments(currentUser.id));
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const uniqueInvestments = Array.from(new Map(investments.map(i => [i.id, i])).values());
  const activeInvestments = uniqueInvestments.filter(i => i.status === 'Performing');
  const activePortfolioValue = activeInvestments.reduce((sum, i) => sum + i.investedAmount, 0);
  const totalPrincipal = uniqueInvestments.reduce((sum, i) => sum + i.investedAmount, 0);
  const averageYield = activePortfolioValue > 0
    ? (activeInvestments.reduce((sum, i) => sum + (i.investedAmount * i.annualYield), 0) / activePortfolioValue).toFixed(1)
    : totalPrincipal > 0
    ? (uniqueInvestments.reduce((sum, i) => sum + (i.investedAmount * i.annualYield), 0) / totalPrincipal).toFixed(1)
    : '0.0';

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Loan Allocations & Slices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Active fractional loan investments and monthly yield tracking in INR.
          </p>
        </div>

        <Link
          to="/lender/browse"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Coins className="w-4 h-4" />
          <span>Fund More Loans</span>
        </Link>
      </div>

      {/* Portfolio Breakdown Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Deployed Capital
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatINR(totalPrincipal)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {activeInvestments.length > 0 
              ? `${activeInvestments.length} active performing • ${formatINR(activePortfolioValue)} active`
              : uniqueInvestments.length > 0
              ? `Across ${uniqueInvestments.length} micro-borrowers`
              : 'No active loans funded'}
          </div>
        </div>

        <div className="sm:pl-6 pt-4 sm:pt-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Average Portfolio Yield
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {averageYield}% Net APY
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-0.5">
            {totalPrincipal > 0 ? 'Zero delinquency recorded' : 'Based on funded loan tiers'}
          </div>
        </div>

        <div className="sm:pl-6 pt-4 sm:pt-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Custody Protection
          </span>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Escrow Account Held</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">ICICI Bank Trustee partner</div>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          All Investment Allocations
        </h2>

        {investments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Investment Allocations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't funded any loan slices yet. Browse verified opportunities in the marketplace to start earning returns.
            </p>
            <Link
              to="/lender/browse"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Opportunities</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                  <th className="p-3.5">Investment ID</th>
                  <th className="p-3.5">Borrower Purpose</th>
                  <th className="p-3.5">Allocated (₹)</th>
                  <th className="p-3.5">Annual Yield</th>
                  <th className="p-3.5">Monthly Payout (₹)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-500">{inv.id}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{inv.purpose}</span>
                      <span className="text-xs text-slate-400">Borrower: {inv.borrowerName}</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{formatINR(inv.investedAmount)}</td>
                    <td className="p-3.5 font-bold text-emerald-700">{inv.annualYield}% APY</td>
                    <td className="p-3.5 font-extrabold text-blue-600">{formatINR(inv.monthlyPayout)}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'Performing'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to="/lender/returns"
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Ledger →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
