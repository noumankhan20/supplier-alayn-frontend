"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Lock,
  Truck,
  MapPin,
  Tag,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useRegisterSupplierMutation } from "@/redux/slices/authApiSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { setCredentials, logout } from "@/redux/slices/authSlice";
import { passwordProblem } from "@/lib/passwordPolicy";
import { MAIN_APP_URL } from "@/lib/apiBase";
import { useShake } from "@/lib/useShake";
import { useHydrated } from "@/lib/useHydrated";
import { apiErrorMessage } from "@/lib/apiError";
import { userFromResponse } from "@/lib/authSession";
import { writeUserHint } from "@/components/landing/landingSession";
import AuthShowcase from "@/components/auth/AuthShowcase";
import GuestGuard from "@/components/auth/GuestGuard";

const SUPPLY_CATEGORIES = [
  "Dairy & Eggs",
  "Vegetables & Fresh Produce",
  "Meat, Poultry & Seafood",
  "Dry Goods & Grains",
  "Oils & Condiments",
  "Spices & Seasonings",
  "Bakery & Bread",
  "Beverages & Syrups",
  "Packaging & Disposables",
  "Cleaning & Hygiene",
  "General Wholesale",
];

function SignupFormContent() {
  const hydrated = useHydrated();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const currentStatus = useAppSelector((s) => s.auth.status);
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Account
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Step 2: Business
    supplierName: "",
    supplierCategory: "Dairy & Eggs",
    supplierAddress: "",
    supplierDeliveryTerms: "",
    supplierGst: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [registerSupplier, { isLoading }] = useRegisterSupplierMutation();

  const shakeRef = useShake<HTMLDivElement>(shakeKey);

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;

    if (!formData.fullName.trim()) errors.fullName = "Full name is required.";
    if (!formData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(formData.phone)) {
      errors.phone = "Enter a valid phone number (at least 10 digits).";
    }

    const pwProb = passwordProblem(formData.password);
    if (pwProb) {
      errors.password = pwProb;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) setShakeKey((k) => k + 1);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.supplierName.trim()) {
      errors.supplierName = "Supplier or Company name is required.";
    }
    if (!formData.supplierAddress.trim()) {
      errors.supplierAddress = "Warehouse / Dispatch address is required.";
    }
    if (!formData.supplierCategory.trim()) {
      errors.supplierCategory = "Supply category is required.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) setShakeKey((k) => k + 1);
    return Object.keys(errors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (!validateStep2()) return;

    try {
      const res = await registerSupplier({
        user: {
          name: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phoneNo: formData.phone.trim(),
        },
        supplier: {
          name: formData.supplierName.trim(),
          contactPerson: formData.fullName.trim(),
          address: formData.supplierAddress.trim(),
          category: formData.supplierCategory || "General Wholesale",
          deliveryTerms: formData.supplierDeliveryTerms.trim() || undefined,
          gstNumber: formData.supplierGst.trim() || undefined,
        },
      }).unwrap();

      const user = userFromResponse(res);
      if (user) {
        dispatch(setCredentials({ user }));
        writeUserHint(user);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.replace("/orders");
      }, 1200);
    } catch (err) {
      setSubmitError(apiErrorMessage(err, "Failed to register supplier. Please try again."));
      setShakeKey((k) => k + 1);
    }
  };

  const inputClasses =
    "block w-full border-b border-[#1B2A4A]/20 py-2 pl-9 pr-3 text-[#1B2A4A] placeholder:text-[#6B7A90] bg-transparent transition-all duration-300 focus:border-[#C41E2A] focus:shadow-[0_4px_12px_rgba(196,30,42,0.08)] focus:outline-none focus:ring-0 text-xs sm:text-sm [&>option]:text-[#1B2A4A]";
  const errorInputClasses =
    "block w-full border-b border-[#C41E2A]/50 py-2 pl-9 pr-3 text-[#1B2A4A] placeholder:text-[#6B7A90] bg-transparent transition-all duration-300 focus:border-[#C41E2A] focus:shadow-[0_4px_12px_rgba(196,30,42,0.08)] focus:outline-none focus:ring-0 text-xs sm:text-sm [&>option]:text-[#1B2A4A]";

  return (
    <div className="relative flex flex-col lg:flex-row h-screen max-h-screen bg-white font-sans overflow-hidden">
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
        <div className="w-full max-w-sm mx-auto relative z-10 my-auto">
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

          <div className="text-center lg:text-left mb-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Vendor Partner Onboarding
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B2A4A] font-serif">
              Join as a supplier
            </h2>
            <p className="mt-1 text-xs text-[#6B7A90] font-medium leading-normal">
              Register your business to receive purchase orders from leading restaurants on Alayn.
            </p>
          </div>

          {/* 2-Step Progress Indicator */}
          <div className="mb-5 flex items-center justify-between gap-2 border-b border-[#1B2A4A]/10 pb-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1 ? "bg-[#C41E2A] text-white" : "bg-emerald-500 text-white"
                }`}
              >
                {step === 1 ? "1" : "✓"}
              </div>
              <span className="text-xs font-bold text-[#1B2A4A]">Account</span>
            </div>
            <div className="h-px flex-1 bg-[#1B2A4A]/10 mx-2" />
            <div className="flex items-center gap-2">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2 ? "bg-[#C41E2A] text-white" : "bg-zinc-200 text-zinc-600"
                }`}
              >
                2
              </div>
              <span
                className={`text-xs font-bold ${
                  step === 2 ? "text-[#1B2A4A]" : "text-zinc-400"
                }`}
              >
                Company Details
              </span>
            </div>
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

          {submitError && (
            <div className="mb-4 rounded-xl bg-[#C41E2A]/10 p-3.5 text-xs text-[#C41E2A] border border-[#C41E2A]/20 font-medium">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="mb-4 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              Account created successfully! Redirecting to your dashboard...
            </div>
          )}

          <div ref={shakeRef} className="t-input">
            {step === 1 ? (
              /* STEP 1: Account Credentials */
              <form onSubmit={handleNext} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Primary Contact Name
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <User className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange("fullName")}
                      placeholder="Aquib Hingwala"
                      className={fieldErrors.fullName ? errorInputClasses : inputClasses}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-xs font-medium text-[#C41E2A]">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Vendor Email Address
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Mail className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange("email")}
                      placeholder="orders@supplier.com"
                      className={fieldErrors.email ? errorInputClasses : inputClasses}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs font-medium text-[#C41E2A]">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Dispatch / Order Phone
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Phone className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange("phone")}
                      placeholder="+91 98765 43210"
                      className={fieldErrors.phone ? errorInputClasses : inputClasses}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs font-medium text-[#C41E2A]">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Password
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Lock className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange("password")}
                      placeholder="At least 8 characters"
                      className={(fieldErrors.password ? errorInputClasses : inputClasses).replace("pr-3", "pr-8")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#1B2A4A]/40 hover:text-[#1B2A4A]"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs font-medium text-[#C41E2A]">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Lock className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange("confirmPassword")}
                      placeholder="••••••••"
                      className={(fieldErrors.confirmPassword ? errorInputClasses : inputClasses).replace("pr-3", "pr-8")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#1B2A4A]/40 hover:text-[#1B2A4A]"
                    >
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs font-medium text-[#C41E2A]">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C41E2A] px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#b01e23] transition-all duration-300 hover:-translate-y-[1px] cursor-pointer"
                  >
                    Continue to Business Profile
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: Supplier Business Profile */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Company Name */}
                <div>
                  <label
                    htmlFor="supplierName"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Supplier / Company Name
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Truck className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="supplierName"
                      type="text"
                      required
                      value={formData.supplierName}
                      onChange={handleChange("supplierName")}
                      placeholder="e.g. Fresh Dairy Wholesale Ltd."
                      className={fieldErrors.supplierName ? errorInputClasses : inputClasses}
                    />
                  </div>
                  {fieldErrors.supplierName && (
                    <p className="mt-1 text-xs font-medium text-[#C41E2A]">{fieldErrors.supplierName}</p>
                  )}
                </div>

                {/* Supply Category */}
                <div>
                  <label
                    htmlFor="supplierCategory"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Primary Supply Category
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Tag className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <select
                      id="supplierCategory"
                      value={formData.supplierCategory}
                      onChange={handleChange("supplierCategory")}
                      className={inputClasses}
                    >
                      {SUPPLY_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Warehouse Address */}
                <div>
                  <label
                    htmlFor="supplierAddress"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Warehouse / Dispatch Address
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-start pt-2 pl-1">
                      <MapPin className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <textarea
                      id="supplierAddress"
                      rows={2}
                      required
                      value={formData.supplierAddress}
                      onChange={handleChange("supplierAddress")}
                      placeholder="Full facility or depot address, City, State, PIN"
                      className={fieldErrors.supplierAddress ? errorInputClasses : inputClasses}
                    />
                  </div>
                  {fieldErrors.supplierAddress && (
                    <p className="mt-1 text-xs font-medium text-[#C41E2A]">{fieldErrors.supplierAddress}</p>
                  )}
                </div>

                {/* Delivery Terms */}
                <div>
                  <label
                    htmlFor="supplierDeliveryTerms"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Delivery &amp; Payment Terms (Optional)
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Tag className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="supplierDeliveryTerms"
                      type="text"
                      value={formData.supplierDeliveryTerms}
                      onChange={handleChange("supplierDeliveryTerms")}
                      placeholder="e.g. Next day before 9 AM, Net 15 days"
                      className={inputClasses}
                    />
                  </div>
                </div>

                {/* GST Number */}
                <div>
                  <label
                    htmlFor="supplierGst"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    GSTIN / Tax ID (Optional)
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Tag className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="supplierGst"
                      type="text"
                      value={formData.supplierGst}
                      onChange={handleChange("supplierGst")}
                      placeholder="e.g. 27AAACA1234A1Z5"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-zinc-300 py-2.5 sm:py-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !hydrated}
                    className="flex-2 flex items-center justify-center gap-2 rounded-xl bg-[#C41E2A] py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#b01e23] disabled:opacity-50 transition"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        Complete Registration
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-[#1B2A4A]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B7A90] font-medium gap-2">
            <p>
              Already a supplier?{" "}
              <Link href="/login" className="font-semibold text-[#C41E2A] hover:text-[#b01e23] transition-colors">
                Sign In
              </Link>
            </p>
            <a
              href={MAIN_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-zinc-800 hover:text-[#C41E2A] transition-colors flex items-center gap-1"
            >
              Restaurant Portal ↗
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-sm mx-auto mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#6B7A90] font-medium border-t border-[#1B2A4A]/10 pt-4">
          <span>© 2026 Alayn AI. All rights reserved.</span>
          <div className="flex gap-3">
            <a href={`${MAIN_APP_URL}/legal/privacy`} className="hover:text-[#1B2A4A] transition-colors">
              Privacy
            </a>
            <a href={`${MAIN_APP_URL}/legal/terms`} className="hover:text-[#1B2A4A] transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* Right Pane: Interactive Showcase */}
      <div className="hidden lg:block lg:flex-1 relative">
        <AuthShowcase />
      </div>
    </div>
  );
}

export default function SupplierSignupPage() {
  return (
    <GuestGuard>
      <SignupFormContent />
    </GuestGuard>
  );
}
