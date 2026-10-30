"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Check,
  Key,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Tag,
  MapPin,
  Truck,
} from "lucide-react";
import SupplierLayout from "@/components/layout/SupplierLayout";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { setCredentials } from "@/redux/slices/authSlice";
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "@/redux/slices/authApiSlice";
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} from "@/redux/slices/supplierApiSlice";
import { passwordProblem } from "@/lib/passwordPolicy";
import { apiErrorMessage } from "@/lib/apiError";

function getInitials(name: string): string {
  if (!name) return "S";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function SupplierProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  // Business Profile Query & Mutation
  const { data: supplierProfile } =
    useGetMyProfileQuery();
  const [updateSupplierProfile, { isLoading: isUpdatingSupplier }] =
    useUpdateMyProfileMutation();

  // User Account Mutations
  const [updateProfile, { isLoading: isSavingUser }] =
    useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPw }] =
    useChangePasswordMutation();

  // 1. Business Profile Form State
  const [supplierEditMode, setSupplierEditMode] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    category: "",
    gstNumber: "",
    deliveryTerms: "",
  });
  const [supplierSuccessMsg, setSupplierSuccessMsg] = useState<string | null>(
    null
  );
  const [supplierErrorMsg, setSupplierErrorMsg] = useState<string | null>(null);

  // Refill the form whenever a new copy of the profile arrives (first load, or after a save).
  // Done during render rather than in an effect, so the form never renders once with stale values.
  const [syncedProfile, setSyncedProfile] = useState<typeof supplierProfile>(undefined);
  if (supplierProfile && supplierProfile !== syncedProfile) {
    setSyncedProfile(supplierProfile);
    setSupplierForm({
      name: supplierProfile.name || "",
      contactPerson: supplierProfile.contactPerson || "",
      phone: supplierProfile.phone || "",
      email: supplierProfile.email || "",
      address: supplierProfile.address || "",
      category: supplierProfile.category || "",
      gstNumber: supplierProfile.gstNumber || "",
      deliveryTerms: supplierProfile.deliveryTerms || "",
    });
  }

  const handleSupplierSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupplierSuccessMsg(null);
    setSupplierErrorMsg(null);

    if (!supplierForm.name.trim()) {
      setSupplierErrorMsg("Company / Supplier Name is required.");
      return;
    }

    try {
      await updateSupplierProfile({
        name: supplierForm.name.trim(),
        contactPerson: supplierForm.contactPerson.trim() || undefined,
        phone: supplierForm.phone.trim() || undefined,
        email: supplierForm.email.trim() || undefined,
        address: supplierForm.address.trim() || undefined,
        category: supplierForm.category.trim() || undefined,
        gstNumber: supplierForm.gstNumber.trim() || undefined,
        deliveryTerms: supplierForm.deliveryTerms.trim() || undefined,
      }).unwrap();
      setSupplierSuccessMsg("Business profile updated successfully!");
      setSupplierEditMode(false);
      setTimeout(() => setSupplierSuccessMsg(null), 4000);
    } catch (err) {
      setSupplierErrorMsg(apiErrorMessage(err, "Failed to update business profile."));
    }
  };

  // 2. Personal Profile Form State
  const [userEditMode, setUserEditMode] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: user?.name || "",
    phoneNo: user?.phoneNo || "",
  });
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);
  const [userErrorMsg, setUserErrorMsg] = useState<string | null>(null);

  // Same for the signed-in user's details
  const [syncedUser, setSyncedUser] = useState(user);
  if (user !== syncedUser) {
    setSyncedUser(user);
    setUserFormData({
      name: user?.name || "",
      phoneNo: user?.phoneNo || "",
    });
  }

  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSuccessMsg(null);
    setUserErrorMsg(null);

    if (!userFormData.name.trim()) {
      setUserErrorMsg("Name cannot be empty.");
      return;
    }

    try {
      const res = await updateProfile({
        name: userFormData.name.trim(),
        phoneNo: userFormData.phoneNo.trim(),
      }).unwrap();
      const updatedUser = res?.data || res;
      dispatch(setCredentials({ user: updatedUser }));
      setUserSuccessMsg("Personal details updated!");
      setUserEditMode(false);
      setTimeout(() => setUserSuccessMsg(null), 4000);
    } catch (err) {
      setUserErrorMsg(apiErrorMessage(err, "Failed to update personal details."));
    }
  };

  // 3. Password Section State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);
  const [pwErrorMsg, setPwErrorMsg] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccessMsg(null);
    setPwErrorMsg(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErrorMsg("New passwords do not match.");
      return;
    }
    const prob = passwordProblem(pwForm.newPassword);
    if (prob) {
      setPwErrorMsg(prob);
      return;
    }

    try {
      await changePassword({
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      }).unwrap();
      setPwSuccessMsg("Password updated successfully!");
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
      setTimeout(() => setPwSuccessMsg(null), 4000);
    } catch (err) {
      setPwErrorMsg(apiErrorMessage(err, "Failed to update password."));
    }
  };

  const initials = getInitials(user?.name || "");

  return (
    <SupplierLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header Title */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1B2A4A]">
              Vendor Profile &amp; Settings
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              Verified Partner
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Manage your company information, supply terms, login credentials, and security settings.
          </p>
        </div>

        {/* Global Notifications */}
        {supplierSuccessMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{supplierSuccessMsg}</span>
          </div>
        )}
        {userSuccessMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{userSuccessMsg}</span>
          </div>
        )}
        {pwSuccessMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pwSuccessMsg}</span>
          </div>
        )}

        {/* ─── 1. Supplier Business Profile Card ────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1B2A4A]/5 border border-[#1B2A4A]/10 text-[#1B2A4A] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1B2A4A]">
                  Supplier Business Profile
                </h3>
                <p className="text-[11px] text-gray-500">
                  Visible to restaurants when placing purchase orders
                </p>
              </div>
            </div>

            {supplierEditMode ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSupplierEditMode(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSupplierSave}
                  disabled={isUpdatingSupplier}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#D3232A] text-white hover:bg-[#b81d23] shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isUpdatingSupplier ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSupplierEditMode(true)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#1B2A4A] text-white hover:bg-[#121c33] shadow-xs flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Business Details
              </button>
            )}
          </div>

          <div className="p-6">
            {supplierErrorMsg && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{supplierErrorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-[#1B2A4A] mb-1.5">
                  Company / Supplier Business Name
                </label>
                {supplierEditMode ? (
                  <input
                    type="text"
                    value={supplierForm.name}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-xl font-bold text-gray-900">
                    {supplierForm.name || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#1B2A4A] mb-1.5">
                  Contact Person
                </label>
                {supplierEditMode ? (
                  <input
                    type="text"
                    value={supplierForm.contactPerson}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        contactPerson: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-xl font-semibold text-gray-800">
                    {supplierForm.contactPerson || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#1B2A4A] mb-1.5">
                  Supply Category
                </label>
                {supplierEditMode ? (
                  <input
                    type="text"
                    value={supplierForm.category}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-xl font-semibold text-gray-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <span>{supplierForm.category || "General"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#1B2A4A] mb-1.5">
                  GSTIN / Tax ID
                </label>
                {supplierEditMode ? (
                  <input
                    type="text"
                    value={supplierForm.gstNumber}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        gstNumber: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 uppercase font-mono bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-xl font-mono text-gray-800">
                    {supplierForm.gstNumber || "Not registered / None"}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#1B2A4A] mb-1.5">
                  Business Phone / WhatsApp
                </label>
                {supplierEditMode ? (
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-xl text-gray-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{supplierForm.phone || "Not specified"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#1B2A4A] mb-1.5">
                  Orders Contact Email
                </label>
                {supplierEditMode ? (
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-xl text-gray-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{supplierForm.email || "Not specified"}</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[#1B2A4A] mb-1.5">
                  Warehouse / Dispatch Address
                </label>
                {supplierEditMode ? (
                  <textarea
                    rows={2}
                    value={supplierForm.address}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-xl text-gray-800 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <span>{supplierForm.address || "Not specified"}</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[#1B2A4A] mb-1.5">
                  Delivery &amp; Payment Terms
                </label>
                {supplierEditMode ? (
                  <input
                    type="text"
                    value={supplierForm.deliveryTerms}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        deliveryTerms: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-xl text-gray-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      {supplierForm.deliveryTerms || "Standard terms apply"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. Personal Account Credentials Card ─────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D3232A]/5 border border-[#D3232A]/10 text-[#D3232A] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1B2A4A]">
                  Personal Login Details
                </h3>
                <p className="text-[11px] text-gray-500">
                  Your primary administrator account credentials
                </p>
              </div>
            </div>

            {userEditMode ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserEditMode(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUserSave}
                  disabled={isSavingUser}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#D3232A] text-white hover:bg-[#b81d23] shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSavingUser ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setUserEditMode(true)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-xs flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Account
              </button>
            )}
          </div>

          <div className="p-6">
            {userErrorMsg && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userErrorMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#D3232A] text-white flex items-center justify-center text-xl font-extrabold shadow-xs">
                {initials}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {user?.name || "Supplier User"}
                </h4>
                <p className="text-xs text-gray-400">{user?.email}</p>
                <span className="inline-block mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Supplier Role
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#1B2A4A] mb-1.5">
                  Full Name
                </label>
                {userEditMode ? (
                  <input
                    type="text"
                    value={userFormData.name}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-xl text-gray-800">
                    {user?.name || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#1B2A4A] mb-1.5">
                  Personal Contact Phone
                </label>
                {userEditMode ? (
                  <input
                    type="text"
                    value={userFormData.phoneNo}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        phoneNo: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-gray-100 rounded-xl text-gray-800">
                    {user?.phoneNo || "Not specified"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. Security & Password Card ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50/80 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1B2A4A]">
                  Security &amp; Password
                </h3>
                <p className="text-[11px] text-gray-500">
                  Update your vendor portal access password
                </p>
              </div>
            </div>
            {showPasswordSection ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showPasswordSection && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-100">
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                {pwErrorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pwErrorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-[#1B2A4A] mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPw ? "text" : "password"}
                        required
                        value={pwForm.oldPassword}
                        onChange={(e) =>
                          setPwForm({ ...pwForm, oldPassword: e.target.value })
                        }
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-9 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPw(!showOldPw)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showOldPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1B2A4A] mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        required
                        value={pwForm.newPassword}
                        onChange={(e) =>
                          setPwForm({ ...pwForm, newPassword: e.target.value })
                        }
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-9 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1B2A4A] mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        required
                        value={pwForm.confirmPassword}
                        onChange={(e) =>
                          setPwForm({
                            ...pwForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-9 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPw}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D3232A] text-white hover:bg-[#b81d23] shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5" />
                    {isChangingPw ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </SupplierLayout>
  );
}

