"use client";

import { useEffect, useRef } from "react";

/**
 * Scoped to the landing page only — dashboard routes keep native scroll.
 * We are using native scroll for the landing page as well to ensure
 * smooth, hardware-accelerated performance without layout thrashing.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
