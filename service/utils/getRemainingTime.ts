import dayjs from "dayjs";
export const getRemainingTime = (date: string) => {
  const now = dayjs();
  const endDate = dayjs(date);

  const remainingTime = endDate.diff(now);

  if (remainingTime < 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  const days = endDate.diff(now, "day");
  const hours = endDate.diff(now, "hour") % 24;
  const minutes = endDate.diff(now, "minute") % 60;

  return {
    days,
    hours,
    minutes,
  };
};
