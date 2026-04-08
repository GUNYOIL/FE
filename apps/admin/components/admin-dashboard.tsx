"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createAnnouncement,
  createExercise,
  deleteAnnouncement,
  fetchAnnouncements,
  fetchExercises,
  fetchInquiries,
  loginAdmin,
  logoutAdmin,
  updateInquiryStatus,
} from "@/lib/api";
import { ApiError, getReadableApiError } from "@/lib/api-client";
import type {
  AdminExercise,
  AdminExerciseCategory,
  AdminInquiry,
  AdminLoginResponse,
  Announcement,
  InquiryStatus,
} from "@/lib/api-types";
import AdminBrandMark from "@/components/admin-brand-mark";
import { BarChartIcon, LogoutIcon, MegaphoneIcon, MessageCircleIcon } from "@/components/admin-icons";

type ViewKey = "exercises" | "announcements" | "inquiries";
type ToastTone = "success" | "error";
type AdminSession = {
  accessToken: string;
  refreshToken: string | null;
};

const NAV_ITEMS: Array<{ key: ViewKey; label: string }> = [
  { key: "exercises", label: "운동 기구 추가" },
  { key: "announcements", label: "공지사항 관리" },
  { key: "inquiries", label: "사용자 문의내역" },
];

const AUTH_STORAGE_KEY = "gunyoil-admin-session";

const EXERCISE_CATEGORIES: Array<{ value: AdminExerciseCategory; label: string }> = [
  { value: "CHEST", label: "가슴 (CHEST)" },
  { value: "BACK", label: "등 (BACK)" },
  { value: "LEGS", label: "하체 (LEGS)" },
  { value: "SHOULDERS", label: "어깨 (SHOULDERS)" },
  { value: "ARMS", label: "팔 (ARMS)" },
  { value: "ABS", label: "복근/코어 (ABS)" },
  { value: "CARDIO", label: "유산소 (CARDIO)" },
];

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusChip(status: InquiryStatus) {
  if (status === "answered") {
    return "bg-[#E8F7EE] text-[#137333]";
  }

  if (status === "in_progress") {
    return "bg-[#FFF4E8] text-[#B54708]";
  }

  return "bg-[#EBF3FE] text-[#1B64DA]";
}

function getStatusLabel(status: InquiryStatus) {
  if (status === "answered") {
    return "답변 완료";
  }

  if (status === "in_progress") {
    return "처리 중";
  }

  if (status === "new") {
    return "신규";
  }

  return status;
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AdminSession> | null;
    if (!parsed?.accessToken || typeof parsed.accessToken !== "string") {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: typeof parsed.refreshToken === "string" ? parsed.refreshToken : null,
    } satisfies AdminSession;
  } catch {
    return null;
  }
}

