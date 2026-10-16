import { User, UserRole } from '../types';
import { dbService, DEMO_BORROWER_ID, DEMO_LENDER_ID, DEMO_BORROWER_EMAIL, DEMO_LENDER_EMAIL } from './dbService';
import { hashPassword } from '../utils/security';
import { smsVerificationService } from './smsVerificationService';

const STORAGE_KEY = 'trustlend_user_session';

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
  role?: UserRole;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  phoneRegion: string;
  phoneDialCode: string;
  acceptTerms: boolean;
}

export const mockAuthService = {
  getCurrentUser(): User | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed: User = JSON.parse(data);
      // Synchronize with database record if available
      const dbUser = dbService.getUserById(parsed.id) || dbService.getUserByEmail(parsed.email);
      return dbUser || parsed;
    } catch {
      return null;
    }
  },

  async initiateLogin(credentials: LoginCredentials): Promise<{ requires2fa: boolean; user?: User; pendingUser?: any }> {
    if (!credentials.email || !credentials.email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    const normalizedEmail = credentials.email.trim().toLowerCase();
    let user: User | undefined;

    if (normalizedEmail === DEMO_BORROWER_EMAIL.toLowerCase()) {
      user = dbService.getUserById(DEMO_BORROWER_ID);
    } else if (normalizedEmail === DEMO_LENDER_EMAIL.toLowerCase()) {
      user = dbService.getUserById(DEMO_LENDER_ID);
    } else {
      user = dbService.getUserByEmail(normalizedEmail);
    }

    if (!user) {
      throw new Error('No registered account found with this email. Please sign up first.');
    }

    const isDemo = user.id === DEMO_BORROWER_ID || user.id === DEMO_LENDER_ID || !!user.isTestAccount;

    // Verify password for regular users
    if (credentials.password && !isDemo) {
      const isValidPassword = await dbService.verifyUserCredentials(user.id, user.email, credentials.password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
    }

    // Demo users bypass 2FA (Preserve 1-click demo login)
    if (isDemo) {
      if (credentials.role && user.role !== credentials.role) {
        user.role = credentials.role;
        user.roleSelected = true;
        dbService.saveUser(user);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      this.clearPending2fa();
      return { requires2fa: false, user };
    }

    // Regular users: Enforce 2FA OTP verification on every login
    const pending = {
      userId: user.id,
      email: user.email,
      phone: user.phone || '',
      phoneDialCode: user.phoneDialCode || '+91',
      phoneRegion: user.phoneRegion || 'IN',
      name: user.name,
      createdAt: Date.now(),
    };

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('trustlend_pending_2fa', JSON.stringify(pending));
    }

    // Request fresh 2FA OTP dispatch
    if (user.phone) {
      try {
        await smsVerificationService.sendVerificationOtp(user.id, user.phone);
      } catch (e) {
        console.warn('SMS gateway notice during 2FA dispatch:', e);
      }
    }

    return { requires2fa: true, pendingUser: pending };
  },

  async completeLogin2fa(userId: string, code: string): Promise<User> {
    const user = dbService.getUserById(userId);
    if (!user) throw new Error('User not found.');

    // Verify code on backend
    await smsVerificationService.verifyOtpCode(userId, code);

    // Successful 2FA: establish authenticated session
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.clearPending2fa();
    return user;
  },

  getPending2fa(): any | null {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      const data = sessionStorage.getItem('trustlend_pending_2fa');
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (Date.now() - parsed.createdAt > 10 * 60 * 1000) {
        sessionStorage.removeItem('trustlend_pending_2fa');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  clearPending2fa(): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('trustlend_pending_2fa');
      }
    } catch {}
  },

  async login(credentials: LoginCredentials): Promise<User> {
    const res = await this.initiateLogin(credentials);
    if (res.requires2fa) {
      throw new Error('2FA_REQUIRED');
    }
    return res.user!;
  },

  register(data: RegisterData): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!data.fullName.trim()) {
          reject(new Error('Please enter your full legal name.'));
          return;
        }
        if (!data.email || !data.email.includes('@')) {
          reject(new Error('Please enter a valid email address.'));
          return;
        }
        if (!data.phone || !data.phone.trim()) {
          reject(new Error('Please provide your mobile phone number.'));
          return;
        }
        if (!data.acceptTerms) {
          reject(new Error('You must accept the terms of service to proceed.'));
          return;
        }

        const normalizedEmail = data.email.trim().toLowerCase();
        const existingUser = dbService.getUserByEmail(normalizedEmail);

        if (existingUser && existingUser.id !== DEMO_BORROWER_ID && existingUser.id !== DEMO_LENDER_ID) {
          reject(new Error('An account with this email address already exists. Please sign in.'));
          return;
        }

        const normalizedDigits = data.phone.replace(/\D/g, '');
        const normalizedPhone = `${data.phoneDialCode}${normalizedDigits}`;

        // Create new regular user with phoneVerified: false, identityStatus: 'not_started', and roleSelected: false
        const user: User = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          name: data.fullName.trim(),
          email: normalizedEmail,
          role: 'borrower', // Initial default until Choose Your Path selection
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.fullName.trim())}`,
          createdAt: new Date().toISOString(),
          phone: normalizedPhone,
          phoneRegion: data.phoneRegion,
          phoneDialCode: data.phoneDialCode,
          phoneVerified: false,
          roleSelected: false,
          identityStatus: 'not_started',
          kycVerified: false,
          walletBalance: 0,
          isTestAccount: false,
        };
        dbService.saveUser(user);

        // Securely hash and store user password credential in internal backend store
        if (data.password) {
          hashPassword(data.password).then(({ hash }) => {
            dbService.saveCredential(user.id, hash);
          }).catch(console.error);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        resolve(user);
      }, 300);
    });
  },

  updateSessionUser(user: User): void {
    try {
      dbService.saveUser(user);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.error('Failed to update session user:', e);
    }
  },

  switchRole(newRole: UserRole): Promise<User | null> {
    return new Promise((resolve) => {
      const current = this.getCurrentUser();
      if (!current) {
        resolve(null);
        return;
      }
      const updated: User = {
        ...current,
        role: newRole,
        roleSelected: true,
      };
      dbService.saveUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      resolve(updated);
    });
  },

  clearSession(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('trustlend_home_selected_path');
        sessionStorage.removeItem('trustlend_calc_amount');
        sessionStorage.removeItem('trustlend_calc_months');
      }
    } catch {}
  },

  logout(): Promise<void> {
    return new Promise((resolve) => {
      this.clearSession();
      resolve();
    });
  }
};
