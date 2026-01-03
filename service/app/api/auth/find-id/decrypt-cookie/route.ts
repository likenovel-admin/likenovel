import { getIronSession } from "iron-session";
import { NextResponse } from "next/server";
import { getSessionOptions } from "@/lib/session-config";

/**
 * Decrypt a specific iron-session cookie value
 * POST with body: { cookieValue: "Fe26.2*..." }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cookieValue } = body;

    if (!cookieValue) {
      return NextResponse.json(
        { error: "Missing cookieValue in request body" },
        { status: 400 }
      );
    }

    const sessionOptions = getSessionOptions();

    // Create a mock cookie header with the provided value
    const mockCookies = {
      get: (name: string) => {
        if (name === sessionOptions.cookieName) {
          return { value: cookieValue, name };
        }
        return undefined;
      },
      set: () => {},
      delete: () => {},
      has: (name: string) => name === sessionOptions.cookieName,
      getAll: () => [{ name: sessionOptions.cookieName, value: cookieValue }],
    };

    // Try to decrypt the session
    const session = await getIronSession(mockCookies as any, sessionOptions);

    // Extract all session data
    const sessionData = {
      findIdResult: (session as any).findIdResult || null,
      findIdLogData: (session as any).findIdLogData || null,
      key: (session as any).key ? `exists (${(session as any).key.length} bytes)` : null,
      iv: (session as any).iv ? `exists (${(session as any).iv.length} bytes)` : null,
      allKeys: Object.keys(session),
    };

    let parsedLogData = null;
    if ((session as any).findIdLogData) {
      try {
        parsedLogData = JSON.parse((session as any).findIdLogData);
      } catch (e) {
        parsedLogData = { error: "Failed to parse JSON", exception: String(e) };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cookie decrypted successfully",
      sessionData,
      parsedLogData,
      rawSession: session,
    });
  } catch (error: any) {
    console.error("[Decrypt Cookie] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to decrypt cookie",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint shows usage instructions
 */
export async function GET() {
  return NextResponse.json({
    message: "POST endpoint to decrypt iron-session cookie",
    usage: {
      method: "POST",
      endpoint: "/api/auth/find-id/decrypt-cookie",
      body: {
        cookieValue: "Fe26.2*1*...",
      },
      example: `
fetch('/api/auth/find-id/decrypt-cookie', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cookieValue: 'Fe26.2*1*4ab3384d107885b030b02306bf9f82c7a81862fed0c08d750ed3b6aaa226cfa7*...'
  })
}).then(r => r.json()).then(console.log)
      `,
    },
  });
}
