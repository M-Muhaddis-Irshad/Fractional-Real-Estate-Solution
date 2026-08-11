import AdminLayout from "@/components/pages/admin/AdminLayout";

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
