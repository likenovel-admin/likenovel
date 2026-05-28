const pad2 = (value: number) => String(value).padStart(2, "0");

export const getRankBasisDate = (now: Date) => {
  const basis = new Date(now);
  basis.setSeconds(0, 0);

  if (basis.getMinutes() < 30) {
    basis.setHours(basis.getHours() - 1);
  }

  basis.setMinutes(30);
  return basis;
};

export const formatRankBasisTime = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  return `${year}. ${month}. ${day} ${hours}:${minutes}`;
};

export const getFormattedRankBasisTime = (now: Date) =>
  formatRankBasisTime(getRankBasisDate(now));
