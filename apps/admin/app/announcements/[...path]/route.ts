import type { NextRequest } from "next/server";
import { proxyToUpstream } from "@/app/api/_lib/upstream-proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyLegacyAnnouncements(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToUpstream(request, ["announcements", ...path]);
}

export const GET = proxyLegacyAnnouncements;
export const POST = proxyLegacyAnnouncements;
export const PUT = proxyLegacyAnnouncements;
export const PATCH = proxyLegacyAnnouncements;
export const DELETE = proxyLegacyAnnouncements;
export const OPTIONS = proxyLegacyAnnouncements;
