export const NOTICE_TOP_BAR_TEXT_MAX_LENGTH = 80;
export const NOTICE_TOP_BAR_LINK_MAX_LENGTH = 500;
const NOTICE_TOP_BAR_LINK_FORMAT_MESSAGE =
  "상단 띠 링크는 /로 시작하는 사이트 주소나 https:// 주소만 넣을 수 있습니다.";

export interface NoticeTopBarState {
  enabled: boolean;
  text: string;
  startAt: string; // datetime-local value (YYYY-MM-DDTHH:mm[:ss], KST)
  endAt: string;
  linkUrl: string; // 비우면 이 공지 상세로 이동
}

export interface NoticeTopBarRequest {
  top_bar_yn: "Y" | "N";
  top_bar_text?: string;
  top_bar_start_date?: string | null;
  top_bar_end_date?: string | null;
  top_bar_link_url?: string | null;
}

export const EMPTY_NOTICE_TOP_BAR: NoticeTopBarState = {
  enabled: false,
  text: "",
  startAt: "",
  endAt: "",
  linkUrl: "",
};

// 초까지 유지한다. 잘라내면 재저장만으로 시작 시각이 당겨져 겹치는 띠의 노출 순서가 바뀐다.
const toDateTimeLocal = (value?: string | null) =>
  value ? value.replace(" ", "T").slice(0, 19) : "";

// datetime-local 값은 초가 0이면 "HH:mm", 아니면 "HH:mm:ss"로 온다. 비교 전에 초를 맞춘다.
const withSeconds = (value: string) => (value.length === 16 ? `${value}:00` : value);

const toServerDateTime = (value: string) =>
  value ? value.replace("T", " ") : null;

export const noticeTopBarFromDetail = (detail?: {
  top_bar_yn?: string | null;
  top_bar_text?: string | null;
  top_bar_start_date?: string | null;
  top_bar_end_date?: string | null;
  top_bar_link_url?: string | null;
} | null): NoticeTopBarState => ({
  enabled: detail?.top_bar_yn === "Y",
  text: detail?.top_bar_text ?? "",
  startAt: toDateTimeLocal(detail?.top_bar_start_date),
  endAt: toDateTimeLocal(detail?.top_bar_end_date),
  linkUrl: detail?.top_bar_link_url ?? "",
});

// 백엔드와 같은 규칙: 비우면 공지 상세, /로 시작하는 사이트 주소나 https:// 주소만 받는다.
export const validateNoticeTopBarLink = (value: string): string | null => {
  const link = value.trim();
  if (!link) return null;
  if (link.length > NOTICE_TOP_BAR_LINK_MAX_LENGTH) {
    return `상단 띠 링크는 ${NOTICE_TOP_BAR_LINK_MAX_LENGTH}자 이내로 입력해주세요.`;
  }
  if (/[\s\\\u0000-\u001f\u007f]/.test(link)) return NOTICE_TOP_BAR_LINK_FORMAT_MESSAGE;
  if (link.startsWith("/") && !link.startsWith("//")) return null;
  if (/^https:\/\/[^/?#]+/i.test(link)) return null;
  return NOTICE_TOP_BAR_LINK_FORMAT_MESSAGE;
};

export const validateNoticeTopBar = (state: NoticeTopBarState): string | null => {
  if (!state.enabled) return null;
  const text = state.text.trim();
  if (!text) return "상단 띠 문구를 입력해주세요.";
  if (text.length > NOTICE_TOP_BAR_TEXT_MAX_LENGTH) {
    return `상단 띠 문구는 ${NOTICE_TOP_BAR_TEXT_MAX_LENGTH}자 이내로 입력해주세요.`;
  }
  const linkError = validateNoticeTopBarLink(state.linkUrl);
  if (linkError) return linkError;
  if (state.startAt && state.endAt && withSeconds(state.endAt) <= withSeconds(state.startAt)) {
    return "상단 띠 종료 시각은 시작 시각보다 뒤여야 합니다.";
  }
  return null;
};

export const buildNoticeTopBarRequest = (
  state: NoticeTopBarState
): NoticeTopBarRequest =>
  state.enabled
    ? {
        top_bar_yn: "Y",
        top_bar_text: state.text.trim(),
        top_bar_start_date: toServerDateTime(state.startAt),
        top_bar_end_date: toServerDateTime(state.endAt),
        top_bar_link_url: state.linkUrl.trim() || null,
      }
    : { top_bar_yn: "N" };

const shortDateTime = (value?: string | null) =>
  value ? value.replace("T", " ").slice(5, 16) : "";

export const describeNoticeTopBarPeriod = (notice: {
  top_bar_start_date?: string | null;
  top_bar_end_date?: string | null;
}) => {
  const start = shortDateTime(notice.top_bar_start_date);
  const end = shortDateTime(notice.top_bar_end_date);
  return `${start || "즉시"} ~ ${end || "계속"}`;
};

export type NoticeTopBarStatus = "노출 중" | "대기" | "예약" | "종료";

// 띠 시각은 KST로 저장된다. "YYYY-MM-DD HH:mm[:ss]"와 "T" 구분 형식을 모두 받는다.
const parseKstDateTime = (value?: string | null): number | null => {
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?/.exec(value ?? "");
  if (!match) return null;
  const time = Date.parse(`${match[1]}T${match[2]}${match[3] ?? ":00"}+09:00`);
  return Number.isNaN(time) ? null : time;
};

// liveNoticeId는 공개 API가 지금 내려주는 띠의 공지 ID다(없으면 null, 조회 전·실패면 undefined).
// 사이트에는 1개만 뜨므로 그 공지만 "노출 중"이고, 기간 안인데 밀린 띠는 "대기"다.
// 목록을 열어 둔 사이 종료 시각이 지나면 먼저 받은 liveNoticeId보다 종료가 우선이다.
export const resolveNoticeTopBarStatus = (
  notice: {
    id: number;
    use_yn?: string | null;
    top_bar_yn?: string | null;
    top_bar_start_date?: string | null;
    top_bar_end_date?: string | null;
  },
  liveNoticeId: number | null | undefined,
  now: number
): NoticeTopBarStatus | null => {
  // 공개 API는 숨긴 공지(use_yn=N)의 띠를 내보내지 않는다.
  if (notice.top_bar_yn !== "Y" || notice.use_yn === "N") return null;
  const end = parseKstDateTime(notice.top_bar_end_date);
  if (end !== null && end <= now) return "종료";
  if (liveNoticeId !== undefined && liveNoticeId === notice.id) return "노출 중";
  const start = parseKstDateTime(notice.top_bar_start_date);
  if (start !== null && start > now) return "예약";
  // 다른 공지가 실제로 떠 있을 때만 "대기"로 본다. 그 밖의 경우는 기간만 보여준다.
  return typeof liveNoticeId === "number" ? "대기" : null;
};
