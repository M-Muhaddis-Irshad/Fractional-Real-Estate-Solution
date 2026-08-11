import PropertyDetail from "@/components/pages/dashboard/PropertyDetail";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyDetail id={id} />;
}
