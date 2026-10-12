import { 
  WorkflowStep, 
  PlatformStat, 
  Testimonial, 
  FaqItem,
  BorrowerLoan,
  LenderInvestment,
  MarketplaceOpportunity,
  RepaymentTransaction,
  TrustPillar,
  DualFeaturePanel
} from '../types';

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    stepNumber: 1,
    title: 'Creates Loan Request',
    actor: 'Borrower',
    actorColor: 'blue',
    description: 'Borrower submits loan purpose, requested capital (₹100 – ₹1,00,000), and custom EMI tenure with zero upfront processing penalties.',
    timelineLabel: 'Loan Request',
    iconName: 'FileEdit',
  },
  {
    stepNumber: 2,
    title: 'Marketplace Listing',
    actor: 'Platform',
    actorColor: 'slate',
    description: 'TrustLend executes instant algorithmic credit scoring, KYC verification, and income validation. The verified request is listed on the marketplace.',
    timelineLabel: 'Listing',
    iconName: 'ShieldCheck',
  },
  {
    stepNumber: 3,
    title: 'Lender Funding',
    actor: 'Lender',
    actorColor: 'emerald',
    description: 'Lenders review borrower credit scores, purpose, and yield. Lenders allocate capital starting from ₹100 fractional slices.',
    timelineLabel: 'Funding',
    iconName: 'Coins',
  },
  {
    stepNumber: 4,
    title: 'Monthly EMI Repayment',
    actor: 'Borrower',
    actorColor: 'blue',
    description: 'Borrower repays predictable Monthly EMI installments via automated e-NACH direct debit. No hidden charges or compounding fine print.',
    timelineLabel: 'Repayment',
    iconName: 'RefreshCw',
  },
  {
    stepNumber: 5,
    title: 'Returns Distributed',
    actor: 'Lender',
    actorColor: 'emerald',
    description: 'Principal and interest yields are automatically disbursed into the lender’s account. Borrower credit rating improves for future loans.',
    timelineLabel: 'Returns Distributed',
    iconName: 'Award',
  },
];

export const MOCK_BORROWER_LOANS: BorrowerLoan[] = [
  {
    id: 'LN-IND-8041',
    purpose: 'Commercial Inventory Expansion',
    amount: 150000,
    remainingAmount: 87500,
    interestRate: 9.5,
    tenureMonths: 12,
    monthlyEMI: 13154,
    nextDueDate: '10 Oct 2026',
    status: 'Active',
    fundingProgress: 100,
    disbursedDate: '10 Apr 2026'
  },
  {
    id: 'LN-IND-9214',
    purpose: 'Retail Store Renovation',
    amount: 75000,
    remainingAmount: 18750,
    interestRate: 9.0,
    tenureMonths: 6,
    monthlyEMI: 12832,
    nextDueDate: '15 Oct 2026',
    status: 'Active',
    fundingProgress: 100,
    disbursedDate: '15 May 2026'
  },
  {
    id: 'LN-IND-9932',
    purpose: 'Equipment Purchase (Digital POS)',
    amount: 50000,
    remainingAmount: 50000,
    interestRate: 9.5,
    tenureMonths: 12,
    monthlyEMI: 4385,
    nextDueDate: 'Pending Disbursement',
    status: 'Funding',
    fundingProgress: 78
  },
  {
    id: 'LN-IND-7102',
    purpose: 'Working Capital Micro-credit',
    amount: 30000,
    remainingAmount: 0,
    interestRate: 8.9,
    tenureMonths: 3,
    monthlyEMI: 10148,
    nextDueDate: 'Completed',
    status: 'Completed',
    fundingProgress: 100,
    disbursedDate: '01 Jan 2026'
  }
];

export const MOCK_LENDER_INVESTMENTS: LenderInvestment[] = [
  {
    id: 'INV-401',
    loanId: 'LN-IND-8041',
    borrowerName: 'Rajesh K.',
    purpose: 'Commercial Inventory Expansion (Option 1)',
    investedAmount: 5000,
    annualYield: 9.5,
    tenureMonths: 3,
    monthlyPayout: 1693,
    nextPayoutDate: '10 Oct 2026',
    totalEarnedToDate: 3386,
    status: 'Performing'
  },
  {
    id: 'INV-402',
    loanId: 'LN-IND-8832',
    borrowerName: 'Priya Sharma',
    purpose: 'Diagnostic Lab Equipment (Option 2)',
    investedAmount: 10000,
    annualYield: 9.5,
    tenureMonths: 3,
    monthlyPayout: 3386,
    nextPayoutDate: '14 Oct 2026',
    totalEarnedToDate: 3386,
    status: 'Performing'
  },
  {
    id: 'INV-403',
    loanId: 'LN-IND-9214',
    borrowerName: 'Sunil Verma',
    purpose: 'Retail Store Renovation (Option 3)',
    investedAmount: 20000,
    annualYield: 9.5,
    tenureMonths: 3,
    monthlyPayout: 6773,
    nextPayoutDate: '15 Oct 2026',
    totalEarnedToDate: 6773,
    status: 'Performing'
  }
];

