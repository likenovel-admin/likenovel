export const defaultTrafficSignal = "tracked";
export const defaultReferrerSortBy = "last_seen_at";

export const trafficSignalOptions = [
  { value: "tracked", label: "유입 신호 있음" },
  { value: "utm", label: "UTM 있음" },
  { value: "external", label: "외부 referrer 있음" },
  { value: "unknown", label: "미분류" },
  { value: "all", label: "전체" },
];

export const referrerSortOptions = [
  { value: "last_seen_at", label: "최근 유입순" },
  { value: "visitor_count", label: "방문자순" },
  { value: "session_count", label: "세션순" },
  { value: "page_view_count", label: "PV순" },
];

const signalOnlyTrafficSignals = new Set(["tracked", "utm", "external"]);
const lowSignalReferrerGroups = new Set(["direct", "internal", "unknown"]);

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function isReferrerGroupDisabledForTrafficSignal(
  referrerGroup: string,
  trafficSignal: string
) {
  return (
    signalOnlyTrafficSignals.has(trafficSignal) &&
    lowSignalReferrerGroups.has(referrerGroup)
  );
}

export function normalizeReferrerGroupForTrafficSignal(
  referrerGroup: string,
  trafficSignal: string
) {
  if (isReferrerGroupDisabledForTrafficSignal(referrerGroup, trafficSignal)) {
    return "all";
  }
  return referrerGroup;
}

export function getReferrerGroupCompatibilityHint(trafficSignal: string) {
  if (!signalOnlyTrafficSignals.has(trafficSignal)) {
    return null;
  }
  return "직접/내부/미분류는 유입 신호 '전체' 또는 '미분류'에서 확인할 수 있습니다.";
}

export function formatReferrerDateTime(value: unknown) {
  const text = String(value || "").trim();
  if (!text) {
    return "-";
  }

  const normalized = text.replace("T", " ");
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(normalized)) {
    return normalized.slice(0, 16);
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(" ");
}
