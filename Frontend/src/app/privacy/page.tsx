import type { Metadata } from "next";
import PrivacyPage from "@/components/pages/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Flux",
  description:
    "Read Flux's Privacy Policy to understand how we collect, use, and protect your personal data.",
};

export default function Privacy() {
  return <PrivacyPage />;
}
