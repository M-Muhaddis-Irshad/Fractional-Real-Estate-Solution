import UserLayout from "@/components/dashboard/UserLayout";

export default function UserRouteLayout({ children }: { children: React.ReactNode }) {
  return <UserLayout>{children}</UserLayout>;
}
