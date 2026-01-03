export default function getNumberToString(num: number): string {
  if (num < 100) {
    return num.toString();
  }

  const units = ["", "만", "억", "조"];
  let result = "";
  let unitIndex = 0;

  while (num >= 10000 && unitIndex < units.length - 1) {
    num = Math.floor(num / 10000);
    unitIndex++;
  }

  if (num >= 100 && num < 1000) {
    result = `${Math.floor(num / 100)}백`;
  } else if (num >= 1000 && num < 10000) {
    result = `${Math.floor(num / 1000)}천`;
  } else {
    result = `${num}${units[unitIndex]}`;
  }

  return result;
}
