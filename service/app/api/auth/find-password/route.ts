import axios from "axios";
import crypto from "crypto";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionOptions } from "@/lib/session-config";
import { getNiceServerConfig } from "@/lib/nice-config";

/**
 * nice 본인인증 for find-password
 * @returns
 */
export async function POST() {
  const LOG_PREFIX = "[API /api/auth/find-password]";
  const USER_ERROR_MESSAGE =
    "본인인증 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
  /**
   * NOTE:
   * - GitHub 업로드/운영 안정성을 위해 NICE 시크릿은 반드시 환경변수로 주입해야 합니다.
   */
  let niceConfig: ReturnType<typeof getNiceServerConfig>;
  try {
    niceConfig = getNiceServerConfig();
  } catch (error: any) {
    console.error(`${LOG_PREFIX} ❌ NICE config error:`, error?.message);
    return NextResponse.json(
      {
        message: USER_ERROR_MESSAGE,
        data: null,
      },
      { status: 500 }
    );
  }

  try {
    /**
     * NICE 액세스 토큰 호출
     */
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

    const accessTokenGwCode =
      accessTokenResponse.data?.dataHeader?.GW_RSLT_CD || "";
    if (accessTokenGwCode !== "1200") {
      console.error(`${LOG_PREFIX} ❌ NICE access token failed`, {
        gwCode: accessTokenGwCode,
        gwMsg: accessTokenResponse.data?.dataHeader?.GW_RSLT_MSG,
      });
      return NextResponse.json(
        {
          message: USER_ERROR_MESSAGE,
          data: null,
        },
        { status: 502 }
      );
    }

    /**
     * NICE 암호화 토큰 호출
     */
    const accessToken = accessTokenResponse.data?.dataBody?.access_token || "";
    const currentDate = new Date();
    const currentTimestamp = Math.floor(currentDate.getTime() / 1000);

    const productId = niceConfig.productId; // 본인확인(통합형)

    const authForSecureToken =
      "bearer " +
      btoa(
        accessToken +
          ":" +
          currentTimestamp +
          ":" +
          niceConfig.clientId
      );

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

    const secureTokenGwCode =
      authForSecureTokenResponse.data?.dataHeader?.GW_RSLT_CD || "";
    const secureTokenRspCode =
      authForSecureTokenResponse.data?.dataBody?.rsp_cd || "";
    // P000 + 1200 성공, 이외 모두 오류
    if (secureTokenGwCode !== "1200" || secureTokenRspCode !== "P000") {
      console.error(`${LOG_PREFIX} ❌ NICE crypto token failed`, {
        gwCode: secureTokenGwCode,
        gwMsg: authForSecureTokenResponse.data?.dataHeader?.GW_RSLT_MSG,
        rspCode: secureTokenRspCode,
        rspMsg: authForSecureTokenResponse.data?.dataBody?.rsp_msg,
      });
      return NextResponse.json(
        {
          message: USER_ERROR_MESSAGE,
          data: null,
        },
        { status: 502 }
      );
    }

    const siteCode = authForSecureTokenResponse.data.dataBody.site_code;
    const tokenVal = authForSecureTokenResponse.data.dataBody.token_val;
    const tokenVersionId =
      authForSecureTokenResponse.data.dataBody.token_version_id;

    /**
     * 표준창 호출 - 01. 대칭키 생성
     */
    const value = formattedDateTime.trim() + reqNo.trim() + tokenVal.trim();
    // SHA256 암호화 후 Base64 encoding
    const hash = crypto.createHash("sha256").update(value).digest("base64");
    const pairKey = {
      key: hash.slice(0, 16), // 앞에서부터 16byte
      iv: hash.slice(-16), // 뒤에서부터 16byte
      hmacKey: hash.slice(0, 32), // 앞에서부터 32byte
    };

    // iron session을 사용하여 key, iv 값 저장
    const session = await getIronSession(cookies(), getSessionOptions());
    (session as any).key = pairKey.key;
    (session as any).iv = pairKey.iv;
    await session.save();

    /**
     * 표준창 호출 - 02. 요청 데이터 암호화
     * returnUrl을 find-password callback으로 변경
     */
    const reqData = {
      requestno: reqNo, // 서비스 요청 고유 번호(*)
      returnurl: `${process.env.NEXT_PUBLIC_WWW_SERVER_URI}/auth/nice/find-password-callback`, // 인증결과를 받을 url(*)
      sitecode: siteCode, // 암호화토큰요청 API 응답 site_code(*)
      authtype: "", // 인증수단 고정(M:휴대폰인증,C:카드본인확인인증,X:인증서인증,U:공동인증서인증,F:금융인증서인증,S:PASS인증서인증)
      methodtype: "get", // 요청 방식 고정(get:팝업,post:팝업없음)
      popupyn: "Y", // 팝업 여부 고정(Y:팝업,N:팝업없음)
      receivedata: "", // 인증 후 전달받을 데이터 세팅
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
    const hmac = crypto.createHmac("sha256", Buffer.from(pairKey.hmacKey));
    hmac.update(Buffer.from(encrypted_data));

    const integrityValue = hmac.digest().toString("base64");

    return NextResponse.json({
      message: "",
      data: {
        tokenVersionId: tokenVersionId,
        encData: encrypted_data,
        integrityValue: integrityValue,
      },
    });
  } catch (error: any) {
    console.error(`${LOG_PREFIX} ❌ unhandled error:`, {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    return NextResponse.json(
      {
        message: USER_ERROR_MESSAGE,
        data: null,
      },
      { status: 500 }
    );
  }
}
