export type UserRole = 'borrower' | 'lender';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  phone?: string;
  phoneRegion?: string;
  phoneDialCode?: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string;
  roleSelected?: boolean;
  kycVerified?: boolean;
  walletBalance?: number;
  isTestAccount?: boolean;
}

export interface LoanSimulation {
  amount: number;
  termMonths: number;
  borrowerApr: number;
  monthlyEMI: number;
  totalRepayment: number;
  totalInterest: number;
  lenderApy: number;
  lenderEstimatedReturn: number;
}

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  actor: 'Borrower' | 'Platform' | 'Lender';
  actorColor: string;
  description: string;
  timelineLabel: string;
  iconName: string;
}

export interface BorrowerLoan {
  id: string;
  userId?: string;
  purpose: string;
  amount: number;
  remainingAmount: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEMI: number;
  nextDueDate: string;
  status: 'Active' | 'Under Review' | 'Completed' | 'Funding' | 'Pending Review' | 'Approved' | 'Rejected';
  fundingProgress?: number;
  disbursedDate?: string;
}

export type LoanRequestStatus = 'Pending' | 'Pending Review' | 'Accepted' | 'Approved' | 'Funded' | 'Rejected' | 'Completed';

export interface BorrowerLoanRequest {
  id: string;
  userId: string;
  borrowerName: string;
  borrowerEmail?: string;
  amount: number;
  purpose: string;
  tenureMonths: number;
  interestRate: number;
  monthlyEMI: number;
  status: LoanRequestStatus;
  createdAt: string;
  employmentType?: string;
  monthlyIncome?: number;
  reviewedAt?: string;
  rejectionReason?: string;
  isEligibleForMatching?: boolean;
  acceptedByLenderId?: string;
  acceptedByLenderName?: string;
  acceptedAt?: string;
  fundedAt?: string;
  loanId?: string;
  totalRepayment?: number;
  totalInterest?: number;
}

export interface LenderInvestment {
  id: string;
  userId?: string;
  loanId: string;
  borrowerName: string;
  purpose: string;
  investedAmount: number;
  annualYield: number;
  tenureMonths: number;
  monthlyPayout: number;
  nextPayoutDate: string;
  totalEarnedToDate: number;
  status: 'Performing' | 'Matured' | 'Funding';
  disbursedDate?: string;
}

export type PayoutStatus = 'Upcoming' | 'Due' | 'Paid' | 'Overdue' | 'Scheduled';

export interface PayoutInstallment {
  id: string;
  userId: string;
  investmentId: string;
  loanId: string;
  borrowerName: string;
  purpose: string;
  installmentNumber: number;
  dueDate: string;
  dueDateFormatted: string;
  openingPrincipal?: number;
  principalAmount: number;
  interestAmount: number;
  applicableFee?: number;
  totalAmount: number;
  status: PayoutStatus;
  paidDate?: string;
  actualPaidAmount?: number;
}

export type PaymentMethodType = 'UPI' | 'Bank Transfer (NEFT/IMPS)';

export interface WalletFundingRequest {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  referenceId: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  createdAt: string;
  verifiedAt?: string;
  note?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'Credit' | 'Debit';
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  createdAt: string;
}

export interface MarketplaceOpportunity {
  id: string;
  borrowerName: string;
  purpose: string;
  amount: number;
  fundedAmount: number;
  tenureMonths: number;
  interestRate: number;
  creditGrade: 'A+' | 'A' | 'B+' | 'B';
  riskScore: number;
  verifiedIncome: boolean;
  minTicket: number;
  daysRemaining: number;
}

export interface RepaymentTransaction {
  id: string;
  userId?: string;
  loanId: string;
  amount: number;
  date: string;
  method: string;
  status: 'Paid' | 'Upcoming' | 'Processing';
  type: 'EMI Repayment' | 'Lender Payout';
}

export interface PlatformStat {
  label: string;
  value: string;
  subtext: string;
  trend: string;
}

export interface TrustPillar {
  title: string;
  description: string;
  iconName: string;
}

export interface DualFeaturePanel {
  type: 'borrower' | 'lender';
  tagline: string;
  title: string;
  subtitle: string;
  accentColor: string;
  ctaText: string;
  highlightBadge: string;
  metrics: { stat: string; label: string }[];
  features: { title: string; description: string; iconName: string }[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: 'Borrower' | 'Lender';
  detail: string;
  quote: string;
  loanAmount: string;
  avatar: string;
  rating: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'borrowers' | 'lenders';
}

export interface ContactFormData {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  inquiryType: 'general' | 'borrower' | 'lender' | 'partnership';
}
