import dayjs from "dayjs";
export const getIsNewEpisode = (date: string) => {
  if (!date) return false;
  const now = dayjs();
  const targetDate = dayjs(date);
  if (!targetDate.isValid()) return false;
  const differenceInHours = now.diff(targetDate, "hour");
  return differenceInHours <= 24;
};
