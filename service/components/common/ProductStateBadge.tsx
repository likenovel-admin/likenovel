import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import SquareBadge from "./SquareBadge";

interface Props {
  product: IProduct;
  hasFreeOrPaidBadge?: boolean;
  hasUpBadge?: boolean;
}

const ProductStateBadge = ({
  product,
  hasFreeOrPaidBadge = false,
  hasUpBadge = true,
}: Props) => {
  const badges: JSX.Element[] = [];

  if (hasFreeOrPaidBadge) {
    const freeOrPaidBadge = product.priceType ? (
      product.priceType === "free" ? (
        <SquareBadge key="free" type="free" size="small" />
      ) : (
        <SquareBadge key="paid" type="paid" size="small" />
      )
    ) : null;
    freeOrPaidBadge && badges.push(freeOrPaidBadge);
  }

  const ongoingStateBadge = (() => {
    if (product.state?.ongoingState === "end")
      return <SquareBadge key="end" type="end" />;
    if (product.state?.ongoingState === "rest")
      return <SquareBadge key="rest" type="rest" />;
    if (product.state?.ongoingState === "stop")
      return <SquareBadge key="stop" type="stop" />;
  })();
  if (ongoingStateBadge) badges.push(ongoingStateBadge);

  if (product.contract?.monopolyYn === "Y")
    badges.push(<SquareBadge key="only" type="only" />);
  if (product.contract?.cpContractYn === "Y" && product.priceType === "paid")
    badges.push(<SquareBadge key="CPContract" type="CPContract" />);
  if (product.badge?.newReleaseYn === "Y")
    badges.push(<SquareBadge key="new" type="new" />);

  if (
    (hasUpBadge && product.properties?.latestEpisodeDate) ||
    (product.latestEpisodeDate &&
      getIsNewEpisode(
        product.properties?.latestEpisodeDate || product.latestEpisodeDate
      ))
  ) {
    badges.push(<SquareBadge key="up" type="up" />);
  }

  if (badges.length === 0) return null;

  return <div className="flex gap-2pxr">{badges}</div>;
};

export default ProductStateBadge;
