import type { Metadata } from "next";
import AuthPage from "@/components/pages/AuthPage";

export const metadata: Metadata = {
  title: "Sign in — Flux",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; google_error?: string }>;
}) {
  const { next, google_error } = await searchParams;
  return (
    <AuthPage
      next={next}
      googleError={google_error ? "Google sign-in failed. Please try again." : undefined}
    />
  );
}
