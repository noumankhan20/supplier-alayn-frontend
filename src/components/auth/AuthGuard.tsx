"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { verifySession, logout, SESSION_FRESH_MS } from "@/redux/slices/authSlice";
import { MAIN_APP_URL } from "@/lib/apiBase";
import { ShieldAlert, LogOut, ArrowRight, Home } from "lucide-react";
import AuthLoader from "./AuthLoader";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const status = useAppSelector((s) => s.auth.status);
  const user = useAppSelector((s) => s.auth.user);
  const lastVerifiedAt = useAppSelector((s) => s.auth.lastVerifiedAt);
  const verifying = useAppSelector((s) => s.auth.verifying);

  useEffect(() => {
    if (status === "unauthenticated") return;
    const stale =
      lastVerifiedAt === null || Date.now() - lastVerifiedAt > SESSION_FRESH_MS;
    if (stale) {
      void dispatch(verifySession());
    }
  }, [status, lastVerifiedAt, dispatch]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status === "unknown" || verifying) {
    return <AuthLoader />;
  }

  if (status === "authenticated") {
    // Non-supplier accounts (e.g. restaurant owner/manager logged in on browser)
    if (user && user.role !== "SUPPLIER") {
      const roleLabel = (user.role || "").replace(/_/g, " ");
      return (
        <div className="min-h-screen bg-[#F4F7F9] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl ring-1 ring-black/5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#C41E2A] mb-4">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 font-serif">
              Supplier Access Only
            </h2>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              You are currently signed in as <span className="font-semibold text-gray-900">{user.name || user.email}</span> with the role <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-800">{roleLabel}</span>.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              This portal is strictly reserved for suppliers and vendors.
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  dispatch(logout());
                  router.push("/login");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C41E2A] py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-[#A81822] transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out & Switch to Supplier Account
              </button>

              <a
                href={`${MAIN_APP_URL}/dashboard`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                <span>Open Restaurant Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </a>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 pt-2"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Return to Supplier Homepage</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }

  return <AuthLoader message="Redirecting to login..." />;
}
