import type { Metadata } from "next";
import NotFoundView from "@/components/pages/NotFoundView";

export const metadata: Metadata = {
  title: "Page Not Found — Flux",
  description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFound() {
  return <NotFoundView scope="public" />;
}
