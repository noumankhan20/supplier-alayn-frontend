"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { verifySession } from "@/redux/slices/authSlice";
import AuthLoader from "./AuthLoader";

interface GuestGuardProps {
  children: React.ReactNode;
}

export default function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [nextParam, setNextParam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setNextParam(params.get("next"));
    }
  }, []);

  const status = useAppSelector((s) => s.auth.status);
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (status === "unknown") {
      void dispatch(verifySession());
    }
  }, [status, dispatch]);

  useEffect(() => {
    // Only redirect if already authenticated AS A SUPPLIER
    if (status === "authenticated" && user?.role === "SUPPLIER") {
      const next = nextParam || "/orders";
      router.replace(next);
    }
  }, [status, user, router, nextParam]);

  // If authenticated as a supplier, hold while redirecting to orders
  if (status === "authenticated" && user?.role === "SUPPLIER") {
    return <AuthLoader message="Taking you to your supplier dashboard..." />;
  }

  // Allow unauthenticated visitors or non-supplier sessions to view login/signup
  return <>{children}</>;
}
