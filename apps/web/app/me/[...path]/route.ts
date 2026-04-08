import { NextRequest } from "next/server"
import { proxyToUpstream } from "@/app/api/_lib/upstream-proxy"

async function proxyLegacyMe(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return proxyToUpstream(request, ["me", ...path])
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyLegacyMe(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyLegacyMe(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyLegacyMe(request, context)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyLegacyMe(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyLegacyMe(request, context)
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyLegacyMe(request, context)
}
