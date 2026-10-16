import { User, MarketplaceOpportunity, BorrowerLoan } from '../types';

const API_BASE = ''; // Uses relative URLs proxied through Vite, or direct server

const getHeaders = () => {
  const token = localStorage.getItem('trustlend_jwt_token') || sessionStorage.getItem('trustlend_jwt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  auth: {
    async register(data: { fullName: string; email: string; password?: string; role: 'borrower' | 'lender' }) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Registration failed');
      // Do not store JWT token on register (Rule 2: Do not automatically log the user in)
      return json;
    },

    async login(data: { email: string; password?: string; role?: 'borrower' | 'lender' }) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Login failed');
      if (json.token) {
        localStorage.setItem('trustlend_jwt_token', json.token);
        sessionStorage.setItem('trustlend_jwt_token', json.token);
      }
      return json;
    },

    async getMe(): Promise<{ success: boolean; user: User }> {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch user');
      return json;
    },

    logout() {
      localStorage.removeItem('trustlend_jwt_token');
      sessionStorage.removeItem('trustlend_jwt_token');
      localStorage.removeItem('trustlend_user_session');
      sessionStorage.removeItem('trustlend_user_session');
    },
  },

  // Loans & Marketplace
  loans: {
    async getAll(): Promise<{ success: boolean; count: number; loans: any[] }> {
      const res = await fetch(`${API_BASE}/loans`, {
        method: 'GET',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch loans');
      return json;
    },

    async getById(id: string) {
      const res = await fetch(`${API_BASE}/loans/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch loan');
      return json;
    },

    async create(data: {
      businessName: string;
      purpose: string;
      loanAmount: number;
      tenureMonths: number;
      expectedYield?: number;
    }) {
      const res = await fetch(`${API_BASE}/loans`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create loan');
      return json;
    },
  },

  // Investments
  investments: {
    async create(data: { loanId: string; investedAmount: number }) {
      const res = await fetch(`${API_BASE}/investments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create investment');
      return json;
    },

    async getMy(): Promise<{ success: boolean; count: number; investments: any[] }> {
      const res = await fetch(`${API_BASE}/investments/my`, {
        method: 'GET',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch investments');
      return json;
    },
  },

  // Activities
  activities: {
    async getMy(): Promise<{ success: boolean; count: number; activities: any[] }> {
      const res = await fetch(`${API_BASE}/activities/my`, {
        method: 'GET',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch activities');
      return json;
    },
  },

  // Dashboards
  dashboard: {
    async getLender(): Promise<{
      success: boolean;
      data: {
        totalInvestedCapital: number;
        expectedReturns: number;
        expectedPortfolioValue: number;
        projectedMonthlyCashflow: number;
        activePositions: any[];
        upcomingPayouts: any[];
        timelineEvents: any[];
      };
    }> {
      const res = await fetch(`${API_BASE}/dashboard/lender`, {
        method: 'GET',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch lender dashboard');
      return json;
    },

    async getBorrower(): Promise<{
      success: boolean;
      data: {
        totalBorrowed: number;
        totalRepaid: number;
        loans: any[];
        activeLoan: any;
        timelineEvents: any[];
      };
    }> {
      const res = await fetch(`${API_BASE}/dashboard/borrower`, {
        method: 'GET',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch borrower dashboard');
      return json;
    },
  },
};
