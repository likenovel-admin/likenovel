/**
 * NICE 본인인증(서버 전용) 설정 유틸
 *
 * 의도:
 * - clientId/secret 같은 시크릿을 코드에 하드코딩하지 않고 환경변수에서만 읽습니다.
 * - 누락 시, 운영/개발에서 원인 파악이 가능하도록 명확한 에러를 던집니다.
 */
export function getNiceServerConfig(): {
  clientId: string;
  clientSecret: string;
  productId: string;
  basicAuthHeader: string;
} {
  const clientId = process.env.NICE_CLIENT_ID;
  const clientSecret = process.env.NICE_CLIENT_SECRET;
  const productId = process.env.NICE_PRODUCT_ID || "2101979031";

  if (!clientId || !clientSecret) {
    console.error("[NICE] ❌ Missing NICE_CLIENT_ID or NICE_CLIENT_SECRET");
    throw new Error(
      "Server misconfiguration: NICE_CLIENT_ID or NICE_CLIENT_SECRET is missing."
    );
  }

  // NOTE: Basic Auth for NICE access token API
  const basicAuthHeader =
    "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  return { clientId, clientSecret, productId, basicAuthHeader };
}


