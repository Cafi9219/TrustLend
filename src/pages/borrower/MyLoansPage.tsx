import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, CheckCircle2, Clock, Download, PlusCircle } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { dbService } from '../../services/dbService';
import { useAuthMock } from '../../hooks/useAuthMock';
import { BorrowerLoan } from '../../types';

export const MyLoansPage: React.FC = () => {
  const { currentUser } = useAuthMock();
  const [loans, setLoans] = useState<BorrowerLoan[]>([]);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Funding' | 'Completed'>('All');

  useEffect(() => {
    if (currentUser) {
      setLoans(dbService.getLoans(currentUser.id));
      const unsub = dbService.subscribe(() => {
        setLoans(dbService.getLoans(currentUser.id));
      });
      return () => unsub();
    }
  }, [currentUser]);

  const filteredLoans = loans.filter((loan) => {
    if (filter === 'All') return true;
    return loan.status === filter;
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Micro-Loans
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your sanctioned, funded, and historical peer micro-loans in INR.
          </p>
        </div>

        <Link
          to="/borrower/applications"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Apply for New Loan</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {(['All', 'Active', 'Funding', 'Completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors ${
              filter === tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loans Grid */}
      {filteredLoans.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {loans.length === 0 ? 'No Micro-Loans on Record' : `No ${filter} Loans Found`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {loans.length === 0 
              ? 'Submit a loan application to request capital directly from peer community lenders.' 
              : 'You have no loans currently matching the selected filter status.'}
          </p>
          <Link
            to="/borrower/applications"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Apply for New Loan</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLoans.map((loan) => {
            const repaidAmount = loan.amount - loan.remainingAmount;
            const progressPercent = Math.round((repaidAmount / loan.amount) * 100);

            return (
              <div
                key={loan.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{loan.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          loan.status === 'Active'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : loan.status === 'Funding'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Tenure: {loan.tenureMonths} Mo
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {loan.purpose}
                  </h3>

                  {/* Amount Details */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                        Sanctioned Principal
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        {formatINR(loan.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                        Monthly EMI
                      </span>
                      <span className="text-base font-extrabold text-blue-600">
                        {formatINR(loan.monthlyEMI)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                      <span>Repaid: {formatINR(repaidAmount)}</span>
                      <span>Remaining: {formatINR(loan.remainingAmount)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-medium">
                      {progressPercent}% Repaid
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Next Due: {loan.nextDueDate}
                  </span>

                  <Link
                    to="/borrower/repayments"
                    className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Schedule & Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
