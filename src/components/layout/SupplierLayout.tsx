"use client";

import React from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import SupplierHeader from "./SupplierHeader";

interface SupplierLayoutProps {
  children: React.ReactNode;
}

export default function SupplierLayout({ children }: SupplierLayoutProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-[#F4F7F9]">
        <SupplierHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

