/**
 * Format numbers for display with Korean units
 * - Numbers up to 9,999: show with comma separators (e.g., 1,234)
 * - Numbers 10,000+: show in 만 units with one decimal place (e.g., 1.5만, 11.3만)
 */
export const formatKoreanNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return "0";

  // For numbers less than 10,000, show with comma separators
  if (num < 10000) {
    return num.toLocaleString("ko-KR");
  }

  // For numbers 10,000 and above, convert to 만 units with 1 decimal place
  const manValue = num / 10000;

  // Round to 1 decimal place
  const rounded = Math.round(manValue * 10) / 10;

  // Format: remove trailing .0 if present
  const formatted = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);

  return `${formatted}만`;
};
