import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import SquareBadge from "./SquareBadge";

type ProductStateBadgeSize = "small" | "large" | "header";

interface Props {
  product: IProduct;
  hasFreeOrPaidBadge?: boolean;
  hasUpBadge?: boolean;
  badgeSize?: ProductStateBadgeSize;
  gapClassName?: string;
}

const ProductStateBadge = ({
  product,
  hasFreeOrPaidBadge = false,
  hasUpBadge = true,
  badgeSize = "small",
  gapClassName = "gap-2pxr",
}: Props) => {
  const badges: JSX.Element[] = [];
  // 계약 상태 데이터는 유지하되, 유저웹에서는 계약 배지를 노출하지 않는다.
  const showCpContractBadge = false;

  if (hasFreeOrPaidBadge) {
    const freeOrPaidBadge = product.priceType ? (
      product.priceType === "free" ? (
        <SquareBadge key="free" type="free" size={badgeSize} />
      ) : (
        <SquareBadge key="paid" type="paid" size={badgeSize} />
      )
    ) : null;
    freeOrPaidBadge && badges.push(freeOrPaidBadge);
  }

  const ongoingStateBadge = (() => {
    if (product.state?.ongoingState === "end")
      return <SquareBadge key="end" type="end" size={badgeSize} />;
    if (product.state?.ongoingState === "rest")
      return <SquareBadge key="rest" type="rest" size={badgeSize} />;
    if (product.state?.ongoingState === "stop")
      return <SquareBadge key="stop" type="stop" size={badgeSize} />;
  })();
  if (ongoingStateBadge) badges.push(ongoingStateBadge);

  if (product.contract?.monopolyYn === "Y")
    badges.push(<SquareBadge key="only" type="only" size={badgeSize} />);
  if (
    showCpContractBadge &&
    product.contract?.cpContractYn === "Y" &&
    product.priceType === "paid"
  )
    badges.push(
      <SquareBadge key="CPContract" type="CPContract" size={badgeSize} />
    );
  if (product.badge?.newReleaseYn === "Y")
    badges.push(<SquareBadge key="new" type="new" size={badgeSize} />);

  if (
    hasUpBadge &&
    getIsNewEpisode(
      product.properties?.latestEpisodeDate || product.latestEpisodeDate || ""
    )
  ) {
    badges.push(<SquareBadge key="up" type="up" size={badgeSize} />);
  }

  if (badges.length === 0) return null;

  return <div className={`flex ${gapClassName}`}>{badges}</div>;
};

export default ProductStateBadge;
