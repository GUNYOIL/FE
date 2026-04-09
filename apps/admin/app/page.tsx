import AdminDashboard from "@/components/admin-dashboard";

type AdminHomePageProps = {
  searchParams?: Promise<{ view?: string }>;
};

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedView = resolvedSearchParams.view;
  const initialView =
    requestedView === "exercises" || requestedView === "announcements" || requestedView === "inquiries"
      ? requestedView
      : "exercises";

  return <AdminDashboard initialView={initialView} />;
}
