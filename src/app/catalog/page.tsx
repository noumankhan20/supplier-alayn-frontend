"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Check,
  X,
  IndianRupee,
  Clock,
  Award,
  AlertTriangle,
  Loader2,
  Tag,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SupplierLayout from "@/components/layout/SupplierLayout";
import { TModal } from "@/components/ui/TModal";
import {
  useGetMyCatalogQuery,
  useCreateSupplierItemMutation,
  useUpdateSupplierItemMutation,
  useDeleteSupplierItemMutation,
  SupplierItemApi,
} from "@/redux/slices/supplierApiSlice";
import { formatPrice } from "@/lib/utils";

const COMMON_CATEGORIES = [
  "Dairy",
  "Vegetables & Produce",
  "Meat & Poultry",
  "Dry Goods & Grains",
  "Oils & Condiments",
  "Spices & Seasonings",
  "Packaging & Disposables",
  "Bakery & Bread",
  "Beverages",
  "Cleaning & Hygiene",
];

const COMMON_UNITS = [
  "kg",
  "litre",
  "gram",
  "box",
  "pack",
  "bag",
  "carton",
  "can",
  "pcs",
];

const QUALITY_GRADES = ["Grade A", "Organic", "Premium", "Standard"];

export default function SupplierCatalogPage() {
  const { data: catalog = [], isLoading, refetch } = useGetMyCatalogQuery();
  const [createItem, { isLoading: isCreating }] = useCreateSupplierItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateSupplierItemMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteSupplierItemMutation();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState<
    "ALL" | "IN_STOCK" | "OUT_OF_STOCK"
  >("ALL");

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierItemApi | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SupplierItemApi | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Dairy",
    unit: "kg",
    priceRupees: "",
    minOrderQty: "1",
    inStock: true,
    qualityGrade: "Grade A",
    leadTimeHours: "24",
    description: "",
  });

  const [formError, setFormError] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [catalog]);

  const filteredItems = useMemo(() => {
    return catalog.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);

      const matchesCat =
        categoryFilter === "All" || item.category === categoryFilter;

      let matchesStock = true;
      if (stockFilter === "IN_STOCK") matchesStock = item.inStock;
      else if (stockFilter === "OUT_OF_STOCK") matchesStock = !item.inStock;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [catalog, search, categoryFilter, stockFilter]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      sku: "",
      category: "Dairy",
      unit: "kg",
      priceRupees: "",
      minOrderQty: "1",
      inStock: true,
      qualityGrade: "Grade A",
      leadTimeHours: "24",
      description: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SupplierItemApi) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || "",
      category: item.category,
      unit: item.unit,
      priceRupees: (item.pricePaise / 100).toString(),
      minOrderQty: item.minOrderQty.toString(),
      inStock: item.inStock,
      qualityGrade: item.qualityGrade || "Grade A",
      leadTimeHours: item.leadTimeHours.toString(),
      description: item.description || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Item name is required.");
      return;
    }
    const priceNum = parseFloat(formData.priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError("Price must be a valid positive number.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim() || undefined,
      category: formData.category,
      unit: formData.unit,
      pricePaise: Math.round(priceNum * 100),
      minOrderQty: Math.max(1, parseFloat(formData.minOrderQty) || 1),
      inStock: formData.inStock,
      qualityGrade: formData.qualityGrade,
      leadTimeHours: Math.max(1, parseInt(formData.leadTimeHours, 10) || 24),
      description: formData.description.trim() || undefined,
    };

    try {
      if (editingItem) {
        await updateItem({ id: editingItem.id, data: payload }).unwrap();
      } else {
        await createItem(payload).unwrap();
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      setFormError(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to save item. Please check the inputs."
      );
    }
  };

  const handleToggleStock = async (item: SupplierItemApi) => {
    try {
      await updateItem({
        id: item.id,
        data: { inStock: !item.inStock },
      }).unwrap();
      refetch();
    } catch (err: any) {
      alert("Failed to update stock status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItem(itemToDelete.id).unwrap();
      setItemToDelete(null);
      refetch();
    } catch (err: any) {
      alert("Failed to delete item");
    }
  };

  return (
    <SupplierLayout>
      <div className="space-y-6">
        {/* Header Title & Add Item Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1B2A4A]">
                Product &amp; Price Catalog
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
                {catalog.length} Products Active
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              List raw ingredients and kitchen essentials available to restaurants for automated purchase orders.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D3232A] text-white text-xs font-bold shadow-xs hover:bg-[#b81d23] transition shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Catalog Item
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-gray-700 font-semibold focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#F8FAFC] border border-gray-200 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setStockFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  stockFilter === "ALL"
                    ? "bg-white shadow-2xs text-[#1B2A4A]"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("IN_STOCK")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  stockFilter === "IN_STOCK"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                In Stock
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("OUT_OF_STOCK")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  stockFilter === "OUT_OF_STOCK"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Out of Stock
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A] focus:bg-white transition"
            />
          </div>
        </div>

        {/* Catalog Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-gray-200"
              >
                <Skeleton height={20} width={250} />
                <Skeleton height={14} width={150} className="mt-2" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1B2A4A]">
              No catalog products found
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {search
                ? `No products matching "${search}".`
                : "Your catalog is empty. Click 'Add New Catalog Item' above to start listing items."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-gray-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Product Name &amp; SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit Price (₹)</th>
                    <th className="py-3 px-4">Min Order</th>
                    <th className="py-3 px-4">Lead Time</th>
                    <th className="py-3 px-4">Stock Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1B2A4A] text-sm">
                          {item.name}
                        </div>
                        {item.sku && (
                          <div className="text-[11px] font-mono text-gray-400">
                            SKU: {item.sku}
                          </div>
                        )}
                        {item.qualityGrade && (
                          <span className="inline-block mt-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
                            {item.qualityGrade}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold">
                          <Tag className="w-3 h-3 text-gray-400" />
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        ₹{formatPrice(item.pricePaise)} / {item.unit}
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        {item.minOrderQty} {item.unit}
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {item.leadTimeHours} hrs
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            item.inStock
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.inStock ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {item.inStock ? "In Stock" : "Out of Stock"}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-gray-500 hover:text-[#1B2A4A] hover:bg-gray-100 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Add / Edit Item Modal ────────────────────────────────────── */}
        <TModal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-[#1B2A4A]">
                {editingItem ? "Edit Catalog Item" : "Add New Catalog Item"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1B2A4A] mb-1">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Fresh Paneer / Buffalo Milk"
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B2A4A] mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  >
                    {COMMON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1B2A4A] mb-1">
                    Unit of Measurement *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B2A4A] mb-1">
                    Price in ₹ (Rupees) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceRupees}
                      onChange={(e) =>
                        setFormData({ ...formData, priceRupees: e.target.value })
                      }
                      placeholder="e.g. 250.00"
                      className="w-full pl-7 pr-3 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#1B2A4A] mb-1">
                    Min Order Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minOrderQty}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderQty: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B2A4A] mb-1">
                    Lead Time (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.leadTimeHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        leadTimeHours: e.target.value,
                      })
                    }
                    placeholder="24"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1B2A4A] mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={formData.qualityGrade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qualityGrade: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                  >
                    {QUALITY_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1B2A4A] mb-1">
                  SKU / Vendor Product Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="e.g. PAN-001"
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3232A]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={formData.inStock}
                  onChange={(e) =>
                    setFormData({ ...formData, inStock: e.target.checked })
                  }
                  className="rounded border-gray-300 text-[#D3232A] focus:ring-[#D3232A]"
                />
                <label
                  htmlFor="inStockCheck"
                  className="font-bold text-gray-700 cursor-pointer"
                >
                  Product is currently In Stock and ready for shipment
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D3232A] text-white hover:bg-[#b81d23] shadow-xs disabled:opacity-50"
                >
                  {isCreating || isUpdating ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </TModal>

        {/* ─── Delete Confirmation Modal ────────────────────────────────── */}
        <TModal open={!!itemToDelete} onClose={() => setItemToDelete(null)}>
          {itemToDelete && (
            <div className="p-6">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold text-[#1B2A4A]">
                  Delete Catalog Item
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Are you sure you want to remove{" "}
                <span className="font-bold text-gray-800">
                  {itemToDelete.name}
                </span>{" "}
                from your active catalog? Restaurants will no longer be able to select it for purchase orders.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete Item"}
                </button>
              </div>
            </div>
          )}
        </TModal>
      </div>
    </SupplierLayout>
  );
}

