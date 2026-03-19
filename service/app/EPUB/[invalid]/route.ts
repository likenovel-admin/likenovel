import { NextResponse } from "next/server";

import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";

const BROKEN_IMAGE_SENTINELS = new Set(["none", "null", "undefined"]);

export async function GET(
  _request: Request,
  { params }: { params: { invalid: string } }
) {
  const invalid = params.invalid?.trim().toLowerCase();

  if (!invalid || !BROKEN_IMAGE_SENTINELS.has(invalid)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.redirect(DEFAULT_PRODUCT_IMAGE, 307);
}
