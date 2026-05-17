import { IProduct } from "@/types";

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
  product,
  textStyle = "text-13pxr md:text-15pxr text-dark-gray-500",
  spanStyle = "truncate",
}: Props) => {
  return (
    <div className="inline-flex items-center gap-4pxr min-w-0 max-w-full">
      <span className={`${textStyle} ${spanStyle} min-w-0 max-w-full`}>
        {userNickname || product?.authorNickname}
      </span>
    </div>
  );
};

export default UserNickname;
