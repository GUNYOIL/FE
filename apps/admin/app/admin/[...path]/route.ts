import type { NextRequest } from "next/server";
import { proxyToUpstream } from "@/app/api/_lib/upstream-proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyLegacyAdmin(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToUpstream(request, ["admin", ...path]);
}

export const GET = proxyLegacyAdmin;
export const POST = proxyLegacyAdmin;
export const PUT = proxyLegacyAdmin;
export const PATCH = proxyLegacyAdmin;
export const DELETE = proxyLegacyAdmin;
export const OPTIONS = proxyLegacyAdmin;
