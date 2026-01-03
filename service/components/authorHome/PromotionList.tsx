import type {
  AppliedPromotion,
  DirectPromotion as DirectPromotionType,
  IUserProductsWithPromotion,
} from "@/app/api/query/mypage/user/dto";
import DirectPromotion from "@/components/authorHome/DirectPromotion";
import RequestPromotion from "@/components/authorHome/RequestPromotion";
import MessageBubble from "@/components/common/MessageBubble";
import useBottomSheetStore from "@/store/bottomSheetStore";
import useModalStore from "@/store/modalStore";
import Image from "next/image";
import Button from "../common/Button";
import SquareBadge from "../common/SquareBadge";
import Clock from "/public/images/clock.svg";

interface PromotionListProps {
  data: IUserProductsWithPromotion[];
  sortType: string;
}

const PromotionList = ({ data, sortType }: PromotionListProps) => {
  // Sort data based on sortType
  const sortedData = [...data].sort((a, b) => {
    if (sortType === "latest") {
      // Sort by productId (assuming higher ID = more recent)
      return b.productId - a.productId;
    } else if (sortType === "alphabet") {
      // Sort by title alphabetically
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  return (
    <ul className="px-3 md:px-0border-t md:border-0 gap-10pxr flex flex-col">
      {sortedData.map((product: IUserProductsWithPromotion) => {
        // Calculate days since creation
        const daysSinceCreation = product.createdDate
          ? Math.floor(
              (new Date().getTime() - new Date(product.createdDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        // Map API data to component props format
        const promotionItem = {
          id: product.productId,
          title: product.title,
          sixNinePathYn: product.badge.sixNinePathYn === "Y",
          waitingForFreeYn: product.badge.waitingForFreeYn === "Y",
          convertToPaidState: product.state.convertToPaidState === "review",
          cpContractYn: product.contract.cpContractYn === "Y",
          salesAmount: product.contract.totalSales || 0,
          freeCouponCount: product.directPromotions.reduce(
            (total, promo) => total + promo.num_of_ticket_per_person,
            0
          ),
          viewCount: product.trendindex.hitCount || 0,
          daysBefore: daysSinceCreation,
          bookCoverImage: product.image.coverImagePath,
          period: product.directPromotions[0]?.start_date || "N/A",
          priceType: product.priceType,
        };

        return (
          <li key={product.productId}>
            <PromotionItem
              {...promotionItem}
              directPromotions={product.directPromotions}
              appliedPromotions={product.appliedPromotions}
            />
          </li>
        );
      })}
    </ul>
  );
};

interface PromotionItemProps {
  id: number;
  title: string;
  salesAmount: number;
  viewCount: number;
  daysBefore: number;
  bookCoverImage: string;
  period: string;
  freeCouponCount: number;
  directPromotions: any[];
  appliedPromotions: any[];
  sixNinePathYn: boolean;
  waitingForFreeYn: boolean;
  convertToPaidState: boolean;
  cpContractYn: boolean;
  priceType: "free" | "paid";
}

const PromotionItem = ({
  id,
  bookCoverImage,
  title,
  salesAmount,
  daysBefore,
  viewCount,
  period,
  freeCouponCount,
  directPromotions,
  appliedPromotions,
  sixNinePathYn,
  waitingForFreeYn,
  convertToPaidState,
  cpContractYn,
  priceType,
}: PromotionItemProps) => {
  return (
    <div className="md:border border-0 flex md:p-5 gap-3 md:gap-4 rounded-xl relative">
      {cpContractYn && (
        <div className="absolute top-[-10px] left-[0px] ">
          <MessageBubble className="!bg-[url('/images/message-bubble-purple.svg')]">
            CP계약
          </MessageBubble>
        </div>
      )}
      <div className="w-[66px] h-[100px] md:w-[80px] md:h-[120px] relative">
        <Image
          src={
            bookCoverImage ||
            "https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
          }
          objectFit="contain"
          fill
          className="rounded-md overflow-hidden"
          alt="책표지"
        />
      </div>
      <div className="flex flex-col gap-1 md:flex-row flex-1">
        <div className="flex flex-col gap-1 md:my-auto ">
          <div className="flex font-semibold text-14pxr md:text-17pxr">
            {title}
          </div>
          <div className="flex gap-1 items-center text-12pxr md:text-14pxr text-dark-gray-400">
            <div className="w-3 h-3 md:w-4 md:h-4 relative">
              <Image src={"/images/view.svg"} alt="조회수" fill />
            </div>
            총 조회수 : {viewCount}
          </div>
          <div className="flex gap-1 items-center text-12pxr md:text-14pxr text-dark-gray-400">
            <div className="w-3 h-3 md:w-4 md:h-4 relative">
              <Image src={"/images/won-coin.svg"} alt="코인" fill />
            </div>
            총매출 : {salesAmount?.toLocaleString()}원
          </div>
          <div className="text-12pxr md:text-14pxr text-dark-gray-400">
            {daysBefore}일전
          </div>
        </div>
        <div className="flex flex-col gap-5pxr md:min-w-[32vw] md:ml-auto md:my-auto">
          {/* <div className="text-12pxr md:text-14pxr text-dark-gray-400">
            첫방문 무료 이용권(
            <span className="text-primary-100">{freeCouponCount}장</span>)
          </div>
          <div className="text-12pxr md:text-14pxr text-dark-gray-400">
            적용기간 : {period}
          </div> */}

          {sixNinePathYn && (
            <div className="flex items-center gap-7pxr">
              <div className="flex justify-center items-center min-w-[24px] h-[18px] bg-dark-gray-600 p-[3px]">
                <span className="text-10pxr rounded-[5px] text-white font-medium">
                  6-9
                </span>
                <span className="text-14pxr font-normal text-dark-gray-500 tracking-[-2%]">
                  6-9무료
                </span>
              </div>
            </div>
          )}

          <div className="text-12pxr md:text-14pxr text-dark-gray-400 flex gap-1.5">
            {waitingForFreeYn && (
              <>
                <SquareBadge type={["waitForFree"]} /> 기다무
              </>
            )}
            {convertToPaidState && (
              <div className="flex items-center h-[20px] pr-2 gap-3pxr md:gap-6pxr bg-[#2F7FFF] rounded-full p-0.5 w-max">
                <Clock className="w-fit md:w-[17px] h-[15px] md:h-[17px] text-white" />
                <span className="text-12pxr md:text-14pxr text-white w-max">
                  심사중
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <ButtonArea
        productId={id}
        directPromotions={directPromotions}
        appliedPromotions={appliedPromotions}
        priceType={priceType}
      />
    </div>
  );
};

const ButtonArea = ({
  productId,
  directPromotions,
  appliedPromotions,
  priceType,
}: {
  productId: number;
  directPromotions: DirectPromotionType[];
  appliedPromotions: AppliedPromotion[];
  priceType: "free" | "paid";
}) => {
  const { setModal } = useModalStore();
  const { setBottomSheet } = useBottomSheetStore();
  const handleDirectPromotionModalOpen = () => {
    setModal(
      <DirectPromotion
        productId={productId}
        directPromotions={directPromotions}
      />
    );
    setBottomSheet(
      <DirectPromotion
        productId={productId}
        directPromotions={directPromotions}
      />
    );
  };
  const handlePromotionModalOpen = () => {
    setModal(
      <RequestPromotion
        appliedPromotions={appliedPromotions}
        productId={productId}
      />
    );
    setBottomSheet(
      <RequestPromotion
        appliedPromotions={appliedPromotions}
        productId={productId}
      />
    );
  };

  // Show buttons only for paid products
  if (priceType !== "paid") {
    return null;
  }

  return (
    <div className="ml-auto text-end w-fit flex flex-col gap-1 my-auto">
      <Button
        size="sm"
        className="w-70pxr box-border px-[4px] text-[11px] md:w-[100px] md:h-[38px] md:text-14pxr"
        variant="black"
        onClick={handleDirectPromotionModalOpen}
      >
        직접 프로모션
      </Button>
      <Button
        size="sm"
        className="w-70pxr box-border px-[4px] text-[11px] md:w-[100px] md:h-[38px] md:text-14pxr"
        variant="secondary"
        onClick={handlePromotionModalOpen}
      >
        신청 프로모션
      </Button>
    </div>
  );
};
export default PromotionList;
