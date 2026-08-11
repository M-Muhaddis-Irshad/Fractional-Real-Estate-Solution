import type { Metadata } from "next";
import OurStory from "@/components/pages/OurStory";

export const metadata: Metadata = {
  title: "Our Story — Flux",
  description:
    "Why Flux exists: institutional-grade real estate, owned by everyone. Our mission, roadmap, and the step-by-step path to fractional ownership.",
};

export default function OurStoryPage() {
  return <OurStory />;
}
