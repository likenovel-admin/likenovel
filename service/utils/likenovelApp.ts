export const LIKENOVEL_APP_USER_AGENT_TOKEN = "LikeNovelApp";
export const LIKENOVEL_APP_HEADER = "x-likenovel-app";

export const APP_PAYMENT_UNSUPPORTED_MESSAGE =
  "앱에서는 구매를 지원하지 않습니다.";
export const APP_PURCHASED_CONTENT_MESSAGE =
  "이미 구매한 콘텐츠는 앱에서도 이용할 수 있습니다.";

type HeaderReader = {
  get(name: string): string | null;
};

export function isLikenovelAppUserAgent(userAgent: string | null | undefined) {
  return new RegExp(
    `(^|\\s)${LIKENOVEL_APP_USER_AGENT_TOKEN}(\\/|\\s|$)`,
    "i"
  ).test(userAgent ?? "");
}

export function isLikenovelAppHeader(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return !!normalized && normalized !== "false" && normalized !== "0";
}

export function isLikenovelAppRequestHeaders(headers: HeaderReader) {
  return (
    isLikenovelAppHeader(headers.get(LIKENOVEL_APP_HEADER)) ||
    isLikenovelAppUserAgent(headers.get("user-agent"))
  );
}

export function isLikenovelAppBrowser() {
  if (typeof window === "undefined") return false;

  const maybeNativeWindow = window as Window & {
    isNativeApp?: boolean;
  };

  return (
    maybeNativeWindow.isNativeApp === true ||
    isLikenovelAppUserAgent(window.navigator.userAgent)
  );
}
