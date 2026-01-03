import { IProduct } from "@/types";
import Image from "next/image";
interface Props {
  userNickname: string;
  userEventLevelBadge?: string;
  product?: IProduct;
  hasGle?: boolean;
  textStyle?: string;
  badgeStyle?: string;
  spanStyle?: string;
}
const UserNickname = ({
  userNickname,
  userEventLevelBadge = "",
  product,
  hasGle = false,
  textStyle = "text-13pxr md:text-15pxr text-dark-gray-500",
  badgeStyle = "w-[14px] h-[16px]",
  spanStyle = "line-clamp-1",
}: Props) => {
  const eventLevelBadge = product
    ? product?.badge?.authorEventLevelBadgeImagePath ||
      product?.authorEventLevelBadgeImagePath
    : userEventLevelBadge;

  return (
    <div className="flex items-center gap-4pxr">
      <span className={`${textStyle} ${spanStyle}`}>
        {userNickname || product?.authorNickname}
      </span>
      {hasGle && (
        <span className="text-13pxr md:text-15pxr text-dark-gray-300">글</span>
      )}
      {eventLevelBadge && (
        <Image
          src={eventLevelBadge}
          alt="작가 등급"
          width={14}
          height={16}
          className={`${badgeStyle}`}
        />
      )}
    </div>
  );
};
export default UserNickname;
