import { ISocialLoginProvider } from "@/types";

export const getStateAndReDirectUri = (
  provider: ISocialLoginProvider,
  isKeepSignIn: boolean,
  isSignIn: boolean,
  isAgreeToAD?: boolean
) => {
  let state = "N-likenovel";
  let redirectUri =
    provider === "naver"
      ? process.env.NEXT_PUBLIC_NAVER_SIGNIN_REDIRECT_URI
      : provider === "kakao"
      ? process.env.NEXT_PUBLIC_KAKAO_SIGNIN_REDIRECT_URI
      : provider === "google"
      ? process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_REDIRECT_URI
      : process.env.NEXT_PUBLIC_APPLE_SIGNIN_REDIRECT_URI;
  // 회원가입 페이지에서 로그인 접근 시 - 광고 수신 동의 여부에 따라 state 값 변경
  if (!isSignIn) {
    state = isAgreeToAD ? "Y-likenovel" : "N-likenovel";
    redirectUri =
      provider === "naver"
        ? process.env.NEXT_PUBLIC_NAVER_SIGNUP_REDIRECT_URI
        : provider === "kakao"
        ? process.env.NEXT_PUBLIC_KAKAO_SIGNUP_REDIRECT_URI
        : provider === "google"
        ? process.env.NEXT_PUBLIC_GOOGLE_SIGNUP_REDIRECT_URI
        : process.env.NEXT_PUBLIC_APPLE_SIGNUP_REDIRECT_URI;
  } else {
    // 로그인 페이지에서 로그인 접근 시 - 로그인 유지 여부에 따라 state 값 변경
    state = isKeepSignIn ? "Y-likenovel" : "N-likenovel";
  }
  return { state, redirectUri };
};
