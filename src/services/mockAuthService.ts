import { User, UserRole } from '../types';
import { dbService, DEMO_BORROWER_ID, DEMO_LENDER_ID, DEMO_BORROWER_EMAIL, DEMO_LENDER_EMAIL } from './dbService';
import { hashPassword } from '../utils/security';

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

  login(credentials: LoginCredentials): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!credentials.email || !credentials.email.includes('@')) {
          reject(new Error('Please enter a valid email address.'));
          return;
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
          // If a new email is signing in directly
          const namePart = credentials.email.split('@')[0];
          const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          let assignedRole: UserRole = credentials.role || 'borrower';
          if (normalizedEmail.includes('lender')) {
            assignedRole = 'lender';
          } else if (normalizedEmail.includes('borrower')) {
            assignedRole = 'borrower';
          }

          user = {
            id: 'usr_' + Math.random().toString(36).substring(2, 9),
            name: formattedName,
            email: credentials.email.trim(),
            role: assignedRole,
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}`,
            createdAt: new Date().toISOString(),
            phone: '+91 98765 43210',
            phoneRegion: 'IN',
            phoneDialCode: '+91',
            phoneVerified: true,
            roleSelected: true,
            kycVerified: true,
          };
          dbService.saveUser(user);
        } else if (credentials.role && user.role !== credentials.role && user.id !== DEMO_BORROWER_ID && user.id !== DEMO_LENDER_ID) {
          user.role = credentials.role;
          user.roleSelected = true;
          dbService.saveUser(user);
        }

        // Store / update password credential in database for transaction verification
        if (credentials.password && user) {
          hashPassword(credentials.password).then(({ hash }) => {
            dbService.saveCredential(user!.id, hash);
          }).catch(console.error);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        resolve(user);
      }, 300);
    });
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

        // Create new regular user with phoneVerified: false and roleSelected: false
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
