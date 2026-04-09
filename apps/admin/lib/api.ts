import { apiRequest } from "@/lib/api-client";
import type {
  AdminExercise,
  AdminInquiry,
  AdminLoginRequest,
  AdminLoginResponse,
  Announcement,
  CreateAnnouncementRequest,
  CreateAnnouncementResponse,
  CreateExerciseRequest,
  UpdateAnnouncementSelectionRequest,
  UpdateInquiryStatusRequest,
} from "@/lib/api-types";

function coerceArray<T>(value: unknown, nestedKeys: string[] = []): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    for (const key of nestedKeys) {
      const candidate = (value as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) {
        return candidate as T[];
      }
    }
  }

  return value ? [value as T] : [];
}

export function loginAdmin(body: AdminLoginRequest) {
  return apiRequest<AdminLoginResponse>("/auth/admin/login/", {
    method: "POST",
    body,
  });
}

export function logoutAdmin(token: string, refreshToken: string | null) {
  if (!refreshToken) {
    return Promise.resolve(null);
  }

  return apiRequest<unknown>("/auth/logout/", {
    method: "POST",
    token,
    body: {
      refresh: refreshToken,
    },
  });
}

export async function fetchExercises(token: string) {
  const payload = await apiRequest<unknown>("/catalog/exercises/", {
    token,
  });

  return coerceArray<AdminExercise>(payload, ["results", "items", "data", "exercises"]);
}

export function createExercise(token: string, body: CreateExerciseRequest) {
  return apiRequest<unknown>("/catalog/admin/exercises/", {
    method: "POST",
    token,
    body,
  });
}

export async function fetchAnnouncements(token: string | null = null) {
  const payload = await apiRequest<unknown>("/announcements/", {
    token,
  });

  return coerceArray<Announcement>(payload, ["results", "items", "data", "announcements"]);
}

export function createAnnouncement(token: string, body: CreateAnnouncementRequest) {
  return apiRequest<CreateAnnouncementResponse>("/admin/announcements/", {
    method: "POST",
    token,
    body,
  });
}

export function updateAnnouncementSelection(token: string, id: number, body: UpdateAnnouncementSelectionRequest) {
  return apiRequest<unknown>(`/admin/announcements/${id}/`, {
    method: "PATCH",
    token,
    body,
  });
}

export function deleteAnnouncement(token: string, id: number) {
  return apiRequest<unknown>(`/admin/announcements/${id}/`, {
    method: "DELETE",
    token,
  });
}

export async function fetchInquiries(token: string) {
  const payload = await apiRequest<unknown>("/admin/inquiries/", {
    token,
  });

  return coerceArray<AdminInquiry>(payload, ["results", "items", "data", "inquiries"]);
}

export function updateInquiryStatus(token: string, id: number, body: UpdateInquiryStatusRequest) {
  return apiRequest<unknown>(`/admin/inquiries/${id}/`, {
    method: "PATCH",
    token,
    body,
  });
}
