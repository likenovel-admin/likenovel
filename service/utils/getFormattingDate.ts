import dayjs from "dayjs";
export const getFormattingDate = (date: string, type: string) => {
  const targetDate = dayjs(date);
  return targetDate.format(type);
};
