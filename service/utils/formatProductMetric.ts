export const formatPercentMetric = (
  value: number | null | undefined,
  fractionDigits = 1
) => {
  if (value == null) {
    return "-";
  }

  if (value === 0) {
    return "집계중";
  }

  return `${Number(value).toFixed(fractionDigits)}%`;
};
