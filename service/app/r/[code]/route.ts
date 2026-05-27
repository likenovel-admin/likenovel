import { buildShortTrackingRedirectUrl } from "@/utils/marketingAttribution";
import { NextRequest, NextResponse } from "next/server";

export function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  return NextResponse.redirect(
    buildShortTrackingRedirectUrl(params.code, request),
    307
  );
}
