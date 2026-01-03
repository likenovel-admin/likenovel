import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionOptions } from "@/lib/session-config";

/**
 * Debug endpoint to view current session data
 * Available in all environments for NICE debugging
 *
 * WHY THIS IS NEEDED:
 * - F12 Application Tab → Cookies DOES show the cookie
 * - Cookie name: "iron-examples-app-router-server-component-and-action"
 * - BUT the cookie value is ENCRYPTED by iron-session
 * - You CANNOT read the actual data from F12 directly
 * - This endpoint DECRYPTS the session and returns readable JSON
 *
 * USAGE:
 * - In browser console: fetch('/api/auth/find-id/debug').then(r => r.json()).then(console.log)
 * - Or use window.sessionDebug (auto-populated on find-id-fail page)
 */
export async function GET() {
  // Note: Keeping this open for production since NICE only works in production
  // In real production, you may want to add authentication or remove this endpoint

  const session = await getIronSession(cookies(), getSessionOptions());

  // Return all session data
  const sessionData = {
    findIdResult: (session as any).findIdResult || null,
    findIdLogData: (session as any).findIdLogData || null,
    key: (session as any).key ? "exists (hidden)" : null,
    iv: (session as any).iv ? "exists (hidden)" : null,
    rawSession: session,
  };

  let parsedLogData = null;
  if ((session as any).findIdLogData) {
    try {
      parsedLogData = JSON.parse((session as any).findIdLogData);
    } catch (e) {
      parsedLogData = { error: "Failed to parse JSON", exception: String(e) };
    }
  }

  // Debug: Check why logData might be empty
  const debugInfo = {
    hasFindIdResult: !!(session as any).findIdResult,
    hasFindIdLogData: !!(session as any).findIdLogData,
    findIdLogDataLength: ((session as any).findIdLogData || "").length,
    findIdLogDataRaw: (session as any).findIdLogData,
    allSessionKeys: Object.keys(session),
  };

  return NextResponse.json({
    message: "Current session data",
    hasSession: !!((session as any).findIdResult || (session as any).key),
    sessionData,
    parsedLogData,
    debugInfo,
  });
}
