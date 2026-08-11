import AdminPropertyForm from "@/components/pages/admin/AdminPropertyForm";

export default async function AdminEditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminPropertyForm id={id} />;
}
