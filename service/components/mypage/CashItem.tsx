import Image from "next/image";

interface CachItemProps {
  active?: boolean;
  amount: number;
  discountAmount?: number;
  discountRate?: number;
  price: number;
  isPopulate?: boolean;
  isRecommend?: boolean;
}
const CashItem = ({
  active,
  amount,
  price,
  discountAmount,
  discountRate,
  isPopulate,
  isRecommend,
}: CachItemProps) => {
  return (
    <button
      className={`border rounded-xl p-4 w-full box-border flex gap-1 items-center relative ${
        active ? "border-primary-100 border-2" : ""
      }`}
    >
      <div className="absolute left-0 top-[-10px]">
        {isPopulate && (
          <Image
            src="/images/populate-label.svg"
            width={40}
            height={27}
            alt="인기"
          />
        )}
        {isRecommend && (
          <Image
            src="/images/recommend-label.svg"
            width={40}
            height={27}
            alt="추천"
          />
        )}
      </div>
      <div className="border border-black-100 text-12pxr font-bold w-[22px] h-[22px] flex rounded-full justify-center items-center">
        C
      </div>
      <div className="text-17pxr md:text-20pxr">{amount.toLocaleString()}</div>
      <div className="text-dark-gray-300 text-13pxr  md:text-14pxr flex-1 text-left line-through">
        {(discountAmount && discountAmount > 0) ? `${discountAmount}c`:""}
      </div>
      {(discountRate && discountRate > 0) ? (
        <div className="text-[#F80F7F] font-semibold text-12pxr md:text-12pxr">
          {discountRate}%
        </div>
      ):""}
      <div className="text-14pxr md:text-16pxr">{price.toLocaleString()}원</div>
    </button>
  );
};

export default CashItem;
