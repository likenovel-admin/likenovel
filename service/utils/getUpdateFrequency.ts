const DAYS_MAPPING: Record<string, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

interface UpdateFrequencyOptions {
  publishRegularYn?: string;
  ongoingState?: string;
}

export const getUpdateFrequency = (
  jsonString: string,
  options?: UpdateFrequencyOptions
): string => {
  // 완결 우선 (연재 상태가 "end")
  if (options?.ongoingState === "end") {
    return "완결";
  }
  // 비정기 연재
  if (options?.publishRegularYn === "N") {
    return "비정기 연재";
  }
  try {
    const dayData = JSON.parse(jsonString);
    const activeDays = Object.keys(dayData)
      .filter((key) => dayData[key] === "Y")
      .map((key) => DAYS_MAPPING[key])
      .filter(Boolean);

    if (activeDays.length === 7) {
      return "매일 연재";
    }

    if (activeDays.length === 0) {
      return "";
    }

    return activeDays.join(", ") + " 연재";
  } catch (error) {
    return "";
  }
};
