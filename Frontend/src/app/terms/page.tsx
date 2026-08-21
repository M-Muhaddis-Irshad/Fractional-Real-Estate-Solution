import type { Metadata } from "next";
import TermsPage from "@/components/pages/TermsPage";

export const metadata: Metadata = {
  title: "Terms & Conditions — Flux",
  description:
    "Read Flux's Terms & Conditions governing use of the fractional real-estate investment platform.",
};

export default function Terms() {
  return <TermsPage />;
}
