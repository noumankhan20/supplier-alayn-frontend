import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(paise: number): string {
  return (paise / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

const ROLE_LABELS: Record<string, string> = {
  BUSINESS_OWNER: "Restaurant Owner",
  SUPER_ADMIN: "Admin",
  MANAGER: "Restaurant Manager",
  STAFF: "Staff",
  KITCHEN: "Kitchen",
  SUPPLIER: "Supplier",
};

export function formatRole(role: string | undefined | null): string {
  if (!role) return "Supplier";
  return ROLE_LABELS[role] ?? role.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

