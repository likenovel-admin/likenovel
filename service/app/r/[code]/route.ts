import { buildShortTrackingDestination } from "@/utils/marketingAttribution";
import { NextRequest, NextResponse } from "next/server";

export function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const destination = buildShortTrackingDestination(params.code);
  if (!destination) {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }

  return NextResponse.redirect(new URL(destination, request.url), 307);
}
