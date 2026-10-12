import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 py-4 px-4 sm:px-8 text-center text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <p>© {new Date().getFullYear()} TrustLend Financial Technologies India. All rights reserved.</p>
        <p className="text-slate-400">
          Peer-to-Peer Lending Marketplace Facilitator • Escrow Protected
        </p>
      </div>
    </footer>
  );
};
