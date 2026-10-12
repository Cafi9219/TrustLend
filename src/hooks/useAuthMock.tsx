import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockAuthService, LoginCredentials, RegisterData } from '../services/mockAuthService';
import { dbService } from '../services/dbService';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  switchRole: (newRole: UserRole) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isReload = false;
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        isReload = (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
      } else if (performance.navigation) {
        isReload = performance.navigation.type === 1;
      }
    } catch {}

    // Ensure specified account is completely purged from localStorage and active memory
    dbService.deleteAccountData('mayank889453@gmail.com');

    if (isReload) {
      // User pressed browser refresh: clear session to start fresh on landing page
      mockAuthService.clearSession();
      setCurrentUser(null);
    } else {
      // Re-opening or coming into the page: preserve session
      const existingUser = mockAuthService.getCurrentUser();
      if (
        existingUser &&
        (existingUser.email?.toLowerCase() === 'mayank889453@gmail.com' ||
         existingUser.name?.toLowerCase().includes('mayank bhardwaj'))
      ) {
        mockAuthService.clearSession();
        setCurrentUser(null);
      } else {
        setCurrentUser(existingUser);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const user = await mockAuthService.login(credentials);
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const user = await mockAuthService.register(data);
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (newRole: UserRole) => {
    setIsLoading(true);
    try {
      const updated = await mockAuthService.switchRole(newRole);
      setCurrentUser(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await mockAuthService.logout();
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, register, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthMock = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthMock must be used within an AuthProvider');
  }
  return context;
};
