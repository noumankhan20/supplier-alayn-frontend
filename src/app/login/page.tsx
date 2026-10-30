"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useLoginMutation } from "@/redux/slices/authApiSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { setCredentials, logout } from "@/redux/slices/authSlice";
import { MAIN_APP_URL } from "@/lib/apiBase";
import { useShake } from "@/lib/useShake";
import { useHydrated } from "@/lib/useHydrated";
import { apiErrorMessage } from "@/lib/apiError";
import { safeNextPath, userFromResponse } from "@/lib/authSession";
import { writeUserHint } from "@/components/landing/landingSession";
import AuthShowcase from "@/components/auth/AuthShowcase";
import GuestGuard from "@/components/auth/GuestGuard";
import AuthLoader from "@/components/auth/AuthLoader";

function LoginFormContent() {
  const hydrated = useHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector((s) => s.auth.user);
  const currentStatus = useAppSelector((s) => s.auth.status);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const credentialsRef = useShake<HTMLDivElement>(errorCount);

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      setErrorCount((n) => n + 1);
      return;
    }

    try {
      const response = await login({
        email: email.trim(),
        password,
      }).unwrap();

      const user = userFromResponse(response);
      const role = user?.role;

      // The server already refuses non-suppliers on this portal; this is a second line of defence.
      if (!user || role !== "SUPPLIER") {
        dispatch(logout());
        const roleLabel = (role || "").replace(/_/g, " ");
        setError(
          `This account has the role "${roleLabel}" on Alayn Restaurant OS. The Supplier Portal is exclusively for vendors and suppliers. If you need to access your restaurant, please open Alayn Restaurant OS.`
        );
        setErrorCount((n) => n + 1);
        return;
      }

      dispatch(setCredentials({ user }));
      writeUserHint(user);
      router.replace(safeNextPath(searchParams.get("next")));
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid email or password."));
      setErrorCount((n) => n + 1);
    }
  };

  const errorInputClasses =
    "block w-full border-b border-[#C41E2A]/50 py-2 pl-9 pr-3 text-[#1B2A4A] placeholder:text-[#6B7A90] bg-transparent transition-all duration-300 focus:border-[#C41E2A] focus:shadow-[0_4px_12px_rgba(196,30,42,0.08)] focus:outline-none focus:ring-0 text-xs sm:text-sm";
  const inputClasses =
    "block w-full border-b border-[#1B2A4A]/20 py-2 pl-9 pr-3 text-[#1B2A4A] placeholder:text-[#6B7A90] bg-transparent transition-all duration-300 focus:border-[#C41E2A] focus:shadow-[0_4px_12px_rgba(196,30,42,0.08)] focus:outline-none focus:ring-0 text-xs sm:text-sm";

  return (
    <div className="relative flex flex-col lg:flex-row min-h-screen bg-white font-sans overflow-hidden">
      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-50 flex items-center gap-1.5 text-[#1B2A4A]/60 hover:text-[#1B2A4A] bg-[#F4F5F8] hover:bg-[#E8ECF1] px-3 py-1.5 rounded-lg border border-[#1B2A4A]/10 transition-all duration-300 group shadow-2xs"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-xs font-bold">Back</span>
      </Link>

      {/* Left Pane: Form */}
      <div className="flex-1 lg:flex-initial lg:w-[45%] xl:w-[40%] flex flex-col justify-between px-6 sm:px-10 py-6 lg:py-8 z-10 relative bg-white border-r border-[#1B2A4A]/10 overflow-y-auto no-scrollbar h-full">
        <div className="w-full max-w-md mx-auto relative z-10 my-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6 pt-2">
            <Link href="/">
              <Image
                src="/gptlogo.png"
                alt="Alayn Suppliers"
                sizes="360px"
                width={1280}
                height={297}
                style={{
                  height: "46px",
                  width: "auto",
                  transform: "scale(1.75)",
                  transformOrigin: "center center",
                }}
                className="w-auto object-contain"
                priority
              />
            </Link>
          </div>

          <div className="text-center lg:text-left mb-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Supplier Vendor Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B2A4A] font-serif">
              Welcome back
            </h2>
            <p className="mt-1 text-xs text-[#6B7A90] font-medium leading-normal">
              Sign in with your vendor account to receive purchase orders and manage catalog items.
            </p>
          </div>

          {currentStatus === "authenticated" && currentUser && currentUser.role !== "SUPPLIER" && (
            <div className="mb-4 rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">Active Restaurant Session</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Signed in as {currentUser.name || currentUser.email} ({currentUser.role?.replace(/_/g, " ")})
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch(logout())}
                className="shrink-0 text-xs font-bold text-amber-900 underline hover:text-amber-950"
              >
                Sign Out
              </button>
            </div>
          )}

          <form className="space-y-4" method="post" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-[#C41E2A]/10 p-3.5 text-xs sm:text-sm text-[#C41E2A] border border-[#C41E2A]/20 font-medium space-y-2">
                <p>{error}</p>
                {error.includes("Restaurant OS") && (
                  <a
                    href={MAIN_APP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-[#C41E2A] underline hover:text-[#9B131E]"
                  >
                    Open Restaurant OS &rarr;
                  </a>
                )}
              </div>
            )}

            <div ref={credentialsRef} className="t-input space-y-4">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                >
                  Email Address
                </label>
                <div className="relative mt-1 group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                    <Mail
                      className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="orders@supplier.com"
                    className={error ? errorInputClasses : inputClasses}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90]"
                  >
                    Password
                  </label>
                  <a
                    href={`${MAIN_APP_URL}/forgot-password`}
                    className="text-[11px] font-semibold text-[#C41E2A] hover:underline"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative mt-1 group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                    <Lock
                      className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="••••••••••••"
                    className={`${error ? errorInputClasses : inputClasses} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#1B2A4A]/40 hover:text-[#1B2A4A] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !hydrated}
              className="mt-6 flex w-full justify-center items-center gap-2 rounded-lg bg-[#C41E2A] py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#A81822] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#C41E2A] focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Supplier Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#6B7A90]">
              New vendor on the network?{" "}
              <Link
                href="/signup"
                className="font-bold text-[#C41E2A] hover:underline"
              >
                Join as a Supplier &rarr;
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="w-full max-w-md mx-auto pt-4 mt-auto border-t border-[#1B2A4A]/10 text-center text-[11px] text-[#6B7A90]">
          <p>© 2026 Alayn Technologies. All rights reserved.</p>
        </div>
      </div>

      {/* Right Pane: Visual Showcase */}
      <AuthShowcase />
    </div>
  );
}

export default function LoginPage() {
  return (
    <GuestGuard>
      <Suspense fallback={<AuthLoader message="Loading portal..." />}>
        <LoginFormContent />
      </Suspense>
    </GuestGuard>
  );
}
