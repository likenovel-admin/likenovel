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
  //관심 만료일(interestEndDate)까지 남은 시간(양수 = 아직 유효)
  const diffInHours = dayjs(
    product?.badge?.interestEndDate || dayjs()
  ).diff(dayjs(), "hours");

  //만료일이 아직 미래(diffInHours > 0)이면 활성 불꽃, 아니라면 사그라진 불꽃
  const interestFireImagePath =
    isInterestFireImage && diffInHours > 0
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