export const MOCK_MARKETPLACE_OPPORTUNITIES: MarketplaceOpportunity[] = [
  {
    id: 'MKT-101',
    borrowerName: 'Aditya Narayan',
    purpose: 'Textile Wholesale Stocking',
    amount: 100000,
    fundedAmount: 75000,
    tenureMonths: 12,
    interestRate: 9.5,
    creditGrade: 'A+',
    riskScore: 785,
    verifiedIncome: true,
    minTicket: 500,
    daysRemaining: 4
  },
  {
    id: 'MKT-102',
    borrowerName: 'Meera Deshmukh',
    purpose: 'Boutique Expansion & Interiors',
    amount: 90000,
    fundedAmount: 64000,
    tenureMonths: 12,
    interestRate: 9.5,
    creditGrade: 'A',
    riskScore: 742,
    verifiedIncome: true,
    minTicket: 500,
    daysRemaining: 6
  },
  {
    id: 'MKT-103',
    borrowerName: 'Karthik Raman',
    purpose: 'Cloud Kitchen Equipment',
    amount: 100000,
    fundedAmount: 85000,
    tenureMonths: 24,
    interestRate: 9.5,
    creditGrade: 'A+',
    riskScore: 792,
    verifiedIncome: true,
    minTicket: 1000,
    daysRemaining: 2
  },
  {
    id: 'MKT-104',
    borrowerName: 'Sanjay Gupta',
    purpose: 'Hardware Store Working Capital',
    amount: 80000,
    fundedAmount: 25000,
    tenureMonths: 6,
    interestRate: 9.5,
    creditGrade: 'B+',
    riskScore: 715,
    verifiedIncome: true,
    minTicket: 500,
    daysRemaining: 9
  }
];

export const MOCK_REPAYMENTS: RepaymentTransaction[] = [
  {
    id: 'TXN-701',
    loanId: 'LN-IND-8041',
    amount: 13154,
    date: '10 Sep 2026',
    method: 'e-NACH Auto-Debit',
    status: 'Paid',
    type: 'EMI Repayment'
  },
  {
    id: 'TXN-702',
    loanId: 'LN-IND-9214',
    amount: 12832,
    date: '15 Sep 2026',
    method: 'UPI / NetBanking',
    status: 'Paid',
    type: 'EMI Repayment'
  },
  {
    id: 'TXN-703',
    loanId: 'LN-IND-8041',
    amount: 13154,
    date: '10 Oct 2026',
    method: 'e-NACH Auto-Debit',
    status: 'Upcoming',
    type: 'EMI Repayment'
  }
];

export const PLATFORM_STATS: PlatformStat[] = [
  {
    label: 'Total Capital Facilitated',
    value: '₹18.4 Cr+',
    subtext: 'Directly exchanged between peers',
    trend: '+28% YoY',
  },
  {
    label: 'Historical On-Time Repayment',
    value: '99.4%',
    subtext: 'Backed by automated e-NACH recovery',
    trend: 'Industry leading',
  },
  {
    label: 'Average Time to Full Funding',
    value: '< 4.5 hrs',
    subtext: 'From verified listing to disbursement',
    trend: 'Instant matching',
  },
  {
    label: 'Verified Platform Members',
    value: '34,200+',
    subtext: 'Active borrowers and retail lenders',
    trend: '+1,800 this month',
  },
];

export const TRUST_PILLARS: TrustPillar[] = [
  {
    title: 'Bank-Grade 256-Bit Security',
    description: 'End-to-end data encryption and strict SOC-2 compliant protocols protect all sensitive identity and transaction details.',
    iconName: 'Lock',
  },
  {
    title: 'Rigorous Identity & Credit Scoring',
    description: 'Multi-layer identity verification, income verification, and fraud detection algorithms mitigate counterparty risk.',
    iconName: 'ShieldAlert',
  },
  {
    title: 'Regulated Custody & Escrow',
    description: 'Capital is held securely in partner escrow custodial institutions until loan agreements are executed.',
    iconName: 'Building2',
  },
  {
    title: 'Absolute Fee Transparency',
    description: 'No hidden origination shocks or compound delinquency penalties. All terms are locked in plain English before acceptance.',
    iconName: 'CheckCircle2',
  },
];

