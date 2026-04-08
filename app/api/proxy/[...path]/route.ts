import { NextRequest, NextResponse } from "next/server"

const SERVER_API_BASE_URL = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "")

function buildTargetUrl(pathSegments: string[], search: string) {
  const normalizedPath = pathSegments.join("/")
  return `${SERVER_API_BASE_URL}/${normalizedPath}${search}`
}

async function proxyRequest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!SERVER_API_BASE_URL) {
    return NextResponse.json(
      {
        success: false,
        message: "API base URL is not configured on the server.",
      },
      { status: 503 },
    )
  }

  const { path } = await context.params
  const targetUrl = buildTargetUrl(path, request.nextUrl.search)
  const requestHeaders = new Headers(request.headers)

  requestHeaders.delete("host")
  requestHeaders.delete("content-length")

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers: requestHeaders,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual",
  })

  const responseHeaders = new Headers(upstreamResponse.headers)
  responseHeaders.delete("content-encoding")
  responseHeaders.delete("content-length")

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  })
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}
