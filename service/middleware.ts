import { NextRequest, NextResponse } from "next/server";
import { isLikenovelAppRequestHeaders } from "./utils/likenovelApp";

const APP_PAYMENT_UNAVAILABLE_PATH = "/app-payment-unavailable";

export function middleware(request: NextRequest) {
  if (!isLikenovelAppRequestHeaders(request.headers)) {
    return NextResponse.next();
  }

  const nextUrl = request.nextUrl.clone();
  nextUrl.pathname = APP_PAYMENT_UNAVAILABLE_PATH;
  nextUrl.search = "";

  return NextResponse.rewrite(nextUrl);
}

export const config = {
  matcher: ["/product/mypage/cash/:path*", "/order/payment/complete"],
};
