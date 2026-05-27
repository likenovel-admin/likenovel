import {
  buildShortTrackingAttribution,
  buildShortTrackingRedirectUrl,
  encodeMarketingAttributionCookiePayload,
  MARKETING_ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
  MARKETING_ATTRIBUTION_COOKIE_NAME,
} from "@/utils/marketingAttribution";
import { NextRequest, NextResponse } from "next/server";

export function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const response = NextResponse.redirect(
    buildShortTrackingRedirectUrl(params.code, request),
    307
  );
  const attribution = buildShortTrackingAttribution(params.code);

  if (attribution) {
    response.cookies.set({
      name: MARKETING_ATTRIBUTION_COOKIE_NAME,
      value: encodeMarketingAttributionCookiePayload(attribution),
      maxAge: MARKETING_ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}
