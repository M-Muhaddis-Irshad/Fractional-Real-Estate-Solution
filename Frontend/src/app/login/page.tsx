import type { Metadata } from "next";
import AuthPage from "@/components/pages/AuthPage";

export const metadata: Metadata = {
  title: "Sign in — Flux",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthPage next={next} />;
}
