import { LoanSimulation } from '../types';

/**
 * Formats a number into Indian Rupee Currency string (₹)
 * Example: 3500 -> ₹3,500, 150000 -> ₹1,50,000, 1000000 -> ₹10,00,000
 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

/**
 * Detailed format with two decimal places (paise)
 */
export function formatINRDetailed(amount: number): string {
  if (isNaN(amount)) return '₹0.00';
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats percentage rate
 */
export function formatPercent(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

/**
 * Calculates standard amortized loan Monthly EMI and Lender Returns in INR
 */
export function calculateLoanSimulation(amount: number, termMonths: number): LoanSimulation {
  // Fixed interest rate: 9.5% p.a.
  const borrowerApr = 9.5;
  const monthlyRate = borrowerApr / 100 / 12;

  // Monthly EMI formula: EMI = P * [r(1+r)^n] / [(1+r)^n - 1]
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const monthlyEMI = Math.round((amount * monthlyRate * factor) / (factor - 1));
  const totalRepayment = Math.round(monthlyEMI * termMonths);
  const totalInterest = Math.round(totalRepayment - amount);

  // Fixed yield rate: 9.5% p.a.
  const lenderApy = 9.5;
  const lenderAnnualRate = lenderApy / 100;
  const lenderEstimatedReturn = Math.round(amount * (lenderAnnualRate * (termMonths / 12)));

  return {
    amount,
    termMonths,
    borrowerApr,
    monthlyEMI,
    totalRepayment,
    totalInterest,
    lenderApy,
    lenderEstimatedReturn,
  };
}
