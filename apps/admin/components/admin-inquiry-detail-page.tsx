"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchInquiries, updateInquiryStatus } from "@/lib/api";
import { ApiError, getReadableApiError } from "@/lib/api-client";
import type { AdminInquiry, InquiryStatus } from "@/lib/api-types";
import { readStoredSession, writeStoredSession } from "@/lib/session";
import AdminBrandMark from "@/components/admin-brand-mark";
import { ArrowLeftIcon, MessageCircleIcon } from "@/components/admin-icons";

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusChip(status: InquiryStatus) {
  if (status === "RESOLVED" || status === "answered") {
    return "bg-[#E8F7EE] text-[#137333]";
  }

  if (status === "in_progress") {
    return "bg-[#FFF4E8] text-[#B54708]";
  }

  return "bg-[#EBF3FE] text-[#1B64DA]";
}

function getStatusLabel(status: InquiryStatus) {
  if (status === "RESOLVED" || status === "answered") {
    return "해결 완료";
  }

  if (status === "in_progress") {
    return "처리 중";
  }

  if (status === "new" || status === "PENDING") {
    return "접수";
  }

  return status;
}

export default function AdminInquiryDetailPage({ inquiryId }: { inquiryId: number }) {
  const router = useRouter();
  const [inquiry, setInquiry] = useState<AdminInquiry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const session = readStoredSession();

    if (!session) {
      router.replace("/?view=inquiries");
      return;
    }

    let cancelled = false;

    const loadInquiry = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const inquiries = await fetchInquiries(session.accessToken);
        if (cancelled) {
          return;
        }

        const matchedInquiry = inquiries.find((item) => item.id === inquiryId) ?? null;
        setInquiry(matchedInquiry);

        if (!matchedInquiry) {
          setErrorMessage("해당 문의를 찾지 못했습니다.");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isAuthError(error)) {
          writeStoredSession(null);
          router.replace("/");
          return;
        }

        setErrorMessage(getReadableApiError(error, "문의 상세를 불러오지 못했습니다."));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInquiry();

    return () => {
      cancelled = true;
    };
  }, [inquiryId, router]);

  const detailLines = useMemo(() => {
    if (!inquiry?.content) {
      return [];
    }

    return inquiry.content
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [inquiry]);

  const handleStatusUpdate = async (status: InquiryStatus) => {
    const session = readStoredSession();

    if (!session || !inquiry) {
      router.replace("/?view=inquiries");
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      await updateInquiryStatus(session.accessToken, inquiry.id, { status });
      setInquiry((previous) => (previous ? { ...previous, status } : previous));
    } catch (error) {
      if (isAuthError(error)) {
        writeStoredSession(null);
        router.replace("/");
        return;
      }

      setErrorMessage(getReadableApiError(error, "문의 상태 변경에 실패했습니다."));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1080px] space-y-4">
        <section className="glass-panel overflow-hidden">
          <div className="panel-header">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AdminBrandMark />
              <Link className="secondary-button !h-11 !rounded-[16px] !px-4" href="/?view=inquiries">
                <span className="mr-2">
                  <ArrowLeftIcon size={18} />
                </span>
                문의 목록으로
              </Link>
            </div>
            <div>
              <p className="eyebrow">Support Detail</p>
              <h1 className="text-[28px] font-bold tracking-[-0.04em] text-ink">문의 상세</h1>
              <p className="mt-2 text-[14px] leading-6 text-ember">문의 제목, 접수 시각, 답변 이메일과 본문을 한 화면에서 확인합니다.</p>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="panel overflow-hidden">
            <div className="panel-body text-[14px] leading-6 text-ember">문의 상세를 불러오는 중입니다...</div>
          </section>
        ) : null}

        {!isLoading && errorMessage ? (
          <section className="panel overflow-hidden">
            <div className="panel-body text-[14px] leading-6 text-[#D92D20]">{errorMessage}</div>
          </section>
        ) : null}

        {!isLoading && inquiry ? (
          <section className="panel overflow-hidden">
            <div className="panel-header">
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow">Inquiry #{inquiry.id}</p>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusChip(inquiry.status)}`}>
                  {getStatusLabel(inquiry.status)}
                </span>
              </div>
              <h2 className="text-[30px] font-bold tracking-[-0.04em] text-ink">{inquiry.title}</h2>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] leading-6 text-ember">
                <span>사용자 이메일: {inquiry.user_email}</span>
                <span>답변 이메일: {inquiry.reply_email}</span>
                <span>접수 시각: {formatDateTime(inquiry.created_at)}</span>
              </div>
            </div>
            <div className="panel-body space-y-4">
              <div className="rounded-[24px] border border-line bg-[#F8FAFC] px-5 py-5">
                <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-moss">
                  <MessageCircleIcon size={16} />
                  문의 내용
                </div>
                <div className="space-y-3 text-[15px] leading-7 text-ink">
                  {detailLines.length > 0 ? detailLines.map((line, index) => <p key={`${inquiry.id}-${index}`}>{line}</p>) : <p>{inquiry.content}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className="secondary-button"
                  disabled={isUpdating}
                  onClick={() => void handleStatusUpdate("PENDING")}
                  type="button"
                >
                  {isUpdating ? "변경 중..." : "접수 상태로 변경"}
                </button>
                <button
                  className="primary-button"
                  disabled={isUpdating}
                  onClick={() => void handleStatusUpdate("RESOLVED")}
                  type="button"
                >
                  해결 완료로 변경
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
