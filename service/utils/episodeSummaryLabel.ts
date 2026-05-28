type ProductPriceType = "free" | "paid" | null | undefined;

interface BuildEpisodeSummaryLabelParams {
  totalEpisodeCount: number | null | undefined;
  productPriceType: ProductPriceType;
  paidEpisodeNo: number | null | undefined;
}

const normalizeCount = (value: number | null | undefined) =>
  Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 0;

export const buildEpisodeSummaryLabel = ({
  totalEpisodeCount,
  productPriceType,
  paidEpisodeNo,
}: BuildEpisodeSummaryLabelParams) => {
  const totalCount = normalizeCount(totalEpisodeCount);
  const baseLabel = `총 ${totalCount}화`;
  const paidStartEpisodeNo = normalizeCount(paidEpisodeNo);

  if (productPriceType !== "paid" || paidStartEpisodeNo <= 0) {
    return baseLabel;
  }

  if (paidStartEpisodeNo <= 1) {
    return `${baseLabel} (전 회차 유료)`;
  }

  if (paidStartEpisodeNo > totalCount) {
    return baseLabel;
  }

  return `${baseLabel} (1~${paidStartEpisodeNo - 1}화 무료 · 이후 유료)`;
};
