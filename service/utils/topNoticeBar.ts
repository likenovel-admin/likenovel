export const TOP_NOTICE_BAR_HEIGHT_PX = 36;
export const TOP_NOTICE_BAR_CSS_VAR = "--top-notice-bar-h";
export const TOP_NOTICE_BAR_DISMISS_STORAGE_KEY = "likenovel:top-notice-bar:dismissed";

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
