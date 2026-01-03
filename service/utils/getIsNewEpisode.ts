import dayjs from "dayjs";
export const getIsNewEpisode = (date: string) => {
  const now = dayjs();
  const targetDate = dayjs(date);
  const differenceInHours = now.diff(targetDate, "hour");
  return differenceInHours <= 72;
};
