import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionOptions } from "@/lib/session-config";

/**
 * API Route to save user input email to session
 * This email will be compared with NICE verified email later
 */
export async function POST(request: NextRequest) {
  const LOG_PREFIX = "[API /api/auth/find-password/save-email]";
  const USER_ERROR_MESSAGE =
    "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "이메일 주소를 입력해주세요." },
        { status: 400 }
      );
    }

    const session = await getIronSession(cookies(), getSessionOptions());
    (session as any).findPasswordInputEmail = email;
    await session.save();

    console.log(`${LOG_PREFIX} Email saved to session`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`${LOG_PREFIX} ❌ failed:`, {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { success: false, error: USER_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}
