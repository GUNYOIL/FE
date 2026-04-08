import type { NextRequest } from "next/server";
import { proxyToUpstream } from "@/app/api/_lib/upstream-proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handleProxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToUpstream(request, path);
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
