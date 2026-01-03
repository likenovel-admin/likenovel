import { SessionOptions } from "iron-session";

/**
 * Session config for iron-session
 *
 * 의도:
 * - 시크릿을 코드에 하드코딩하지 않고 환경변수에서만 읽습니다.
 * - production 환경에서 NICE 팝업/탭 이동 시 세션 유지를 위해 `sameSite: "none"`이 필요합니다.
 * - local(http) 개발환경에서는 브라우저 정책상 SameSite=None이 Secure를 요구하므로
 *   개발 편의(로컬 테스트/디버깅)를 위해 `sameSite: "lax"`로 낮춥니다.
 */
export const getSessionOptions = (): SessionOptions => {
  const isProd = process.env.NODE_ENV === "production";
  const password = process.env.IRON_SESSION_PASSWORD;
  const cookieName =
    process.env.IRON_SESSION_COOKIE_NAME ||
    "iron-examples-app-router-server-component-and-action";

  if (!password || password.length < 32) {
    console.error(
      "[iron-session] ❌ IRON_SESSION_PASSWORD is missing or too short (min 32 chars)."
    );
    throw new Error(
      "Server misconfiguration: IRON_SESSION_PASSWORD is missing or too short (min 32 chars)."
    );
  }

  return {
    password,
    cookieName,
    cookieOptions: {
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      httpOnly: true,
      maxAge: 60 * 10,
    },
  };
};
