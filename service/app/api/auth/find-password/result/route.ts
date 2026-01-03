import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionOptions } from "@/lib/session-config";

/**
 * API Route to get find-password redirect URL from session
 */
export async function GET() {
  try {
    const session = await getIronSession(cookies(), getSessionOptions());
    const redirectUrl =
      (session as any).findPasswordRedirectUrl || "/find-password?error=unknown";

    console.log("[Find-Password Result API] Returning redirectUrl:", redirectUrl);

    return NextResponse.json({
      redirectUrl,
    });
  } catch (error: any) {
    console.error("Error getting find-password result:", error);
    return NextResponse.json(
      {
        redirectUrl: "/find-password?error=unknown",
      },
      { status: 500 }
    );
  }
}
