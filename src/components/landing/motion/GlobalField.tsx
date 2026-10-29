"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

const FieldCanvas = dynamic(() => import("./FieldCanvas"), { ssr: false });

/**
 * One persistent intelligence layer for the entire page — a single fixed
 * canvas, mounted once, that never resets. Individual scenes don't own a
 * background; they register a target state (how chaotic / how synchronized /
 * how present the field should be while they're on screen) and the field
 * blends continuously toward whichever scenes are in view, weighted by how
 * much of the viewport they occupy. Nothing snaps, nothing restarts.
 */

export interface FieldTarget {
  chaos: number; // 0 = calm routes, 1 = fragmenting/scattering
  sync: number; // 0 = neutral, 1 = crisp/resolved (crimson, clean signals)
  presence: number; // overall opacity — how loudly the field speaks
}

export interface FieldNode {
  id: string;
  label: string;
  x: number; // viewport fraction
  y: number;
}

export const DEFAULT_NODES: FieldNode[] = [
  { id: "orders", label: "Orders", x: 0.1, y: 0.18 },
  { id: "kitchen", label: "Kitchen", x: 0.9, y: 0.12 },
  { id: "stock", label: "Stock", x: 0.05, y: 0.55 },
  { id: "payments", label: "Payments", x: 0.95, y: 0.6 },
  { id: "staff", label: "Staff", x: 0.16, y: 0.9 },
  { id: "guests", label: "Guests", x: 0.84, y: 0.88 },
];

interface FieldContextValue {
  register: (id: string, target: FieldTarget, weight: number) => void;
  unregister: (id: string) => void;
  setLabels: (nodes: FieldNode[] | null) => void;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export function useField() {
  const ctx = useContext(FieldContext);
  if (!ctx) throw new Error("useField must be used within GlobalFieldProvider");
  return ctx;
}

export function GlobalFieldProvider({ children }: { children: React.ReactNode }) {
  const targetsRef = useRef<Map<string, { target: FieldTarget; weight: number }>>(new Map());
  const nodesOverrideRef = useRef<FieldNode[] | null>(null);
  const [, forceLabelUpdate] = useState(0);

  const register = useCallback((id: string, target: FieldTarget, weight: number) => {
    targetsRef.current.set(id, { target, weight });
  }, []);
  const unregister = useCallback((id: string) => {
    targetsRef.current.delete(id);
  }, []);
  const setLabels = useCallback((nodes: FieldNode[] | null) => {
    nodesOverrideRef.current = nodes;
    forceLabelUpdate((n) => n + 1);
  }, []);

  const contextValue = useMemo(() => ({ register, unregister, setLabels }), [register, unregister, setLabels]);

  return (
    <FieldContext.Provider value={contextValue}>
      <FieldCanvas targetsRef={targetsRef} nodesOverrideRef={nodesOverrideRef} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </FieldContext.Provider>
  );
}

/**
 * Wrap a scene with this to make it drive the global field while on screen.
 * `weight` scales with how much of the viewport the scene occupies, so
 * transitions between adjacent scenes blend rather than cut.
 */
export function FieldScene({
  id,
  domId,
  chaos = 0,
  sync = 0,
  presence = 0.6,
  children,
  as: Tag = "section",
  className,
  style,
  ariaLabel,
}: {
  id: string;
  domId?: string;
  chaos?: number;
  sync?: number;
  presence?: number;
  children: React.ReactNode;
  as?: "section" | "div";
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const { register, unregister } = useField();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          register(id, { chaos, sync, presence }, entry.intersectionRatio);
        } else {
          unregister(id);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1.0] }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      unregister(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, chaos, sync, presence]);

  const Component = Tag;
  return (
    <Component ref={ref as never} id={domId} className={className} style={style} aria-label={ariaLabel}>
      {children}
    </Component>
  );
}
