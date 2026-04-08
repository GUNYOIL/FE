import type { NextRequest } from "next/server";
import { proxyToUpstream } from "@/app/api/_lib/upstream-proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyLegacyCatalog(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToUpstream(request, ["catalog", ...path]);
}

export const GET = proxyLegacyCatalog;
export const POST = proxyLegacyCatalog;
export const PUT = proxyLegacyCatalog;
export const PATCH = proxyLegacyCatalog;
export const DELETE = proxyLegacyCatalog;
export const OPTIONS = proxyLegacyCatalog;
