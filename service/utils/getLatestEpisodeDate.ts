import { IProduct } from "@/types";
import dayjs from "dayjs";

export const getLatestEpisodeDate = (date: string) => {
  if (!date) return "";
  const now = dayjs();
  const targetDate = dayjs(date);
  const diffInMinutes = now.diff(targetDate, "minute");
  const diffInHours = now.diff(targetDate, "hour");
  const diffInDays = now.diff(targetDate, "day");

  if (diffInDays === 0) {
    if (diffInHours >= 1) {
      return `${diffInHours}시간 전`;
    }
    if (diffInMinutes >= 1) {
      return `${diffInMinutes}분 전`;
    }
    return "방금 전";
  } else if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  } else {
    return `${targetDate.format("YY.MM.DD")}`;
  }
};

export const getInterestEndDate = (
  date: string,
  interestStatus: IProduct["interestStatus"]
) => {
  if (!date) return { text: "", hasRedText: false };
  const now = dayjs();
  const targetDate = dayjs(date);
  if (interestStatus === "no_interest")
    return {
      text: `종료일 ${targetDate.format("YY.MM.DD")}`,
      hasRedText: false,
    };
  const diffInDays = Math.abs(now.diff(targetDate, "day"));

  if (diffInDays === 0) {
    return { text: "", hasRedText: false };
  } else if (diffInDays < 30) {
    return {
      text: `관심 종료 D-${diffInDays}`,
      hasRedText: true,
      redPart: `D-${diffInDays}`,
    };
  } else {
    return {
      text: `종료일 ${targetDate.format("YY.MM.DD")}`,
      hasRedText: false,
    };
  }
};

export const getDiffEndDate = (date: string) => {
  if (!date) return 0;
  const now = dayjs();
  const targetDate = dayjs(date);
  const diffInDays = Math.abs(now.diff(targetDate, "day"));

  return diffInDays;
};

export const isEndDateExpired = (date: string): boolean => {
  if (!date) return false;
  const now = dayjs();
  const targetDate = dayjs(date);
  return now.isAfter(targetDate);
};
