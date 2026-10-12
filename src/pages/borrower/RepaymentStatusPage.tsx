import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Calendar, Download, ShieldCheck, CreditCard } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { dbService } from '../../services/dbService';
import { useAuthMock } from '../../hooks/useAuthMock';
import { BorrowerLoan, RepaymentTransaction } from '../../types';

export const RepaymentStatusPage: React.FC = () => {
  const { currentUser } = useAuthMock();
  const [loans, setLoans] = useState<BorrowerLoan[]>([]);
  const [repayments, setRepayments] = useState<RepaymentTransaction[]>([]);

  useEffect(() => {
    if (currentUser) {
      const load = () => {
        setLoans(dbService.getLoans(currentUser.id));
        setRepayments(dbService.getRepayments(currentUser.id));
      };
      load();
      const unsub = dbService.subscribe(() => {
        load();
      });
      return () => unsub();
    }
  }, [currentUser]);

  const activeLoan = loans.find(l => l.status === 'Active') || loans[0] || null;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Repayment Status & EMI Schedule
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          View upcoming automated direct debits, manual pre-payment options, and past receipt ledger.
        </p>
      </div>

      {/* Auto-Debit & Next EMI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Upcoming Monthly EMI
          </span>
          <div className="text-3xl font-black text-blue-600 mt-2">
            {activeLoan ? formatINR(activeLoan.monthlyEMI) : '₹0'}
          </div>
          <div className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {activeLoan && activeLoan.status === 'Active' 
                ? `Scheduled for ${activeLoan.nextDueDate}` 
                : 'No upcoming EMI scheduled'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            e-NACH Mandate Status
          </span>
          <div className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{loans.length > 0 ? 'Automated & Active' : 'Pre-approved'}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {loans.length > 0 ? 'Linked to HDFC Bank (A/C: ****4109)' : 'Auto-links upon loan disbursement'}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Prepayment & Foreclosure
          </span>
          <div className="text-xl font-bold text-slate-900 mt-2">
            ₹0 Penalty Charges
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Pay remaining principal anytime for free
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Repayment History & Receipts
        </h2>

        {repayments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Repayment Receipts Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once an active loan installment is debited or repaid via e-NACH, official receipts and transaction statements will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                  <th className="p-3.5">Txn ID</th>
                  <th className="p-3.5">Loan ID</th>
                  <th className="p-3.5">Amount (₹)</th>
                  <th className="p-3.5">Debit Date</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {repayments.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-500">{txn.id}</td>
                    <td className="p-3.5 font-medium text-slate-900">{txn.loanId}</td>
                    <td className="p-3.5 font-bold text-slate-900">{formatINR(txn.amount)}</td>
                    <td className="p-3.5 text-slate-600">{txn.date}</td>
                    <td className="p-3.5 text-slate-600">{txn.method}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          txn.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => alert(`Downloading official e-receipt for ${txn.id}`)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
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
