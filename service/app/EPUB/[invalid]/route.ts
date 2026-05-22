import { NextResponse } from "next/server";

import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";

const BROKEN_IMAGE_SENTINELS = new Set(["none", "null", "undefined"]);

export async function GET(
  request: Request,
  { params }: { params: { invalid: string } }
) {
  const invalid = params.invalid?.trim().toLowerCase();

  if (!invalid || !BROKEN_IMAGE_SENTINELS.has(invalid)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ||
    requestUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    requestUrl.host;

  return NextResponse.redirect(
    new URL(DEFAULT_PRODUCT_IMAGE, `${proto}://${host}`),
    307
  );
}
