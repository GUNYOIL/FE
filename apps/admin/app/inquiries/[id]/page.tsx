import AdminInquiryDetailPage from "@/components/admin-inquiry-detail-page";

type InquiryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InquiryDetailPage({ params }: InquiryDetailPageProps) {
  const { id } = await params;
  const inquiryId = Number(id);

  return <AdminInquiryDetailPage inquiryId={inquiryId} />;
}
