import React from "react";
import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import SceneProgress from "@/components/landing/SceneProgress";
import SmoothScroll from "@/components/landing/motion/SmoothScroll";
import { GlobalFieldProvider } from "@/components/landing/motion/GlobalField";
import HeroScene from "@/components/landing/scenes/HeroScene";
import TrustedByScene from "@/components/landing/scenes/TrustedByScene";
import ChaosScene from "@/components/landing/scenes/ChaosScene";
import ConvergenceScene from "@/components/landing/scenes/ConvergenceScene";
import RunningScene from "@/components/landing/scenes/RunningScene";
import VerticalsScene from "@/components/landing/scenes/VerticalsScene";
import CalmScene from "@/components/landing/scenes/CalmScene";
import WaitingScene from "@/components/landing/scenes/WaitingScene";
import IntroReveal from "@/components/landing/IntroReveal";

const title = "Alayn Suppliers | The Restaurant Vendor Network";
const description =
  "Join the Alayn supplier network. Receive direct purchase orders from restaurants, cafés & cloud kitchens, manage live price catalogs, dispatch with partial order tracking, and get paid faster.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  alternates: {
    canonical: "https://suppliers.alaynai.com",
    types: { "text/markdown": "https://suppliers.alaynai.com/index.md" },
  },
  ...socialMetadata({ title, description, path: "" }),
};

export default function SupplierLandingPage() {
  return (
    <SmoothScroll>
      <IntroReveal />
      <GlobalFieldProvider>
        <div className="landing-root">
          <LandingNav />
          <SceneProgress />
          <HeroScene />
          <TrustedByScene />
          <ChaosScene />
          <ConvergenceScene />
          <RunningScene />
          <VerticalsScene />
          <CalmScene />
          <WaitingScene />
          <LandingFooter />
        </div>
      </GlobalFieldProvider>
    </SmoothScroll>
  );
}
