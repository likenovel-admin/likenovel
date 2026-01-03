import { IProduct } from "@/types";
import dayjs from "dayjs";
import Image from "next/image";
interface Props {
  product: IProduct;
  width: number;
  height: number;
  style: string;
}
// TODO: 3시간 뒤 관심 식는 로직 추가
const InterestBadge = ({ product, width, height, style }: Props) => {
  //관심 만료일(interestEndDate) 유무로 불꽃 표시 여부 판단
  const isInterestFireImage = product?.badge?.interestFireActiveImagePath;
  //관심 만료일(interestEndDate)과 현재시간과 시간차이
  const diffInHours = dayjs().diff(
    dayjs(product?.badge?.interestEndDate || dayjs()),
    "hours"
  );

  //불꽃 표시가 있고 72시간 이내라면 활성화된 불꽃, 아니라면 사그라진 불꽃으로 표시
  const interestFireImagePath =
    isInterestFireImage && 0 < diffInHours && diffInHours <= 72
      ? product?.badge?.interestFireActiveImagePath
      : product?.badge?.interestFireFadeImagePath;

  return (
    <>
      {isInterestFireImage ? (
        <Image
          src={interestFireImagePath ?? ""}
          width={width}
          height={height}
          alt="관심도"
          className={`${style} w-[${width}px] h-[${height}px]`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "";
          }}
        />
      ) : (
        ""
      )}
    </>
  );
};
export default InterestBadge;
