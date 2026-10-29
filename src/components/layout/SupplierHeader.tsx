"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Layers,
  User,
  LogOut,
  ChevronDown,
  ExternalLink,
  Store,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { useLogoutMutation } from "@/redux/slices/authApiSlice";
import { logout } from "@/redux/slices/authSlice";
import { baseApi } from "@/redux/store/baseApi";
import { MAIN_APP_URL } from "@/lib/apiBase";

export default function SupplierHeader() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [logoutApi] = useLogoutMutation();
  const user = useAppSelector((state) => state.auth.user);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "S";

  const navLinks = [
    { label: "Purchase Orders", href: "/orders", icon: Package, exact: true },
    { label: "My Catalog", href: "/catalog", icon: Layers },
    { label: "Profile & Business", href: "/profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-xs sm:px-6 lg:px-8">
      {/* Left: Brand Logo & Navigation */}
      <div className="flex items-center gap-6">
        <Link href="/orders" className="flex items-center gap-2.5">
          <Image
            src="/image1.png"
            alt="Alayn Logo"
            width={110}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Supplier Portal
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#1B2A4A]/5 text-[#1B2A4A] font-bold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-[#D3232A]" : "text-gray-400"
                  }`}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: User Profile Dropdown */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition"
          >
            <div className="h-8 w-8 rounded-full bg-[#D3232A] flex items-center justify-center text-xs font-bold text-white shadow-xs">
              {initial}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold text-gray-900 leading-tight">
                {user?.name || "Supplier"}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight">
                Vendor Account
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {user?.name || "Supplier"}
                </p>
                <p className="text-[11px] text-gray-400 font-medium truncate">
                  {user?.email || ""}
                </p>
                <span className="inline-block mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Verified Supplier
                </span>
              </div>

              <Link
                href="/orders"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                <Package className="h-4 w-4 text-gray-400" />
                Purchase Orders
              </Link>

              <Link
                href="/catalog"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                <Layers className="h-4 w-4 text-gray-400" />
                Catalog Management
              </Link>

              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                <User className="h-4 w-4 text-gray-400" />
                Profile &amp; Settings
              </Link>

              <a
                href={MAIN_APP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                <span className="flex items-center gap-2.5">
                  <Store className="h-4 w-4 text-gray-400" />
                  Alayn Restaurant OS
                </span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </a>

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                onClick={async () => {
                  setDropdownOpen(false);
                  try {
                    await logoutApi(undefined).unwrap();
                  } catch {
                    // ignore network errors
                  } finally {
                    dispatch(baseApi.util.resetApiState());
                    dispatch(logout());
                    window.location.href = "/login";
                  }
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition text-left"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

