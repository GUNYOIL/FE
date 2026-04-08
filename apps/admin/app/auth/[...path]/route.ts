import type { NextRequest } from "next/server";
import { proxyToUpstream } from "@/app/api/_lib/upstream-proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyLegacyAuth(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToUpstream(request, ["auth", ...path]);
}

export const GET = proxyLegacyAuth;
export const POST = proxyLegacyAuth;
export const PUT = proxyLegacyAuth;
export const PATCH = proxyLegacyAuth;
export const DELETE = proxyLegacyAuth;
export const OPTIONS = proxyLegacyAuth;
