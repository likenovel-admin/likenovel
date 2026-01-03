import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionOptions } from "@/lib/session-config";

/**
 * Test endpoint to manually create find-id session data
 * Only for development/testing
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { redirectUrl, logData } = body;

  const session = await getIronSession(cookies(), getSessionOptions());

  // Set test data
  (session as any).findIdResult = redirectUrl || "/find-id-fail";
  (session as any).findIdLogData = JSON.stringify(
    logData || {
      hasEncData: true,
      hasKey: true,
      hasIv: true,
      decryptedData: "Test decrypted data",
      niceData: { name: "테스트", birthdate: "19900101", mobileno: "01012345678", gender: "1" },
      error: "User not found - TEST",
    }
  );

  await session.save();

  return NextResponse.json({
    success: true,
    message: "Test session created",
    data: {
      findIdResult: (session as any).findIdResult,
      findIdLogData: (session as any).findIdLogData,
    },
  });
}

/**
 * GET endpoint shows usage
 */
export async function GET() {
  return NextResponse.json({
    message: "POST to create test session data",
    usage: `
fetch('/api/auth/find-id/test-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    redirectUrl: '/find-id-fail',
    logData: {
      error: 'Test error message',
      niceData: { name: '홍길동', mobileno: '01012345678' }
    }
  })
}).then(r => r.json()).then(console.log)
    `,
  });
}
