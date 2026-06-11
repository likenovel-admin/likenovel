import { getSessionOptions } from "@/lib/session-config";
import { getNiceServerConfig } from "@/lib/nice-config";
import axios from "axios";
import crypto from "crypto";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * nice 본인인증
 * @returns
 */
export async function POST() {
  console.log("[API /api/query/mypage] 1. Starting NICE token generation");

  /**
   * NOTE:
   * - GitHub 업로드/운영 안정성을 위해 NICE 시크릿은 반드시 환경변수로 주입해야 합니다.
   */
  let niceConfig: ReturnType<typeof getNiceServerConfig>;
  try {
    niceConfig = getNiceServerConfig();
  } catch (error: any) {
    console.error("[API /api/query/mypage] ❌ NICE config error:", error?.message);
    return NextResponse.json(
      { message: "NICE 설정이 올바르지 않습니다. 서버 환경변수를 확인해주세요.", data: null },
      { status: 500 }
    );
  }

  /**
   * NICE 액세스 토큰 호출
   */
  console.log("[API /api/query/mypage] 2. Requesting NICE access token");
  const authForAccessToken = niceConfig.basicAuthHeader;

  const accessTokenResponse = await axios({
    method: "POST",
    url: "https://svc.niceapi.co.kr:22001/digital/niceid/oauth/oauth/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `${authForAccessToken}`,
    },
    data: {
      grant_type: "client_credentials",
      scope: "default",
    },
  });

  console.log("[API /api/query/mypage] 3. Access token response:", {
    resultCode: accessTokenResponse.data.dataHeader.GW_RSLT_CD,
    hasAccessToken: !!accessTokenResponse.data?.dataBody?.access_token,
  });

  /**
   * NICE 암호화 토큰 호출
   */
  if (accessTokenResponse.data.dataHeader.GW_RSLT_CD == "1200") {
    console.log(
      "[API /api/query/mypage] 4. ✅ Access token received, requesting crypto token"
    );
    const accessToken = accessTokenResponse.data?.dataBody?.access_token || "";
    // console.log("response:", accessToken);
    //"451ad655-9ee0-4340-8513-2e52f4bec586"
    const currentDate = new Date();
    const currentTimestamp = Math.floor(currentDate.getTime() / 1000);
    // 1711008642

    //const reqNo = crypto.randomUUID().substring(0, 30)
    // 123e4567-e89b-12d3-a456-426614

    const productId = niceConfig.productId; //본인확인(통합형)
    const authorization = Buffer.from(
      accessToken +
        ":" +
        currentTimestamp +
        ":" +
        niceConfig.clientId
    ).toString("base64");

    const authForSecureToken =
      "bearer " +
      btoa(
        accessToken +
          ":" +
          currentTimestamp +
          ":" +
          niceConfig.clientId
      );

    // console.log("authForSecureToken:", authForSecureToken)

    const nowDate = new Date();

    const year = nowDate.getFullYear();
    const month = String(nowDate.getMonth() + 1).padStart(2, "0");
    const day = String(nowDate.getDate()).padStart(2, "0");
    const hours = String(nowDate.getHours()).padStart(2, "0");
    const minutes = String(nowDate.getMinutes()).padStart(2, "0");
    const seconds = String(nowDate.getSeconds()).padStart(2, "0");

    const formattedDateTime = `${year}${month}${day}${hours}${minutes}${seconds}`;
    const reqNo = formattedDateTime;

    // https://svc.niceapi.co.kr:22001/digital/niceid/api/v1.0/common/crypto/token 암호화 토큰 발급
    console.log(
      "[API /api/query/mypage] 5. Requesting crypto token with reqNo:",
      reqNo
    );
    const authForSecureTokenResponse = await axios({
      method: "POST",
      url: "https://svc.niceapi.co.kr:22001/digital/niceid/api/v1.0/common/crypto/token",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${authForSecureToken}`,
        productID: productId,
      },
      data: {
        dataHeader: {
          CNTY_CD: "ko", // 이용언어 : ko, en, cn
        },
        dataBody: {
          req_dtim: formattedDateTime, // 요청일시
          req_no: reqNo, // 요청고유번호
          enc_mode: "1", // 사용할 암복호화 구분 1 : AES128/CBC/PKCS7
        },
      },
    });

    console.log("[API /api/query/mypage] 6. Crypto token response:", {
      resultCode: authForSecureTokenResponse.data.dataHeader.GW_RSLT_CD,
      rspCode: authForSecureTokenResponse.data.dataBody.rsp_cd,
      hasTokenVersionId:
        !!authForSecureTokenResponse.data.dataBody.token_version_id,
    });

    // P000 성공, 이외 모두 오류
    if (
      authForSecureTokenResponse.data.dataHeader.GW_RSLT_CD !== "1200" &&
      authForSecureTokenResponse.data.dataBody.rsp_cd !== "P000"
    ) {
      console.log("[API /api/query/mypage] ❌ Failed to request crypto token");
      throw new Error(
        "Failed to request crypto token",
        authForSecureTokenResponse.data.dataBody.rsp_cd
      );
    }
    /*
      NICE returns site_code, token_version_id, token_val, and period.
      Do not keep sample token values in source.
     */
    const siteCode = authForSecureTokenResponse.data.dataBody.site_code;
    const tokenVal = authForSecureTokenResponse.data.dataBody.token_val;
    const tokenVersionId =
      authForSecureTokenResponse.data.dataBody.token_version_id;

    console.log(
      "[API /api/query/mypage] 7. ✅ Crypto token received successfully"
    );

    /**
     * 표준창 호출 - 01. 대칭키 생성
     */
    console.log("[API /api/query/mypage] 8. Generating symmetric key pair");
    const value = formattedDateTime.trim() + reqNo.trim() + tokenVal.trim();
    // SHA256 암호화 후 Base64 encoding
    const hash = crypto.createHash("sha256").update(value).digest("base64");
    const pairKey = {
      key: hash.slice(0, 16), // 앞에서부터 16byte
      iv: hash.slice(-16), // 뒤에서부터 16byte
      hmacKey: hash.slice(0, 32), // 앞에서부터 32byte
    };

    /**
     * 표준창 호출 - 02. 요청 데이터 암호화
     */
    console.log("[API /api/query/mypage] 9. Preparing receiveDataPayload");

    // Prepare receiveDataPayload to send to NICE (will be returned in callback)
    const receiveDataPayload = JSON.stringify({
      encryption_key: pairKey.key,
      encryption_iv: pairKey.iv,
      hmac_key: pairKey.hmacKey,
      req_no: reqNo,
    });

    console.log("[API /api/query/mypage] 10. receiveDataPayload prepared");

    // iron session을 사용하여 key, iv, hmacKey, reqNo, receiveDataPayload 저장
    console.log(
      "[API /api/query/mypage] 11. Saving encryption keys and receiveDataPayload to session"
    );
    const session = await getIronSession(cookies(), getSessionOptions());
    (session as any).key = pairKey.key;
    (session as any).iv = pairKey.iv;
    (session as any).hmacKey = pairKey.hmacKey;
    (session as any).reqNo = reqNo;
    (session as any).receiveDataPayload = receiveDataPayload;
    await session.save();
    console.log(
      "[API /api/query/mypage] 12. ✅ Session saved successfully (key, iv, hmacKey, reqNo, receiveDataPayload)"
    );

    console.log("[API /api/query/mypage] 13. Encrypting request data");

    const reqData = {
      requestno: reqNo, // 서비스 요청 고유 번호(*)
      returnurl: `${process.env.NEXT_PUBLIC_WWW_SERVER_URI}/auth/nice/callback`, // 인증결과를 받을 url(*)
      sitecode: siteCode, // 암호화토큰요청 API 응답 site_code(*)
      authtype: "", // 인증수단 고정(M:휴대폰인증,C:카드본인확인인증,X:인증서인증,U:공동인증서인증,F:금융인증서인증,S:PASS인증서인증)
      methodtype: "get", // 요청 방식 고정(get:팝업,post:팝업없음)
      popupyn: "Y", // 팝업 여부 고정(Y:팝업,N:팝업없음)
      receivedata: receiveDataPayload, // 인증 후 전달받을 데이터 세팅 (will be returned in callback response)
    };

    // AES128/CBC/PKCS7 암호화
    const cipher = crypto.createCipheriv(
      "aes-128-cbc",
      Buffer.from(pairKey.key),
      Buffer.from(pairKey.iv)
    );
    const encrypted_data =
      cipher.update(JSON.stringify(reqData).trim(), "utf-8", "base64") +
      cipher.final("base64");

    /**
     * 표준창 호출 - 03. Hmac 무결성 체크값 생성
     */
    console.log("[API /api/query/mypage] 12. Generating HMAC integrity value");
    const hmac = crypto.createHmac("sha256", Buffer.from(pairKey.hmacKey));
    hmac.update(Buffer.from(encrypted_data));

    const integrityValue = hmac.digest().toString("base64");

    console.log(
      "[API /api/query/mypage] 13. ✅ Returning encrypted data to client"
    );
    return NextResponse.json({
      message: "",
      data: {
        tokenVersionId: tokenVersionId,
        encData: encrypted_data,
        integrityValue: integrityValue,
      },
    });
  }

  console.log("[API /api/query/mypage] ❌ Access token request failed");
  return NextResponse.json({ message: "", data: "" });
}
