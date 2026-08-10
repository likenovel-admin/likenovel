export type ViewerFontFamily =
  | "고딕"
  | "명조체"
  | "마루부리"
  | "조선궁서"
  | "나눔고딕"
  | "본고딕"
  | "KoPub돋움";

export type ViewerTheme = "light" | "dark" | "green" | "blue";

export interface ViewerAppearanceSettings {
  fontFamily: ViewerFontFamily;
  theme: ViewerTheme;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  marginSize: number;
  useParagraphIndent: boolean;
}

export const VIEWER_MOBILE_PAGINATED_WIDTHS = [
  "100%",
  "95%",
  "90%",
  "85%",
  "80%",
];

export const VIEWER_DESKTOP_PAGINATED_WIDTHS = [
  "95%",
  "85%",
  "73%",
  "69%",
  "65%",
];

const FONT_SIZE_MAP = [
  "11px",
  "12.5px",
  "14px",
  "15.5px",
  "17px",
  "18.5px",
  "20px",
  "21.5px",
  "23px",
  "24.5px",
];
const LETTER_SPACING_MAP = ["0px", "1px", "2px", "3px", "4px"];
const LINE_HEIGHT_MAP = ["1.45em", "1.7em", "1.95em", "2.2em", "2.45em"];
const DESKTOP_SCROLLED_MAX_WIDTHS = [
  "1000px",
  "920px",
  "840px",
  "760px",
  "680px",
];

const FONT_FAMILY_MAP: Record<ViewerFontFamily, string> = {
  고딕: "Pretendard",
  명조체: "NanumMyeongjo",
  마루부리: "MaruBuri",
  조선궁서: "JoseonPalace",
  나눔고딕: "NanumGothic",
  본고딕: "NotoSansKR",
  KoPub돋움: "KoPubDotum",
};

const THEME_BACKGROUND_MAP: Record<ViewerTheme, string> = {
  light: "#f9f8f8",
  dark: "#292C32",
  green: "#C7D5C4",
  blue: "#C3CAD2",
};

export const resolveViewerAppearance = (
  settings: ViewerAppearanceSettings
) => ({
  fontFamily: FONT_FAMILY_MAP[settings.fontFamily],
  backgroundColor: THEME_BACKGROUND_MAP[settings.theme] || "#f9f8f8",
  textColor: settings.theme === "dark" ? "#E4E4E4" : "#111317",
  fontSize: FONT_SIZE_MAP[settings.fontSize - 1],
  letterSpacing: LETTER_SPACING_MAP[settings.letterSpacing - 1],
  lineHeight: LINE_HEIGHT_MAP[settings.lineHeight - 1],
  paragraphIndent: settings.useParagraphIndent ? "1em" : "0",
  desktopScrolledMaxWidth:
    DESKTOP_SCROLLED_MAX_WIDTHS[settings.marginSize - 1] ||
    DESKTOP_SCROLLED_MAX_WIDTHS[1],
  mobileHorizontalGap: `${Math.max(0, settings.marginSize - 1) * 40}px`,
});
