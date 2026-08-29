import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AddTransactionModal } from '../transactions/AddTransactionModal';

export const Layout = () => {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#05070E] text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Top luminous accent beam */}
      <div className="fintech-accent-beam" />

      {/* Layered ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top center glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-indigo-500/15 via-purple-600/10 to-transparent blur-[120px] rounded-full" />
        {/* Top right cyan aura */}
        <div className="absolute top-10 right-[-100px] w-[500px] h-[500px] bg-cyan-500/10 blur-[130px] rounded-full" />
        {/* Bottom left violet aura */}
        <div className="absolute bottom-[-100px] left-[10%] w-[600px] h-[500px] bg-violet-600/10 blur-[140px] rounded-full" />
        {/* Dot grid pattern matrix overlay */}
        <div className="absolute inset-0 fintech-bg-grid opacity-60" />
      </div>

      {/* Fixed Left Sidebar (Desktop) */}
      <div className="hidden md:block relative z-30">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Navbar onOpenAddTransaction={() => setIsAddTransactionOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet context={{ onOpenAddTransaction: () => setIsAddTransactionOpen(true) }} />
        </main>
      </div>

      {/* Global Add Transaction Modal */}
      {isAddTransactionOpen && (
        <AddTransactionModal
          isOpen={isAddTransactionOpen}
          onClose={() => setIsAddTransactionOpen(false)}
          onSuccess={() => {
            setIsAddTransactionOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
