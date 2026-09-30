export const NOTICE_TOP_BAR_TEXT_MAX_LENGTH = 80;

export interface NoticeTopBarState {
  enabled: boolean;
  text: string;
  startAt: string; // datetime-local value (YYYY-MM-DDTHH:mm, KST)
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

const toDateTimeLocal = (value?: string | null) =>
  value ? value.replace(" ", "T").slice(0, 16) : "";

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
  if (state.startAt && state.endAt && state.endAt <= state.startAt) {
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
  if (!start && !end) return "노출";
  return `${start || "즉시"} ~ ${end || "계속"}`;
};
