import { getSessionOptions } from "@/lib/session-config";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Get find-id result from session
 * @returns
 */
export async function GET(request: NextRequest) {
  const res = NextResponse.next();
  // Debug: Check all cookies
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();

  console.log("[Find-ID Result API] ========== START ==========");
  console.log("[Find-ID Result API] All cookies received:", {
    count: allCookies.length,
    names: allCookies.map((c) => c.name),
  });

  const session = await getIronSession(request, res, getSessionOptions());

  const redirectUrl = (session as any).findIdResult || "/find-id-fail";
  const logDataStr = (session as any).findIdLogData || "{}";

  // Debug logging
  console.log("[Find-ID Result API] Session check:", {
    hasFindIdResult: !!(session as any).findIdResult,
    hasFindIdLogData: !!(session as any).findIdLogData,
    logDataStrLength: logDataStr.length,
    redirectUrl,
    session,
  });

  let logData;
  try {
    logData = JSON.parse(logDataStr);
  } catch (e) {
    console.error("[Find-ID Result API] Failed to parse logData:", e);
    logData = {};
  }

  // DON'T clear session data immediately - keep it for debugging/logging
  // Session will auto-expire after maxAge (10 minutes)
  // Only clear if success (to prevent reuse)
  if (redirectUrl.startsWith("/find-id-ok")) {
    delete (session as any).findIdResult;
    delete (session as any).findIdLogData;
    await session.save();
  }

  return NextResponse.json({
    redirectUrl,
    logData,
  });
}
