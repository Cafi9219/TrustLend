import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { HowItWorksPage } from '../pages/HowItWorksPage';
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProfilePage } from '../pages/ProfilePage';

// Borrower Pages
import { BorrowerDashboardPage } from '../pages/borrower/BorrowerDashboardPage';
import { MyLoansPage } from '../pages/borrower/MyLoansPage';
import { LoanApplicationsPage } from '../pages/borrower/LoanApplicationsPage';
import { LoanDetailsPage } from '../pages/borrower/LoanDetailsPage';
import { RepaymentStatusPage } from '../pages/borrower/RepaymentStatusPage';

// Lender Pages
import { LenderDashboardPage } from '../pages/lender/LenderDashboardPage';
import { BrowseOpportunitiesPage } from '../pages/lender/BrowseOpportunitiesPage';
import { InvestmentsPage } from '../pages/lender/InvestmentsPage';
import { ReturnsPage } from '../pages/lender/ReturnsPage';

import { useAuthMock } from '../hooks/useAuthMock';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';

const LAST_ROUTE_KEY = 'trustlend_last_active_route';

/**
 * Route persistence behavior:
 * - On explicit page refresh / reload: starts on the landing page ('/').
 * - When coming into the page / reopening the browser (non-reload): preserves where the user left off.
 * - Saves active non-root routes as user navigates.
 */
const RoutePersistenceManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    let isReload = false;
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        isReload = (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
      } else if (performance.navigation) {
        isReload = performance.navigation.type === 1;
      }
    } catch {
      isReload = false;
    }

    if (isReload) {
      // User pressed browser refresh: clear saved route and start on landing page
      localStorage.removeItem(LAST_ROUTE_KEY);
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    } else {
      // Non-refresh: coming into the page without reload
      // If opened at root '/', check if user left off on a specific page earlier
      const savedRoute = localStorage.getItem(LAST_ROUTE_KEY);
      if (savedRoute && savedRoute !== '/' && location.pathname === '/') {
        navigate(savedRoute, { replace: true });
      }
    }
  }, []);

  // Save current route whenever navigating (excluding login/register/home)
  useEffect(() => {
    if (location.pathname && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register') {
      localStorage.setItem(LAST_ROUTE_KEY, location.pathname);
    }
  }, [location.pathname]);

  return null;
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { currentUser, isLoading } = useAuthMock();
  if (isLoading) return null;
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={currentUser.role === 'borrower' ? '/borrower/dashboard' : '/lender/dashboard'} replace />;
  }
  return <>{children}</>;
};

const DashboardRedirect: React.FC = () => {
  const { currentUser } = useAuthMock();
  if (!currentUser) return <Navigate to="/login" replace />;
  return currentUser.role === 'borrower'
    ? <Navigate to="/borrower/dashboard" replace />
    : <Navigate to="/lender/dashboard" replace />;
};

const NotFoundPage: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
      <ShieldAlert className="w-8 h-8" />
    </div>
    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Page Not Found</h1>
    <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm">
      The requested route could not be found. Return to the TrustLend homepage.
    </p>
    <Link
      to="/"
      className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Return to Homepage
    </Link>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <>
      <RoutePersistenceManager />
      <Routes>
        <Route element={<MainLayout />}>
          {/* Core Global Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Borrower-Only Routes */}
          <Route path="/borrower/dashboard" element={
            <ProtectedRoute allowedRole="borrower">
              <BorrowerDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/borrower/my-loans" element={
            <ProtectedRoute allowedRole="borrower">
              <MyLoansPage />
            </ProtectedRoute>
          } />
          <Route path="/borrower/applications" element={
            <ProtectedRoute allowedRole="borrower">
              <LoanApplicationsPage />
            </ProtectedRoute>
          } />
          <Route path="/borrower/requests/:id" element={
            <ProtectedRoute allowedRole="borrower">
              <LoanDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/borrower/repayments" element={
            <ProtectedRoute allowedRole="borrower">
              <RepaymentStatusPage />
            </ProtectedRoute>
          } />

          {/* Lender-Only Routes */}
          <Route path="/lender/dashboard" element={
            <ProtectedRoute allowedRole="lender">
              <LenderDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/lender/browse" element={
            <ProtectedRoute allowedRole="lender">
              <BrowseOpportunitiesPage />
            </ProtectedRoute>
          } />
          <Route path="/lender/investments" element={
            <ProtectedRoute allowedRole="lender">
              <InvestmentsPage />
            </ProtectedRoute>
          } />
          <Route path="/lender/returns" element={
            <ProtectedRoute allowedRole="lender">
              <ReturnsPage />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
};
