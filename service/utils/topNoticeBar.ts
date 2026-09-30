export const TOP_NOTICE_BAR_HEIGHT_PX = 36;
export const TOP_NOTICE_BAR_CSS_VAR = "--top-notice-bar-h";
export const TOP_NOTICE_BAR_DISMISS_STORAGE_KEY = "likenovel:top-notice-bar:dismissed-list";
export const TOP_NOTICE_BAR_CACHE_STORAGE_KEY = "likenovel:top-notice-bar:last";
export const TOP_NOTICE_BAR_DISMISS_LIMIT = 20;
// 예약 시작/종료가 열린 화면에도 반영되도록 주기적으로 다시 조회한다.
export const TOP_NOTICE_BAR_REFRESH_MS = 5 * 60 * 1000;

export interface ITopNoticeBar {
  noticeId: number;
  text: string;
}

// 같은 공지·같은 문구를 닫았으면 다시 띄우지 않고, 문구가 바뀌면 다시 보여준다.
export const buildTopNoticeBarDismissToken = (bar: ITopNoticeBar) =>
  `${bar.noticeId}:${bar.text}`;

// 웹소챗은 화면 높이에 맞춘 채팅 레이아웃이라 띠를 띄우지 않는다.
export const isTopNoticeBarHiddenOnPath = (pathname?: string | null) =>
  Boolean(pathname && pathname.startsWith("/websochat"));

export const buildTopNoticeBarHref = (noticeId: number) =>
  `/product/customer-service/notice/${noticeId}`;

const parseJson = (raw: string | null): unknown => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // 손상된 저장값은 없는 값으로 본다.
    return null;
  }
};

export const parseDismissedTopNoticeBarTokens = (raw: string | null): string[] => {
  const value = parseJson(raw);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
};

// 여러 띠를 닫아도 각각 기억한다. 최근 것부터 최대 개수만 남긴다.
export const addDismissedTopNoticeBarToken = (tokens: string[], token: string) =>
  [token, ...tokens.filter((item) => item !== token)].slice(0, TOP_NOTICE_BAR_DISMISS_LIMIT);

export const parseCachedTopNoticeBar = (raw: string | null): ITopNoticeBar | null => {
  const value = parseJson(raw) as Partial<ITopNoticeBar> | null;
  if (!value || typeof value.noticeId !== "number" || typeof value.text !== "string" || !value.text) {
    return null;
  }
  return { noticeId: value.noticeId, text: value.text };
};
