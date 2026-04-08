import { NextRequest, NextResponse } from "next/server";

const SERVER_API_BASE_URL = (process.env.API_BASE_URL ?? "").replace(/\/+$/, "");

function buildTargetUrl(pathSegments: string[], search: string) {
  const normalizedPath = pathSegments.join("/").replace(/^\/+|\/+$/g, "");
  const pathname = normalizedPath ? `${normalizedPath}/` : "";
  return `${SERVER_API_BASE_URL}/${pathname}${search}`;
}

export async function proxyToUpstream(request: NextRequest, pathSegments: string[]) {
  if (!SERVER_API_BASE_URL) {
    return NextResponse.json(
      {
        success: false,
        message: "API base URL is not configured on the server.",
      },
      { status: 503 },
    );
  }

  const targetUrl = buildTargetUrl(pathSegments, request.nextUrl.search);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.delete("host");
  requestHeaders.delete("content-length");

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers: requestHeaders,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}