function writeStoredSession(session: AdminSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function toSession(tokens: AdminLoginResponse): AdminSession {
  return {
    accessToken: tokens.access,
    refreshToken: tokens.refresh ?? null,
  };
}

function Toast({
  message,
  tone,
}: {
  message: string | null;
  tone: ToastTone;
}) {
  if (!message) {
    return null;
  }

  return (
    <div className="fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div
        className={`rounded-[20px] px-4 py-3 text-[14px] font-semibold shadow-[0_24px_48px_-32px_rgba(15,23,42,0.28)] ${
          tone === "success" ? "bg-[#191F28] text-white" : "bg-[#D92D20] text-white"
        }`}
      >
        {message}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isAuthPending, setIsAuthPending] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [activeView, setActiveView] = useState<ViewKey>("exercises");
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("iamhelchang");
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [exerciseForm, setExerciseForm] = useState({
    code: "",
    name: "",
    category: "CHEST" as AdminExerciseCategory,
    targetMuscle: "",
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
  });
  const [isExerciseSubmitting, setIsExerciseSubmitting] = useState(false);
  const [isAnnouncementSubmitting, setIsAnnouncementSubmitting] = useState(false);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<number | null>(null);
  const [updatingInquiryId, setUpdatingInquiryId] = useState<number | null>(null);

  const showToast = (message: string, tone: ToastTone = "success") => {
    setToast({ message, tone });
  };

  const clearAuthState = () => {
    writeStoredSession(null);
    setSession(null);
    setExercises([]);
    setAnnouncements([]);
    setInquiries([]);
  };

  const handleApiError = (error: unknown, fallback: string) => {
    if (isAuthError(error)) {
      clearAuthState();
      showToast("인증이 만료되어 다시 로그인해야 합니다.", "error");
      return true;
    }

    showToast(getReadableApiError(error, fallback), "error");
    return false;
  };

  const loadDashboardData = async (token: string) => {
    setIsDashboardLoading(true);

    try {
      const [loadedExercises, loadedAnnouncements, loadedInquiries] = await Promise.all([
        fetchExercises(token),
        fetchAnnouncements(token),
        fetchInquiries(token),
      ]);

      setExercises(loadedExercises);
      setAnnouncements(loadedAnnouncements);
      setInquiries(loadedInquiries);
    } catch (error) {
      handleApiError(error, "관리자 데이터를 불러오지 못했습니다.");
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    const restoredSession = readStoredSession();
    setSession(restoredSession);
    setIsBooting(false);

    if (restoredSession) {
      void loadDashboardData(restoredSession.accessToken);
    }
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const openInquiryCount = useMemo(
    () => inquiries.filter((item) => item.status !== "answered").length,
    [inquiries],
  );

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAuthPending(true);

    try {
      const tokens = await loginAdmin({ username, password });
      const nextSession = toSession(tokens);

      setSession(nextSession);
      writeStoredSession(nextSession);
      await loadDashboardData(nextSession.accessToken);
      showToast("관리자 패널에 접속했습니다.");
    } catch (error) {
      showToast(getReadableApiError(error, "아이디 또는 비밀번호가 맞지 않습니다."), "error");
    } finally {
      setIsAuthPending(false);
    }
  };

  const handleExerciseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      return;
    }

    setIsExerciseSubmitting(true);

    try {
      await createExercise(session.accessToken, {
        code: exerciseForm.code.trim(),
        name: exerciseForm.name.trim(),
        category: exerciseForm.category,
        target_muscle: exerciseForm.targetMuscle.trim(),
      });

      setExerciseForm({
        code: "",
        name: "",
        category: "CHEST",
        targetMuscle: "",
      });
      await loadDashboardData(session.accessToken);
      showToast("운동 기구 항목을 추가했습니다.");
    } catch (error) {
      handleApiError(error, "운동 기구 추가에 실패했습니다.");
    } finally {
      setIsExerciseSubmitting(false);
    }
  };

  const handleAnnouncementSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      return;
    }

    setIsAnnouncementSubmitting(true);

    try {
      await createAnnouncement(session.accessToken, {
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
      });

      setAnnouncementForm({
        title: "",
        content: "",
      });
      await loadDashboardData(session.accessToken);
      showToast("공지사항을 등록했습니다.");
    } catch (error) {
      handleApiError(error, "공지사항 등록에 실패했습니다.");
    } finally {
      setIsAnnouncementSubmitting(false);
    }
  };

  const handleAnnouncementDelete = async (id: number) => {
    if (!session) {
      return;
    }

    setDeletingAnnouncementId(id);

    try {
      await deleteAnnouncement(session.accessToken, id);
      await loadDashboardData(session.accessToken);
      showToast("공지사항을 삭제했습니다.");
    } catch (error) {
      handleApiError(error, "공지사항 삭제에 실패했습니다.");
    } finally {
      setDeletingAnnouncementId(null);
    }
  };

  const handleInquiryStatusUpdate = async (id: number, status: InquiryStatus) => {
    if (!session) {
      return;
    }

    setUpdatingInquiryId(id);

    try {
      await updateInquiryStatus(session.accessToken, id, { status });
      await loadDashboardData(session.accessToken);
      showToast("문의 상태를 업데이트했습니다.");
    } catch (error) {
      handleApiError(error, "문의 상태 변경에 실패했습니다.");
    } finally {
      setUpdatingInquiryId(null);
    }
  };

  const handleLogout = async () => {
    const currentSession = session;

    clearAuthState();

    if (currentSession) {
      try {
        await logoutAdmin(currentSession.accessToken, currentSession.refreshToken);
      } catch {
        // Local session cleanup is enough even if server logout fails.
      }
    }

    showToast("로그아웃했습니다.");
  };

  if (!session) {
    return (
      <>
        <Toast message={toast?.message ?? null} tone={toast?.tone ?? "success"} />
        <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
            <section className="glass-panel w-full max-w-[460px] overflow-hidden">
              <div className="panel-header">
                <AdminBrandMark />
                <div>
                  <p className="eyebrow">Access Control</p>
                  <h1 className="text-[28px] font-bold tracking-[-0.04em] text-ink">관리자 로그인</h1>
                  <p className="mt-2 text-[14px] leading-6 text-ember">
                    운영용 데이터 등록, 공지 작성, 사용자 문의 대응을 한 화면에서 관리합니다.
                  </p>
                </div>
              </div>
              <div className="panel-body">
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  <label className="block">
                    <span className="label">Username</span>
                    <input
                      className="field"
                      disabled={isAuthPending || isBooting}
                      onChange={(event) => setUsername(event.target.value)}
                      type="text"
                      value={username}
                    />
                  </label>
                  <label className="block">
                    <span className="label">Password</span>
                    <input
                      className="field"
                      disabled={isAuthPending || isBooting}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      value={password}
                    />
                  </label>
                  <button className="primary-button w-full" disabled={isAuthPending || isBooting} type="submit">
                    {isAuthPending ? "접속 중..." : "Access Control Panel"}
                  </button>
                </form>
                <div className="mt-4 rounded-[20px] border border-line bg-[#F8FAFC] px-4 py-3 text-[13px] leading-6 text-ember">
                  로그인은 백엔드 어드민 전용 엔드포인트 <code>/auth/admin/login/</code> 를 사용합니다.
                </div>
              </div>
            </section>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Toast message={toast?.message ?? null} tone={toast?.tone ?? "success"} />
      <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="glass-panel overflow-hidden lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
              <div className="panel-header">
                <AdminBrandMark />
                <div className="rounded-[22px] bg-[#F8FAFC] px-4 py-3">
                  <p className="text-[12px] font-semibold text-moss">Gunyoil Admin</p>
                  <p className="mt-1 text-[13px] leading-6 text-ember">
                    실제 관리자 API와 연결된 운영 패널입니다.
                  </p>
                </div>
              </div>
              <div className="panel-body flex h-full flex-col justify-between gap-5">
                <div className="flex flex-col gap-2">
                  {NAV_ITEMS.map((item) => {
                    const isActive = activeView === item.key;
                    const Icon = item.key === "exercises" ? BarChartIcon : item.key === "announcements" ? MegaphoneIcon : MessageCircleIcon;

                    return (
                      <button
                        key={item.key}
                        className={`flex items-center justify-between rounded-[20px] px-4 py-3 text-left transition ${
                          isActive ? "bg-[#191F28] text-white" : "bg-[#F8FAFC] text-ink hover:bg-white"
                        }`}
                        onClick={() => setActiveView(item.key)}
                        type="button"
                      >
                        <span className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-full ${isActive ? "bg-white/14" : "bg-white"}`}>
                            <Icon size={18} />
                          </span>
                          <span className="text-[14px] font-semibold">{item.label}</span>
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isActive ? "bg-white/16 text-white" : "bg-white text-ember"
                          }`}
                        >
                          {item.key === "exercises" ? exercises.length : item.key === "announcements" ? announcements.length : openInquiryCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button className="secondary-button w-full" onClick={() => void handleLogout()} type="button">
                  <span className="mr-2">
                    <LogoutIcon size={18} />
                  </span>
                  Logout
                </button>
              </div>
            </aside>

            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="stat-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">운동 기구</p>
                  <p className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-ink">{exercises.length}</p>
                  <p className="mt-2 text-[13px] leading-6 text-ember">현재 카탈로그 운동 수</p>
                </div>
                <div className="stat-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">공지사항</p>
                  <p className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-ink">{announcements.length}</p>
                  <p className="mt-2 text-[13px] leading-6 text-ember">앱에 노출되는 전체 공지 수</p>
                </div>
                <div className="stat-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">미응답 문의</p>
                  <p className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-ink">{openInquiryCount}</p>
                  <p className="mt-2 text-[13px] leading-6 text-ember">지금 대응이 필요한 문의 건수</p>
                </div>
              </div>

              {isDashboardLoading ? (
                <section className="panel overflow-hidden">
                  <div className="panel-body text-[14px] leading-6 text-ember">관리자 데이터를 불러오는 중입니다...</div>
                </section>
              ) : null}

              {activeView === "exercises" ? (
                <div className="space-y-4">
                  <section className="panel overflow-hidden">
                    <div className="panel-header">
                      <p className="eyebrow">Equipment</p>
                      <h2 className="text-[28px] font-bold tracking-[-0.04em] text-ink">운동 기구 추가</h2>
                      <p className="text-[14px] leading-6 text-ember">
                        <code>/catalog/admin/exercises/</code> 로 새 운동을 추가하고 <code>/catalog/exercises/</code> 목록을 다시 불러옵니다.
                      </p>
                    </div>
                    <div className="panel-body">
                      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleExerciseSubmit}>
                        <label className="block">
                          <span className="label">운동 코드명</span>
                          <input
                            className="field"
                            disabled={isExerciseSubmitting}
                            onChange={(event) =>
                              setExerciseForm((previous) => ({ ...previous, code: event.target.value }))
                            }
                            placeholder="e.g. chest_press"
                            required
                            type="text"
                            value={exerciseForm.code}
                          />
                        </label>
                        <label className="block">
                          <span className="label">운동 이름</span>
                          <input
                            className="field"
                            disabled={isExerciseSubmitting}
                            onChange={(event) =>
                              setExerciseForm((previous) => ({ ...previous, name: event.target.value }))
                            }
                            placeholder="e.g. 체스트 프레스"
                            required
                            type="text"
                            value={exerciseForm.name}
                          />
                        </label>
                        <label className="block">
                          <span className="label">분류</span>
                          <select
                            className="field"
                            disabled={isExerciseSubmitting}
                            onChange={(event) =>
                              setExerciseForm((previous) => ({
                                ...previous,
                                category: event.target.value as AdminExerciseCategory,
                              }))
                            }
                            value={exerciseForm.category}
                          >
                            {EXERCISE_CATEGORIES.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="label">타겟 부위</span>
                          <input
                            className="field"
                            disabled={isExerciseSubmitting}
                            onChange={(event) =>
                              setExerciseForm((previous) => ({ ...previous, targetMuscle: event.target.value }))
                            }
                            placeholder="e.g. 상부 가슴, 광배근"
                            required
                            type="text"
                            value={exerciseForm.targetMuscle}
                          />
                        </label>
                        <div className="md:col-span-2">
                          <button className="primary-button w-full sm:w-auto" disabled={isExerciseSubmitting} type="submit">
                            {isExerciseSubmitting ? "추가 중..." : "데이터베이스에 추가"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </section>

                  <section className="panel overflow-hidden">
                    <div className="panel-header">
                      <p className="eyebrow">Catalog</p>
                      <h3 className="text-[22px] font-bold tracking-[-0.03em] text-ink">현재 운동 목록</h3>
                    </div>
                    <div className="panel-body space-y-3">
                      {exercises.length === 0 ? (
                        <div className="rounded-[22px] border border-dashed border-line bg-[#F8FAFC] px-4 py-6 text-[14px] leading-6 text-ember">
                          등록된 운동 기구가 없습니다.
                        </div>
                      ) : (
                        exercises.map((exercise) => (
                          <article
                            key={exercise.id}
                            className="flex flex-col gap-3 rounded-[22px] border border-line bg-[#F8FAFC] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-[16px] font-semibold text-ink">{exercise.name}</p>
                              <p className="mt-1 text-[13px] text-ember">
                                {exercise.target_muscle ?? "타겟 부위 미노출"} · {exercise.category_display ?? exercise.category}
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-moss">
                              #{exercise.id}
                            </span>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              ) : null}

              {activeView === "announcements" ? (
                <div className="space-y-4">
                  <section className="panel overflow-hidden">
                    <div className="panel-header">
                      <p className="eyebrow">Announcement</p>
                      <h2 className="text-[28px] font-bold tracking-[-0.04em] text-ink">공지사항 관리</h2>
                      <p className="text-[14px] leading-6 text-ember">
                        등록은 <code>/admin/announcements/</code>, 목록은 <code>/announcements/</code> 기준으로 동작합니다.
                      </p>
                    </div>
                    <div className="panel-body">
                      <form className="space-y-4" onSubmit={handleAnnouncementSubmit}>
                        <label className="block">
                          <span className="label">제목</span>
                          <input
                            className="field"
                            disabled={isAnnouncementSubmitting}
                            onChange={(event) =>
                              setAnnouncementForm((previous) => ({ ...previous, title: event.target.value }))
                            }
                            placeholder="공지 제목을 입력하세요"
                            required
                            type="text"
                            value={announcementForm.title}
                          />
                        </label>
                        <label className="block">
                          <span className="label">내용</span>
                          <textarea
                            className="field-textarea min-h-[140px]"
                            disabled={isAnnouncementSubmitting}
                            onChange={(event) =>
                              setAnnouncementForm((previous) => ({ ...previous, content: event.target.value }))
                            }
                            placeholder="상세 내용을 입력하세요"
                            required
                            rows={5}
                            value={announcementForm.content}
                          />
                        </label>
                        <button className="primary-button w-full sm:w-auto" disabled={isAnnouncementSubmitting} type="submit">
                          {isAnnouncementSubmitting ? "등록 중..." : "공지 등록하기"}
                        </button>
                      </form>
                    </div>
                  </section>

                  <section className="panel overflow-hidden">
                    <div className="panel-header">
                      <p className="eyebrow">Archive</p>
                      <h3 className="text-[22px] font-bold tracking-[-0.03em] text-ink">등록된 공지 목록</h3>
                    </div>
                    <div className="panel-body space-y-3">
                      {announcements.length === 0 ? (
                        <div className="rounded-[22px] border border-dashed border-line bg-[#F8FAFC] px-4 py-6 text-[14px] leading-6 text-ember">
                          등록된 공지사항이 없습니다.
                        </div>
                      ) : (
                        announcements.map((item) => (
                          <article key={item.id} className="rounded-[22px] border border-line bg-[#F8FAFC] px-4 py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-[16px] font-semibold text-ink">{item.title}</p>
                                <p className="mt-2 text-[14px] leading-6 text-ember">{item.content}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-gold">
                                  {formatDateTime(item.created_at)}
                                </span>
                                <button
                                  className="secondary-button !h-10 !rounded-[16px] !px-4 text-[#D92D20]"
                                  disabled={deletingAnnouncementId === item.id}
                                  onClick={() => void handleAnnouncementDelete(item.id)}
                                  type="button"
                                >
                                  {deletingAnnouncementId === item.id ? "삭제 중..." : "삭제"}
                                </button>
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              ) : null}

              {activeView === "inquiries" ? (
                <section className="panel overflow-hidden">
                  <div className="panel-header">
                    <p className="eyebrow">Support</p>
                    <h2 className="text-[28px] font-bold tracking-[-0.04em] text-ink">사용자 문의내역</h2>
                    <p className="text-[14px] leading-6 text-ember">
                      <code>/admin/inquiries/</code> 목록을 불러오고, 상태 변경은 <code>/admin/inquiries/{"{id}"}/</code> 로 PATCH 합니다.
                    </p>
                  </div>
                  <div className="panel-body space-y-3">
                    {inquiries.length === 0 ? (
                      <div className="rounded-[22px] border border-dashed border-line bg-[#F8FAFC] px-4 py-6 text-[14px] leading-6 text-ember">
                        접수된 문의가 없습니다.
                      </div>
                    ) : (
                      inquiries.map((item) => (
                        <article key={item.id} className="rounded-[24px] border border-line bg-[#F8FAFC] px-4 py-4">
                          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[17px] font-semibold text-ink">{item.title}</p>
                                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusChip(item.status)}`}>
                                  {getStatusLabel(item.status)}
                                </span>
                              </div>
                              <p className="mt-2 text-[13px] text-gold">
                                사용자 {item.user_email} · 답변 {item.reply_email} · {formatDateTime(item.created_at)}
                              </p>
                              <p className="mt-3 text-[14px] leading-6 text-ember">{item.content}</p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <button
                                className="secondary-button"
                                disabled={updatingInquiryId === item.id}
                                onClick={() => void handleInquiryStatusUpdate(item.id, "in_progress")}
                                type="button"
                              >
                                {updatingInquiryId === item.id ? "변경 중..." : "처리 중"}
                              </button>
                              <button
                                className="primary-button"
                                disabled={updatingInquiryId === item.id}
                                onClick={() => void handleInquiryStatusUpdate(item.id, "answered")}
                                type="button"
                              >
                                답변 완료
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
