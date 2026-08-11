import type { Metadata } from "next";
import ForgotPassword from "@/components/pages/ForgotPassword";

export const metadata: Metadata = {
  title: "Forgot password — Flux",
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
