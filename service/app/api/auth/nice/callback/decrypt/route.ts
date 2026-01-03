import crypto from "crypto";
import iconv from "iconv-lite";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionOptions } from "@/lib/session-config";

/**
 * API route to decrypt NICE callback data
 */
export async function POST(request: NextRequest) {
  console.log("[API Decrypt] 1. Starting NICE data decryption");

  try {
    const body = await request.json();
    const { encData, tokenVersionId, integrityValue } = body;

    console.log("[API Decrypt] 2. Retrieved request data:", {
      hasEncData: !!encData,
      hasTokenVersionId: !!tokenVersionId,
      hasIntegrityValue: !!integrityValue
    });

    // Get session data
    console.log("[API Decrypt] 3. Retrieving session data");
    const session = await getIronSession(cookies(), getSessionOptions());
    const { key, iv } = (session as any) || {};

    console.log("[API Decrypt] 4. Session data:", {
      hasKey: !!key,
      hasIv: !!iv
    });

    if (!encData || !key || !iv) {
      console.log("[API Decrypt] ❌ Missing encryption data or key or iv");
      return NextResponse.json(
        {
          success: false,
          error: "인증 데이터가 올바르지 않습니다."
        },
        { status: 400 }
      );
    }

    // Decrypt data
    console.log("[API Decrypt] 5. Starting decryption process");
    const decrypted = crypto.createDecipheriv(
      "aes-128-cbc",
      Buffer.from(key),
      Buffer.from(iv)
    );
    let decryptedData = decrypted.update(encData, "base64", "binary");
    decryptedData += decrypted.final("binary");

    // Decode from euc-kr
    decryptedData = iconv.decode(
      Buffer.from(decryptedData, "binary"),
      "euc-kr"
    );

    console.log("[API Decrypt] 6. ✅ Decryption successful");
    console.log("[API Decrypt] 7. Decrypted data:", decryptedData);

    // Parse NICE response data
    const parseNiceData = (data: string): Record<string, string> => {
      const result: Record<string, string> = {};
      const cleaned = data.replace(/^\{|\}$/g, "").trim();
      const pairs = cleaned.split('","');

      pairs.forEach((pair) => {
        const [key, ...valueParts] = pair.split('":"');
        const cleanKey = key.replace(/^"|"/g, "");
        const cleanValue = valueParts.join('":"').replace(/^"|"$/g, "");
        if (cleanKey && cleanValue !== undefined) {
          result[cleanKey] = cleanValue;
        }
      });

      return result;
    };

    const niceData = parseNiceData(decryptedData);

    console.log("[API Decrypt] 8. Parsed NICE data:", {
      resultcode: niceData.resultcode,
      hasName: !!niceData.name,
      hasBirthdate: !!niceData.birthdate,
      hasGender: !!niceData.gender,
      hasMobileno: !!niceData.mobileno,
      hasDi: !!niceData.di,
      hasCi: !!niceData.ci,
      hasReceivedata: !!niceData.receivedata
    });

    // Check if authentication was successful
    if (niceData.resultcode !== "0000") {
      console.log("[API Decrypt] ❌ NICE authentication failed:", niceData.resultcode);
      return NextResponse.json(
        {
          success: false,
          error: "본인인증에 실패했습니다. 다시 시도해주세요."
        },
        { status: 400 }
      );
    }

    console.log("[API Decrypt] 9. ✅ NICE authentication successful, returning data");

    // Parse receivedata if exists
    let receivedataObj = null;
    if (niceData.receivedata) {
      try {
        receivedataObj = JSON.parse(niceData.receivedata);
        console.log("[API Decrypt] 10. Parsed receivedata:", receivedataObj);
      } catch (e) {
        console.log("[API Decrypt] 10. Failed to parse receivedata, keeping as string");
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        name: niceData.name,
        birthdate: niceData.birthdate,
        gender: niceData.gender,
        mobileno: niceData.mobileno,
        di: niceData.di,
        ci: niceData.ci,
        requestno: niceData.requestno,
        receivedata: receivedataObj || niceData.receivedata,
      }
    });

  } catch (error: any) {
    console.error("[API Decrypt] ❌ Decryption error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: "인증 데이터 처리 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}
