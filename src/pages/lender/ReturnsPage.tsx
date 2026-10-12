import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, ArrowUpRight, CheckCircle2, Building, DollarSign, Calendar, Wallet } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { dbService } from '../../services/dbService';
import { useAuthMock } from '../../hooks/useAuthMock';
import { PayoutInstallment } from '../../types';

export const ReturnsPage: React.FC = () => {
  const { currentUser } = useAuthMock();
  const [schedules, setSchedules] = useState<PayoutInstallment[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    if (currentUser) {
      setSchedules(dbService.getPayoutSchedules(currentUser.id));
      setWalletBalance(dbService.getWalletBalance(currentUser.id));
      const unsubscribe = dbService.subscribe(() => {
        setSchedules(dbService.getPayoutSchedules(currentUser.id));
        setWalletBalance(dbService.getWalletBalance(currentUser.id));
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const uniqueSchedules = Array.from(new Map(schedules.map(s => [s.id, s])).values());
  const paidSchedules = uniqueSchedules.filter(s => s.status === 'Paid');
  const totalEarned = paidSchedules.reduce((sum, s) => sum + (s.actualPaidAmount || s.totalAmount), 0);
  const actualPrincipalReceived = paidSchedules.reduce((sum, s) => sum + s.principalAmount, 0);
  const actualInterestReceived = paidSchedules.reduce((sum, s) => sum + s.interestAmount, 0);

  const sortedLedger = [...uniqueSchedules].sort((a, b) => {
    // Show paid first by date descending, then upcoming
    if (a.status === 'Paid' && b.status !== 'Paid') return -1;
    if (a.status !== 'Paid' && b.status === 'Paid') return 1;
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Returns & Cashflow Ledger
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed interest yield distributions and automated escrow bank payouts in INR.
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Available Wallet Balance
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {formatINR(walletBalance)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Cleared & withdrawable funds
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Cumulative Returns Earned
          </span>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            +{formatINR(totalEarned)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {actualInterestReceived > 0 
              ? `₹${actualInterestReceived.toLocaleString('en-IN')} interest + ₹${actualPrincipalReceived.toLocaleString('en-IN')} principal`
              : 'Interest + Principal recovered'}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Auto-Withdrawal Destination
          </span>
          <div className="text-lg font-bold text-slate-900 mt-2 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span>ICICI Bank (A/C: ****8812)</span>
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            Instant IMPS transfer enabled
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Tax Statement (Form 16A)
          </span>
          <div className="text-lg font-bold text-slate-900 mt-2">
            FY 2026-27 TDS Summary
          </div>
          <button
            onClick={() => alert('Generating Indian Income Tax FY 26-27 TDS summary certificate (mock).')}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold mt-1 inline-flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Annual Certificate</span>
          </button>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Monthly Payout Transactions
        </h2>

        {sortedLedger.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Payout Records Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Fund a micro-loan to generate monthly payout schedules and track your cashflow ledger.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                  <th className="p-3.5">Payout ID</th>
                  <th className="p-3.5">Payout Date</th>
                  <th className="p-3.5">Loan Source</th>
                  <th className="p-3.5">Principal (₹)</th>
                  <th className="p-3.5">Interest Yield (₹)</th>
                  <th className="p-3.5">Net Payout (₹)</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {sortedLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-500">{row.id}</td>
                    <td className="p-3.5 text-slate-600">{row.paidDate || row.dueDateFormatted}</td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      {row.loanId} ({row.purpose})
                    </td>
                    <td className="p-3.5 text-slate-700">{formatINR(row.principalAmount)}</td>
                    <td className="p-3.5 font-bold text-emerald-700">+{formatINR(row.interestAmount)}</td>
                    <td className="p-3.5 font-extrabold text-blue-700">{formatINR(row.totalAmount)}</td>
                    <td className="p-3.5 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          row.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.status === 'Due'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : row.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {row.status === 'Paid' ? 'Credited' : row.status}
                      </span>
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
