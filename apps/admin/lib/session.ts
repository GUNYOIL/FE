import type { Announcement } from "@/lib/api-types";

export type AdminSession = {
  accessToken: string;
  refreshToken: string | null;
};

export const AUTH_STORAGE_KEY = "gunyoil-admin-session";
export const ANNOUNCEMENT_STORAGE_KEY = "gunyoil-admin-announcements";

export function readStoredSession() {
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

export function writeStoredSession(session: AdminSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function readStoredAnnouncements() {
  if (typeof window === "undefined") {
    return [] as Announcement[];
  }

  try {
    const raw = window.sessionStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Announcement[] | null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStoredAnnouncements(announcements: Announcement[]) {
  if (typeof window === "undefined") {
    return;
  }

  if (announcements.length === 0) {
    window.sessionStorage.removeItem(ANNOUNCEMENT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(announcements));
}
