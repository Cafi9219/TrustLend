import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { useAuthMock } from '../hooks/useAuthMock';

export const MainLayout: React.FC = () => {
  const { currentUser } = useAuthMock();
  const location = useLocation();

  // If unauthenticated visitor is on Homepage ('/'), PublicLandingView manages its own dedicated layout
  const isPublicLanding = !currentUser && location.pathname === '/';

  if (isPublicLanding) {
    return <Outlet />;
  }

  // Auth pages (/login and /register): Primary viewport is 100vh so form is visible at one sight, footer comes on scroll
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-blue-600 selection:text-white">
        {/* 1. Primary Fullscreen Viewport (Takes 100vh so form is visible at one sight) */}
        <section className="min-h-screen flex flex-col justify-between relative">
          <Navbar />
          <main className="flex-1 flex items-center justify-center py-3 sm:py-6 px-4 sm:px-6">
            <Outlet />
          </main>
        </section>

        {/* 2. Footer (Placed below 100vh fold, strictly visible upon scroll) */}
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* Sticky Main Navigation */}
      <Navbar />

      {/* Main Routed Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
