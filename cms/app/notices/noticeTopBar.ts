export const NOTICE_TOP_BAR_TEXT_MAX_LENGTH = 80;

export interface NoticeTopBarState {
  enabled: boolean;
  text: string;
  startAt: string; // datetime-local value (YYYY-MM-DDTHH:mm[:ss], KST)
  endAt: string;
}

export interface NoticeTopBarRequest {
  top_bar_yn: "Y" | "N";
  top_bar_text?: string;
  top_bar_start_date?: string | null;
  top_bar_end_date?: string | null;
}

export const EMPTY_NOTICE_TOP_BAR: NoticeTopBarState = {
  enabled: false,
  text: "",
  startAt: "",
  endAt: "",
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
} | null): NoticeTopBarState => ({
  enabled: detail?.top_bar_yn === "Y",
  text: detail?.top_bar_text ?? "",
  startAt: toDateTimeLocal(detail?.top_bar_start_date),
  endAt: toDateTimeLocal(detail?.top_bar_end_date),
});

export const validateNoticeTopBar = (state: NoticeTopBarState): string | null => {
  if (!state.enabled) return null;
  const text = state.text.trim();
  if (!text) return "상단 띠 문구를 입력해주세요.";
  if (text.length > NOTICE_TOP_BAR_TEXT_MAX_LENGTH) {
    return `상단 띠 문구는 ${NOTICE_TOP_BAR_TEXT_MAX_LENGTH}자 이내로 입력해주세요.`;
  }
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
export const resolveNoticeTopBarStatus = (
  notice: {
    id: number;
    top_bar_yn?: string | null;
    top_bar_start_date?: string | null;
    top_bar_end_date?: string | null;
  },
  liveNoticeId: number | null | undefined,
  now: number
): NoticeTopBarStatus | null => {
  if (notice.top_bar_yn !== "Y") return null;
  if (liveNoticeId !== undefined && liveNoticeId === notice.id) return "노출 중";
  const end = parseKstDateTime(notice.top_bar_end_date);
  if (end !== null && end <= now) return "종료";
  const start = parseKstDateTime(notice.top_bar_start_date);
  if (start !== null && start > now) return "예약";
  // 다른 공지가 실제로 떠 있을 때만 "대기"로 본다. 그 밖의 경우는 기간만 보여준다.
  return typeof liveNoticeId === "number" ? "대기" : null;
};
