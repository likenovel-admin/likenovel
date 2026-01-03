import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionOptions } from "@/lib/session-config";

/**
 * API route to get encryption keys from session
 * Used by NICE callback to retrieve keys for backend API call
 */
export async function GET() {
  console.log("[API Encryption Keys] 1. Getting encryption keys from session");

  try {
    // Get session data
    const session = await getIronSession(cookies(), getSessionOptions());
    const { key, iv, hmacKey, reqNo, receiveDataPayload } = (session as any) || {};

    console.log("[API Encryption Keys] 2. Session data:", {
      hasKey: !!key,
      hasIv: !!iv,
      hasHmacKey: !!hmacKey,
      hasReqNo: !!reqNo,
      hasReceiveDataPayload: !!receiveDataPayload,
    });

    if (!key || !iv || !hmacKey) {
      console.log("[API Encryption Keys] ❌ Missing encryption keys in session");
      return NextResponse.json(
        {
          success: false,
          error: "세션에 암호화 키가 없습니다. 인증을 다시 시작해주세요.",
        },
        { status: 400 }
      );
    }

    console.log("[API Encryption Keys] 3. ✅ Encryption keys retrieved successfully");

    return NextResponse.json({
      success: true,
      data: {
        encryption_key: key,
        encryption_iv: iv,
        hmac_key: hmacKey,
        req_no: reqNo,
        receiveDataPayload: receiveDataPayload,
      },
    });
  } catch (error: any) {
    console.error("[API Encryption Keys] ❌ Error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: "암호화 키를 가져오는 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
