import type { Metadata } from "next";
import ResetPassword from "@/components/pages/ResetPassword";

export const metadata: Metadata = {
  title: "Reset password — Flux",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPassword token={token} />;
}