export const DUAL_PANELS: DualFeaturePanel[] = [
  {
    type: 'borrower',
    tagline: 'FOR BORROWERS',
    title: 'Accessible Capital Without The Bank Bureaucracy',
    subtitle: 'Get funded directly by community lenders with competitive rates, straightforward terms, and no predatory fees.',
    accentColor: 'blue',
    ctaText: 'Request a Loan',
    highlightBadge: 'Average approval under 24 hours',
    metrics: [
      { stat: '9.5%', label: 'Fixed APR' },
      { stat: '₹100 - ₹1,00,000', label: 'Micro-loan range' },
      { stat: '0%', label: 'Pre-payment penalty' },
    ],
    features: [
      {
        title: 'Request Loans on Your Terms',
        description: 'Specify your exact funding target and select repayment schedules from 3 to 24 months that fit your cashflow.',
        iconName: 'FileText',
      },
      {
        title: 'Flexible Direct Funding',
        description: 'Access fast capital disbursed directly to your bank once funded by peer lenders, skipping tedious paperwork.',
        iconName: 'Zap',
      },
      {
        title: 'Track Loan Status in Real-Time',
        description: 'Full transparency at every stage: watch your funding progress, view upcoming dues, and build credit reputation.',
        iconName: 'BarChart3',
      },
    ],
  },
  {
    type: 'lender',
    tagline: 'FOR LENDERS',
    title: 'Predictable Monthly Yields on Real Micro-Loans',
    subtitle: 'Put your capital to work empowering verified individuals and micro-businesses while earning attractive annualized yields.',
    accentColor: 'emerald',
    ctaText: 'Fund a Loan',
    highlightBadge: '99.4% historical repayment rate',
    metrics: [
      { stat: '9.5%', label: 'Fixed net APY' },
      { stat: '₹100', label: 'Min per loan slice' },
      { stat: 'Monthly', label: 'Cashflow distribution' },
    ],
    features: [
      {
        title: 'Browse Opportunities Openly',
        description: 'Explore pre-vetted loan listings with clear risk ratings, debt-to-income metrics, verified income, and clear purposes.',
        iconName: 'Compass',
      },
      {
        title: 'Fund Borrowers You Believe In',
        description: 'Diversify easily by funding partial slices across dozens of loans or backing individual credit-worthy requests in full.',
        iconName: 'HeartHandshake',
      },
      {
        title: 'Earn Steady, Compounding Returns',
        description: 'Receive monthly principal plus interest straight to your account, ready for auto-reinvesting or instant withdrawal.',
        iconName: 'TrendingUp',
      },
    ],
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Rohan Mehra',
    role: 'Borrower',
    detail: 'Café Owner, Bengaluru',
    loanAmount: '₹3,50,000 Micro-loan',
    quote: 'Commercial banks turned me away because my espresso machine purchase was under their corporate minimum. TrustLend connected me with peer lenders who funded my machine in 8 hours.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    id: '2',
    name: 'Ananya Roy',
    role: 'Lender',
    detail: 'Individual Investor, Mumbai',
    loanAmount: 'Active portfolio in 32 loans',
    quote: 'Bank fixed deposits yield barely 6.5%. With TrustLend, I earn steady 10.4% annualized monthly interest while directly supporting verified small business entrepreneurs.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    id: '3',
    name: 'Vikram Joshi',
    role: 'Borrower',
    detail: 'Freelance Architect, Pune',
    loanAmount: '₹1,50,000 Workstation loan',
    quote: 'The EMI repayment schedule was crystal clear. Knowing real peers funded my growth made the experience respectful and free from the hidden fees of credit cards.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: 'What is Peer-to-Peer (P2P) Lending on TrustLend?',
    answer: 'TrustLend is a technology marketplace connecting verified borrowers and lenders directly. TrustLend facilitates loan listing, algorithmic risk scoring, and automated e-NACH repayment collections. TrustLend itself does not lend balance sheet capital.',
  },
  {
    id: 'faq-2',
    category: 'borrowers',
    question: 'How fast do borrowers receive loan disbursements in India?',
    answer: 'Once your identity is verified via DigiLocker / PAN and your loan request passes automated underwriting, it is listed on the marketplace. Most requests are funded by peer lenders within 4 to 24 hours and disbursed directly via IMPS / NEFT.',
  },
  {
    id: 'faq-3',
    category: 'lenders',
    question: 'What is the minimum investment required to start lending?',
    answer: 'You can begin with as little as ₹500 per loan slice. This fractional model enables you to spread ₹10,000 across 20 distinct borrowers, significantly diversifying credit risk.',
  },
  {
    id: 'faq-4',
    category: 'borrowers',
    question: 'Can I foreclose or prepay my loan early without penalty?',
    answer: 'Yes. TrustLend strictly enforces a zero foreclosure penalty policy. You can pay off your remaining principal at any time with zero penalty charges.',
  },
  {
    id: 'faq-5',
    category: 'lenders',
    question: 'How are lender returns protected against default?',
    answer: 'Borrowers undergo rigorous KYC, bank cash-flow analysis, and credit bureau verification. All repayments are collected via legally binding automated e-NACH mandates into escrow accounts.',
  },
];
