import { ADULT_19_ICON_IMAGE } from "@/constants/common";
import { IProduct } from "@/types";
import { getUser } from "@/utils/getUser";
import Image from "next/image";

interface Props {
  product: Pick<IProduct, "adultYn">;
  className?: string;
  forceVisible?: boolean;
}

const AdultAgeBadge = ({
  product,
  className = "",
  forceVisible = false,
}: Props) => {
  const user = getUser();

  if (product.adultYn !== "Y" || (!forceVisible && !user?.isOnAdult)) {
    return null;
  }

  return (
    <Image
      src={ADULT_19_ICON_IMAGE}
      alt="19세"
      width={24}
      height={24}
      className={`pointer-events-none absolute top-[5px] right-[5px] z-10 w-[24px] h-[24px] ${className}`}
    />
  );
};

export default AdultAgeBadge;
