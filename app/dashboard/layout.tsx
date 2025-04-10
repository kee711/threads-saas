import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="h-[calc(100vh-48px)] m-6 mb-0 rounded-xl border overflow-y-auto border-slate-300 px-6 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      {children}
    </div>
  );
}

