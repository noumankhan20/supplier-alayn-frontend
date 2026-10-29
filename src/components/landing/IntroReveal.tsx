import { preload } from "react-dom";
import "@/styles/intro.css";
import IntroRevealOverlay from "./IntroRevealOverlay";

// Plays the logo reveal over the landing page on the first full page load of
// a session. The pre-paint decision script is safely executed in layout.tsx
// to prevent React 19 client component script reconciliation warnings.
export default function IntroReveal() {
  // Preload strokes so they are ready as soon as the intro loads
  preload("/brand/loader/stroke-red.png", { as: "image" });
  preload("/brand/loader/stroke-navy.png", { as: "image" });

  return <IntroRevealOverlay />;
}
