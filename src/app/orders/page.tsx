"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Building2,
  FileText,
  Send,
  Eye,
  Loader2,
  Plus,
  Minus,
  Check,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SupplierLayout from "@/components/layout/SupplierLayout";
import { TModal } from "@/components/ui/TModal";
import {
  useGetSupplierPortalOrdersQuery,
  useUpdateSupplierPOStatusMutation,
  PurchaseOrderApi,
} from "@/redux/slices/procurementApiSlice";
import { useAppSelector } from "@/redux/store/hooks";
import { formatPrice } from "@/lib/utils";

function formatOrderNo(po: { id: string; poNumber?: string }): string {
  if (po.poNumber) return po.poNumber;
  return `PO-${po.id.slice(0, 5).toUpperCase()}`;
}

export default function SupplierDashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: purchaseOrders = [], isLoading, refetch } =
    useGetSupplierPortalOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateSupplierPOStatusMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "ACTION" | "DISPATCHED" | "RECEIVED" | "ALL"
  >("ACTION");

  // Modal State
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderApi | null>(null);
  const [actionModalType, setActionModalType] = useState<
    "DISPATCH" | "OUT_OF_STOCK" | "VIEW" | null
  >(null);

  // Form states for dispatch / partial
  const [dispatchInputs, setDispatchInputs] = useState<{ [itemId: string]: number }>({});
  const [supplierNotes, setSupplierNotes] = useState("");
  const [isPartialOrder, setIsPartialOrder] = useState(false);
  const [expectedNextDeliveryDate, setExpectedNextDeliveryDate] = useState("");

  // Metrics
  const actionRequiredCount = useMemo(() => {
    return purchaseOrders.filter(
      (po) => po.status === "SENT" || po.status === "PACKING"
    ).length;
  }, [purchaseOrders]);

  const dispatchedCount = useMemo(() => {
    return purchaseOrders.filter(
      (po) => po.status === "DISPATCHED" || po.status === "PARTIALLY_DISPATCHED"
    ).length;
  }, [purchaseOrders]);

  const completedCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "RECEIVED").length;
  }, [purchaseOrders]);

  // Tab Filtering logic
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        po.id.toLowerCase().includes(q) ||
        formatOrderNo(po).toLowerCase().includes(q) ||
        (po.outlet?.name && po.outlet.name.toLowerCase().includes(q));

      let matchesTab = true;
      if (activeTab === "ACTION") {
        matchesTab = po.status === "SENT" || po.status === "PACKING";
      } else if (activeTab === "DISPATCHED") {
        matchesTab =
          po.status === "DISPATCHED" || po.status === "PARTIALLY_DISPATCHED";
      } else if (activeTab === "RECEIVED") {
        matchesTab = po.status === "RECEIVED";
      }

      return matchesSearch && matchesTab;
    });
  }, [purchaseOrders, searchQuery, activeTab]);

  const handleOpenDispatchModal = (po: PurchaseOrderApi) => {
    setSelectedPO(po);
    const initialDispatch: { [itemId: string]: number } = {};
    po.items.forEach((item) => {
      initialDispatch[item.itemId] =
        item.dispatchedQuantity || item.orderedQuantity;
    });
    setDispatchInputs(initialDispatch);
    setSupplierNotes(po.supplierNotes || "");
    setIsPartialOrder(po.status === "PARTIALLY_DISPATCHED");
    setExpectedNextDeliveryDate(
      po.expectedNextDeliveryDate ? po.expectedNextDeliveryDate.split("T")[0] : ""
    );
    setActionModalType("DISPATCH");
  };

  const handleMarkPacking = async (po: PurchaseOrderApi) => {
    try {
      await updateStatus({
        id: po.id,
        status: "PACKING",
        supplierNotes: "Order is currently being packed for delivery",
      }).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update order status");
    }
  };

  const handleConfirmOutOfStock = async () => {
    if (!selectedPO) return;
    if (!supplierNotes.trim()) {
      return alert(
        "Please enter a short note explaining why this order is out of stock."
      );
    }

    try {
      await updateStatus({
        id: selectedPO.id,
        status: "OUT_OF_STOCK",
        supplierNotes,
      }).unwrap();
      setActionModalType(null);
      setSelectedPO(null);
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update order status");
    }
  };

  const handleConfirmDispatch = async () => {
    if (!selectedPO) return;

    const itemsPayload = Object.entries(dispatchInputs).map(([itemId, qty]) => ({
      itemId,
      dispatchedQuantity: Math.max(0, Number(qty) || 0),
    }));

    const totalDispatched = itemsPayload.reduce(
      (sum, item) => sum + item.dispatchedQuantity,
      0
    );
    if (totalDispatched <= 0) {
      return alert(
        "Dispatched quantity must be greater than 0 for at least one item."
      );
    }

    let isPartial = isPartialOrder;
    selectedPO.items.forEach((poItem) => {
      const dispatched =
        dispatchInputs[poItem.itemId] ?? poItem.orderedQuantity;
      if (dispatched < poItem.orderedQuantity) {
        isPartial = true;
      }
    });

    if (isPartial && !expectedNextDeliveryDate) {
      setIsPartialOrder(true);
      return alert(
        "This is a partial order. Please select an expected delivery date for remaining items."
      );
    }

    const targetStatus = isPartial ? "PARTIALLY_DISPATCHED" : "DISPATCHED";

    try {
      await updateStatus({
        id: selectedPO.id,
        status: targetStatus,
        supplierNotes,
        expectedNextDeliveryDate: isPartial ? expectedNextDeliveryDate : undefined,
        items: itemsPayload,
      }).unwrap();
      setActionModalType(null);
      setSelectedPO(null);
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to record dispatch");
    }
  };

  return (
    <SupplierLayout>
      <div className="space-y-6">
        {/* Welcome & Telemetry Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1B2A4A]">
                Incoming Purchase Orders
              </h1>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                Live Feed
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Welcome back,{" "}
              <span className="text-[#1B2A4A] font-bold">
                {user?.name || "Vendor Partner"}
              </span>
              . Fulfill store deliveries, record dispatch counts, and monitor completed orders.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-[#F8FAFC] px-5 py-3 rounded-xl border border-gray-200 text-xs shrink-0">
            <div className="text-center px-2">
              <span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider">
                Action Required
              </span>
              <span className="font-extrabold text-[#D3232A] text-base">
                {actionRequiredCount}
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="text-center px-2">
              <span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider">
                In Transit
              </span>
              <span className="font-extrabold text-indigo-600 text-base">
                {dispatchedCount}
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="text-center px-2">
              <span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider">
                Delivered
              </span>
              <span className="font-extrabold text-emerald-600 text-base">
                {completedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Tab & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("ACTION")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 ${
                activeTab === "ACTION"
                  ? "bg-[#D3232A] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Action Required ({actionRequiredCount})
            </button>
            <button
              onClick={() => setActiveTab("DISPATCHED")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 ${
                activeTab === "DISPATCHED"
                  ? "bg-[#1B2A4A] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Dispatched ({dispatchedCount})
            </button>
            <button
              onClick={() => setActiveTab("RECEIVED")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 ${
                activeTab === "RECEIVED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Delivered ({completedCount})
            </button>
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition shrink-0 ${
                activeTab === "ALL"
                  ? "bg-gray-800 text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All Orders ({purchaseOrders.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO # or store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A] focus:bg-white transition"
            />
          </div>
        </div>

        {/* Orders Listing */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-gray-200"
              >
                <Skeleton height={20} width={200} />
                <Skeleton height={14} width={300} className="mt-2" />
              </div>
            ))}
          </div>
        ) : filteredPOs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1B2A4A]">
              No purchase orders found
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}".`
                : activeTab === "ACTION"
                ? "Great job! All pending restaurant orders have been dispatched or reviewed."
                : "No orders in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPOs.map((po) => {
              const isActionNeeded =
                po.status === "SENT" || po.status === "PACKING";
              const isDispatched =
                po.status === "DISPATCHED" ||
                po.status === "PARTIALLY_DISPATCHED";
              const isCompleted = po.status === "RECEIVED";

              return (
                <div
                  key={po.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-gray-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-extrabold text-[#1B2A4A]">
                          {formatOrderNo(po)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            po.status === "SENT"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : po.status === "PACKING"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : po.status === "PARTIALLY_DISPATCHED"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : po.status === "DISPATCHED"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : po.status === "RECEIVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {po.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1 font-semibold text-gray-800">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {po.outlet?.name || "Main Restaurant"}
                        </span>
                        {po.createdAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            Placed on:{" "}
                            {new Date(po.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        <span className="font-bold text-gray-900">
                          Total: ₹{formatPrice(po.totalAmountPaise)}
                        </span>
                      </div>

                      {/* Items Summary list */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {po.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-gray-200 text-xs text-gray-700 font-medium"
                          >
                            <span className="font-bold text-[#1B2A4A]">
                              {it.item?.name || "Item"}
                            </span>
                            <span className="text-gray-400">×</span>
                            <span className="font-bold">
                              {it.orderedQuantity} {it.item?.unit || "unit"}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPO(po);
                          setActionModalType("VIEW");
                        }}
                        className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>

                      {isActionNeeded && (
                        <>
                          {po.status === "SENT" && (
                            <button
                              type="button"
                              onClick={() => handleMarkPacking(po)}
                              className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition flex items-center gap-1.5"
                            >
                              <Package className="w-3.5 h-3.5" />
                              Start Packing
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenDispatchModal(po)}
                            className="px-4 py-2 text-xs font-bold text-white bg-[#D3232A] rounded-xl hover:bg-[#b81d23] shadow-xs transition flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Dispatch Order
                          </button>
                        </>
                      )}

                      {isDispatched && (
                        <button
                          type="button"
                          onClick={() => handleOpenDispatchModal(po)}
                          className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Update Shipment
                        </button>
                      )}

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <Check className="w-4 h-4 stroke-[3]" />
                          Received by Store
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Dispatch / Partial Dispatch Modal ───────────────────────── */}
        <TModal
          open={actionModalType === "DISPATCH"}
          onClose={() => setActionModalType(null)}
        >
          {selectedPO && (
            <div className="p-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1B2A4A]">
                    Dispatch Purchase Order
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {formatOrderNo(selectedPO)} · {selectedPO.outlet?.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-2">
                    Dispatched Quantity per Item
                  </label>
                  <div className="space-y-2">
                    {selectedPO.items.map((it) => (
                      <div
                        key={it.itemId}
                        className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs"
                      >
                        <div>
                          <p className="font-bold text-gray-900">
                            {it.item?.name || "Item"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Ordered: {it.orderedQuantity} {it.item?.unit || "units"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={it.orderedQuantity}
                            value={dispatchInputs[it.itemId] ?? it.orderedQuantity}
                            onChange={(e) =>
                              setDispatchInputs({
                                ...dispatchInputs,
                                [it.itemId]: Number(e.target.value),
                              })
                            }
                            className="w-20 px-2.5 py-1.5 text-center font-bold bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#D3232A]"
                          />
                          <span className="text-gray-400 font-medium">
                            {it.item?.unit || "units"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
                    Supplier Delivery Notes / Tracking Details
                  </label>
                  <textarea
                    rows={2}
                    value={supplierNotes}
                    onChange={(e) => setSupplierNotes(e.target.value)}
                    placeholder="e.g. Delivery vehicle MH-12-AB-1234, Driver Contact: +91 9876543210"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
                    Expected Next Delivery (If Partial Order)
                  </label>
                  <input
                    type="date"
                    value={expectedNextDeliveryDate}
                    onChange={(e) =>
                      setExpectedNextDeliveryDate(e.target.value)
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => setActionModalType("OUT_OF_STOCK")}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  Mark Out of Stock
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActionModalType(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDispatch}
                    disabled={isUpdating}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D3232A] text-white hover:bg-[#b81d23] shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Confirm Dispatch
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </TModal>

        {/* ─── Out of Stock Modal ────────────────────────────────────────── */}
        <TModal
          open={actionModalType === "OUT_OF_STOCK"}
          onClose={() => setActionModalType(null)}
        >
          {selectedPO && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold text-[#1B2A4A]">
                  Mark Order as Out of Stock
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Are you sure? This informs the restaurant that you cannot fulfill this order right now.
              </p>
              <textarea
                rows={3}
                required
                value={supplierNotes}
                onChange={(e) => setSupplierNotes(e.target.value)}
                placeholder="Reason for out of stock (e.g. inventory depleted, raw material shortage)..."
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-rose-500 mb-4"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOutOfStock}
                  disabled={isUpdating}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Confirm Out of Stock
                </button>
              </div>
            </div>
          )}
        </TModal>

        {/* ─── View PO Details Modal ─────────────────────────────────────── */}
        <TModal
          open={actionModalType === "VIEW"}
          onClose={() => setActionModalType(null)}
        >
          {selectedPO && (
            <div className="p-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1B2A4A]">
                    Purchase Order Details
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    {formatOrderNo(selectedPO)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 font-medium block">
                      Restaurant Outlet
                    </span>
                    <span className="font-bold text-gray-800">
                      {selectedPO.outlet?.name || "Main Outlet"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">
                      Total Invoice Value
                    </span>
                    <span className="font-bold text-[#D3232A]">
                      ₹{formatPrice(selectedPO.totalAmountPaise)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#1B2A4A] mb-2">
                    Line Items
                  </h4>
                  <div className="space-y-1.5">
                    {selectedPO.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-gray-50/70 border border-gray-100 rounded-lg"
                      >
                        <div>
                          <p className="font-bold text-gray-800">
                            {it.item?.name || "Item"}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Ordered: {it.orderedQuantity} {it.item?.unit} · Unit Price: ₹
                            {formatPrice(it.unitCostPaise)}
                          </p>
                        </div>
                        <span className="font-extrabold text-gray-900">
                          ₹{formatPrice(it.orderedQuantity * it.unitCostPaise)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPO.supplierNotes && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                    <span className="font-bold text-amber-900 block mb-1">
                      Dispatch Notes:
                    </span>
                    <p className="text-amber-800">{selectedPO.supplierNotes}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-900 text-white hover:bg-black transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </TModal>
      </div>
    </SupplierLayout>
  );
}

