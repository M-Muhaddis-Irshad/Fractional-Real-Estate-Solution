import { Suspense } from "react";
import Discover from "@/components/pages/dashboard/Discover";

export default function DiscoverPage() {
  return (
    <Suspense fallback={null}>
      <Discover />
    </Suspense>
  );
}
