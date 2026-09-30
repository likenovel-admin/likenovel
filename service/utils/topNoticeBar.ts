export const TOP_NOTICE_BAR_HEIGHT_PX = 36;
export const TOP_NOTICE_BAR_CSS_VAR = "--top-notice-bar-h";
export const TOP_NOTICE_BAR_DISMISS_STORAGE_KEY = "likenovel:top-notice-bar:dismissed-list";
export const TOP_NOTICE_BAR_CACHE_STORAGE_KEY = "likenovel:top-notice-bar:last";
export const TOP_NOTICE_BAR_DISMISS_LIMIT = 20;
// 예약 시작/종료가 열린 화면에도 반영되도록 주기적으로 다시 조회한다.
export const TOP_NOTICE_BAR_REFRESH_MS = 5 * 60 * 1000;
// 지난번 띠는 이 시간 안에 저장된 것만 먼저 보여준다. 해제된 띠가 오래 남지 않게 짧게 둔다.
export const TOP_NOTICE_BAR_CACHE_MAX_AGE_MS = 30 * 60 * 1000;

export interface ITopNoticeBar {
  noticeId: number;
  text: string;
  endAt?: string | null; // KST "YYYY-MM-DD HH:mm:ss", 없으면 종료 없음
}

interface ICachedTopNoticeBar {
  bar: ITopNoticeBar;
  savedAt: number;
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

// KST 시각 문자열을 epoch ms로 바꾼다. 형식이 다르면 null.
export const parseKstDateTime = (value?: string | null): number | null => {
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?$/.exec(value ?? "");
  if (!match) return null;
  const time = Date.parse(`${match[1]}T${match[2]}${match[3] ?? ":00"}+09:00`);
  return Number.isNaN(time) ? null : time;
};

export const isTopNoticeBarExpired = (bar: ITopNoticeBar, now: number) => {
  if (!bar.endAt) return false;
  const end = parseKstDateTime(bar.endAt);
  return end === null || end <= now;
};

export const serializeCachedTopNoticeBar = (bar: ITopNoticeBar, now: number) =>
  JSON.stringify({ bar, savedAt: now } satisfies ICachedTopNoticeBar);

// 최근에 저장됐고 아직 끝나지 않은 띠만 캐시에서 쓴다.
export const parseCachedTopNoticeBar = (
  raw: string | null,
  now: number
): ITopNoticeBar | null => {
  const value = parseJson(raw) as Partial<ICachedTopNoticeBar> | null;
  const bar = value?.bar;
  if (
    !bar
    || typeof bar.noticeId !== "number"
    || typeof bar.text !== "string"
    || !bar.text
    || typeof value?.savedAt !== "number"
    || now < value.savedAt
    || now - value.savedAt > TOP_NOTICE_BAR_CACHE_MAX_AGE_MS
  ) {
    return null;
  }
  const cached: ITopNoticeBar = {
    noticeId: bar.noticeId,
    text: bar.text,
    endAt: typeof bar.endAt === "string" ? bar.endAt : null,
  };
  return isTopNoticeBarExpired(cached, now) ? null : cached;
};

// 조회가 실패하면 띠를 숨기고, 응답이 오기 전에는 유효한 캐시를 쓴다.
export const resolveTopNoticeBar = ({
  data,
  isError,
  cachedBar,
  now,
}: {
  data?: { data: ITopNoticeBar | null } | null;
  isError: boolean;
  cachedBar: ITopNoticeBar | null;
  now: number;
}): ITopNoticeBar | null => {
  if (isError) return null;
  const bar = data ? data.data : cachedBar;
  return bar && !isTopNoticeBarExpired(bar, now) ? bar : null;
};
