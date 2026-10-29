"use client";

import { motion, useSpring, useTransform, useVelocity } from "framer-motion";

// A distinct deep navy/espresso color with varying opacities to simulate depth.
const COLORS = [
  "rgba(27, 42, 74, 0.9)", // Deep Navy
  "rgba(27, 42, 74, 0.7)",
  "rgba(27, 42, 74, 0.5)",
  "rgba(196, 30, 42, 0.85)", // Subtle Crimson Accent
  "rgba(27, 42, 74, 0.6)",
  "rgba(27, 42, 74, 0.8)",
  "rgba(27, 42, 74, 0.4)",
];

// Target unified path (Progress = 1)
// An organic, elegant central curve (resembling natural silk flow) rather than a rigid vector line.
const TARGET_PATH = {
  startX: 50,
  startY: -10,
  cp1X: 47,
  cp1Y: 30,
  cp2X: 53,
  cp2Y: 70,
  endX: 50,
  endY: 110,
};

// Initial paths (Progress = 0)
// Restrained, elegant parallel threads. No chaotic crossing.
const INITIAL_PATHS = [
  { startX: 10, startY: -10, cp1X: 15, cp1Y: 30, cp2X: 5, cp2Y: 70, endX: 10, endY: 110 },
  { startX: 25, startY: -10, cp1X: 20, cp1Y: 30, cp2X: 30, cp2Y: 70, endX: 25, endY: 110 },
  { startX: 40, startY: -10, cp1X: 45, cp1Y: 30, cp2X: 35, cp2Y: 70, endX: 40, endY: 110 },
  { startX: 50, startY: -10, cp1X: 50, cp1Y: 30, cp2X: 50, cp2Y: 70, endX: 50, endY: 110 },
  { startX: 60, startY: -10, cp1X: 55, cp1Y: 30, cp2X: 65, cp2Y: 70, endX: 60, endY: 110 },
  { startX: 75, startY: -10, cp1X: 80, cp1Y: 30, cp2X: 70, cp2Y: 70, endX: 75, endY: 110 },
  { startX: 90, startY: -10, cp1X: 85, cp1Y: 30, cp2X: 95, cp2Y: 70, endX: 90, endY: 110 },
];

// Grid lines positions matching INITIAL_PATHS startX to emphasize structure
const GRID_LINES = [10, 25, 40, 50, 60, 75, 90];

export default function LivingThread({ progress }: { progress: any }) {
  // Ultra-calm, heavy spring. The thread does not slide or snap; it breathes and slowly settles.
  const smoothProgress = useSpring(progress, {
    stiffness: 12,
    damping: 26,
    mass: 2.5,
    restDelta: 0.0001,
  });

  // Track velocity of the scroll progress to simulate physical drag/inertia
  const progressVelocity = useVelocity(progress);
  const smoothVelocity = useSpring(progressVelocity, {
    stiffness: 40,
    damping: 24,
  });

  // Bow the control points vertically based on scroll speed (drag/lag)
  // Scrolling down (positive velocity) pushes the control curves upward (negative drag)
  const dragY = useTransform(smoothVelocity, [-1.5, 1.5], [6, -6]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0, // Behind text
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        {/* Faint static background grid lines (The Alayn Grid System) */}
        {GRID_LINES.map((xVal, index) => (
          <line
            key={`grid-${index}`}
            x1={xVal}
            y1={-10}
            x2={xVal}
            y2={110}
            stroke="rgba(27, 42, 74, 0.025)" // Extremely subtle, elegant grid lines
            strokeWidth={xVal === 50 ? 0.08 : 0.04} // Highlight the central axis of order
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Dynamic threads */}
        {INITIAL_PATHS.map((initial, i) => {
          return (
            <ThreadPath
              key={i}
              initial={initial}
              target={TARGET_PATH}
              progress={smoothProgress}
              dragY={dragY}
              color={COLORS[i]}
              strokeWidth={i === 3 ? 0.08 : 0.05} // Impossibly delicate (violin strings, not ropes)
            />
          );
        })}
      </svg>
    </div>
  );
}

function ThreadPath({
  initial,
  target,
  progress,
  dragY,
  color,
  strokeWidth,
}: {
  initial: typeof TARGET_PATH;
  target: typeof TARGET_PATH;
  progress: any;
  dragY: any;
  color: string;
  strokeWidth: number;
}) {
  // Interpolate each point of the bezier curve from independent to synchronized
  const startX = useTransform(progress, [0, 1], [initial.startX, target.startX]);
  const startY = useTransform(progress, [0, 1], [initial.startY, target.startY]);
  
  const baseCp1X = useTransform(progress, [0, 1], [initial.cp1X, target.cp1X]);
  const baseCp1Y = useTransform(progress, [0, 1], [initial.cp1Y, target.cp1Y]);
  const baseCp2X = useTransform(progress, [0, 1], [initial.cp2X, target.cp2X]);
  const baseCp2Y = useTransform(progress, [0, 1], [initial.cp2Y, target.cp2Y]);
  
  const endX = useTransform(progress, [0, 1], [initial.endX, target.endX]);
  const endY = useTransform(progress, [0, 1], [initial.endY, target.endY]);

  // Apply velocity-based vertical bowing to the control points to simulate silk drag
  const cp1Y = useTransform([baseCp1Y, dragY], ([baseY, drag]: any[]) => baseY + drag);
  const cp2Y = useTransform([baseCp2Y, dragY], ([baseY, drag]: any[]) => baseY + drag);

  // Construct the SVG path string dynamically
  const path = useTransform(
    [startX, startY, baseCp1X, cp1Y, baseCp2X, cp2Y, endX, endY],
    ([sx, sy, c1x, c1y, c2x, c2y, ex, ey]: any[]) =>
      `M ${sx},${sy} C ${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`
  );

  return (
    <motion.path
      d={path}
      fill="transparent"
      stroke={color}
      strokeWidth={strokeWidth}
      vectorEffect="non-scaling-stroke"
      strokeLinecap="round"
      style={{
        willChange: "d",
      }}
    />
  );
}
