import {
  useChangeBookmark,
  useSelectBookmarks,
} from "@/app/api/query/bookmark";
import { useDeleteRecentProduct } from "@/app/api/query/product";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { IProduct } from "@/types";
import {
  getInterestEndDate,
  getLatestEpisodeDate,
  isEndDateExpired,
} from "@/utils/getLatestEpisodeDate";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "../common/Button";
import ProductStateBadge from "../common/ProductStateBadge";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";
import WarningModal from "../modal/WarningModal";
import Paper from "/public/images/paper.svg";
import Trash from "/public/images/trash.svg";

export interface ILastViewedProduct extends IProduct {
  episodeId?: number;
  episodeCount?: number;
  lastViewedEpisodeNo?: number;
}

interface Props {
  pageType: "preference" | "interestDrop" | "lastViewed";
  data: ILastViewedProduct;
  hasGle?: boolean;
}

const getEntrySourceByPageType = (pageType: Props["pageType"]) => {
  switch (pageType) {
    case "preference":
      return PRODUCT_DETAIL_ENTRY_SOURCE.PREFERENCE_BOOKMARK;
    case "interestDrop":
      return PRODUCT_DETAIL_ENTRY_SOURCE.PREFERENCE_INTEREST_DROP;
    case "lastViewed":
      return PRODUCT_DETAIL_ENTRY_SOURCE.PREFERENCE_LAST_VIEWED;
    default:
      return undefined;
  }
};

const ProductListCard = ({ pageType, data, hasGle = true }: Props) => {
  const router = useRouter();
  const { setModal } = useModalStore();
  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();
  const queryClient = useQueryClient();
  const { mutateAsync: changeBookmark } = useChangeBookmark();
  const { data: selectBookmarks, refetch } = useSelectBookmarks();
  const { mutateAsync: deleteRecentProduct, isPending: isDeletingOne } =
    useDeleteRecentProduct();

  // 작품 제목의 마지막 글자 받침 유무 및 숫자/기호 체크 함수
  const getProperParticle = (title: string) => {
    const lastChar = title.charAt(title.length - 1) || "";
    const code = lastChar.length && lastChar.charCodeAt(0);
    const hasFinalConsonant = (code - 0xac00) % 28 !== 0;
    return hasFinalConsonant ? "을" : "를";
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const handleConfirm = async () => {
      if (pageType === "preference") {
        try {
          await changeBookmark(data.productId, {
            onSuccess: () => {
              setToast({
                message: "해당작품은 리스트에서 제거되었습니다.",
                type: "success",
              });
            },
          });
          refetch();
        } catch (error) {
          setToast({
            message: "선호작 삭제에 실패했습니다.",
            type: "error",
          });
        }
      } else if (pageType === "lastViewed") {
        // Old logic: Use localStorage only
        // const existingProducts = JSON.parse(
        //   localStorage.getItem("recent_viewed_products") || "[]"
        // );
        // const updatedProducts = existingProducts.filter(
        //   (item: { productId: number }) => item.productId !== data.productId
        // );
        // localStorage.setItem(
        //   "recent_viewed_products",
        //   JSON.stringify(updatedProducts)
        // );
        // setToast({
        //   message: "해당작품은 리스트에서 제거되었습니다.",
        //   type: "success",
        // });
        // window.location.reload();

        // New logic: Use API and invalidate query
        if (isDeletingOne) return; // Prevent multiple clicks using React Query state
        try {
          await deleteRecentProduct(data.productId);
          queryClient.invalidateQueries({ queryKey: ["getRecentProduct"] });
          setToast({
            message: "해당작품은 리스트에서 제거되었습니다.",
            type: "success",
          });
        } catch (error) {
          setToast({
            message: "삭제에 실패했습니다.",
            type: "error",
          });
        }
      }
    };

    setModal(
      <WarningModal
        content={
          <span className="text-15pxr md:text-18pxr font-bold text-center">
            {data.title.length > 20 ? (
              <>
                {data.title.substring(0, 20)} <br />
                {data.title.substring(20)}
                {getProperParticle(data.title)} <br />
                {pageType === "preference" ? "선호작" : "최근 본 작품"}에서 삭제
                하시겠습니까?
              </>
            ) : (
              <>
                {data.title}
                {getProperParticle(data.title)} <br />
                {pageType === "preference" ? "선호작" : "최근 본 작품"}에서 삭제
                하시겠습니까?
              </>
            )}
          </span>
        }
        onConfirm={handleConfirm}
      />
    );
  };

  const renderButtonContent = () => {
    if (
      pageType === "preference" ||
      pageType === "lastViewed" ||
      (pageType === "interestDrop" && data.interestStatus === "no_interest")
    ) {
      if (
        (data.badge?.interestEndDate || data?.interestEndDate) &&
        isEndDateExpired(
          data.badge?.interestEndDate || data?.interestEndDate || ""
        )
      ) {
        return (
          <div className="flex justify-center items-center">
            <Image
              src="/images/fire-off.png"
              alt="관심 끊김"
              width={13}
              height={13}
              className="w-[10px] h-[11px] md:w-[13px] md:h-[13px]"
            />
            <span className="text-dark-gray-500 text-12pxr md:text-14pxr ml-5pxr">
              관심 끊김
            </span>
          </div>
        );
      } else {
        if (data.lastViewedEpisodeNo ?? 0 > 0) {
          return (
            <div className="flex items-center">
              <Paper className="w-[10px] md:w-[13px]" />
              <span className="text-primary-100 text-12pxr md:text-14pxr font-semibold ml-5pxr">
                {data.lastViewedEpisodeNo ?? 0 + 1}화
              </span>
              <span className="text-dark-gray-500 text-12pxr md:text-14pxr">
                &nbsp;이어보기
              </span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center">
              <span className="text-primary-100 text-12pxr md:text-14pxr font-semibold">
                첫화 보기
              </span>
            </div>
          );
        }
      }
    }
    if (
      pageType === "interestDrop" &&
      data.interestStatus === "interest_ending_soon"
    ) {
      if (data.lastViewedEpisodeNo ?? 0 > 0) {
        return (
          <div className="flex items-center">
            <Paper className="w-[10px] md:w-[13px]" />
            <span className="text-primary-100 text-12pxr md:text-14pxr font-semibold ml-5pxr">
              {data.lastViewedEpisodeNo ?? 0 + 1}화
            </span>
            <span className="text-dark-gray-500 text-12pxr md:text-14pxr">
              &nbsp;이어보기
            </span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center">
            <span className="text-primary-100 text-12pxr md:text-14pxr font-semibold">
              첫화 보기
            </span>
          </div>
        );
      }
    }
    if (data.badge?.interestEndDate) {
      return (
        <div className="flex justify-center items-center">
          <Image
            src="/images/fire-off.png"
            alt="관심 끊김"
            width={13}
            height={13}
            className="w-[10px] h-[11px] md:w-[13px] md:h-[13px]"
          />
          <span className="text-dark-gray-500 text-12pxr md:text-14pxr ml-5pxr">
            관심 끊김
          </span>
        </div>
      );
    } else {
      if (data.latestEpisodeNo ?? 0 > 0) {
        return (
          <div className="flex items-center">
            <Paper className="w-[10px] md:w-[13px]" />
            <span className="text-primary-100 text-12pxr md:text-14pxr font-semibold ml-5pxr">
              {data.latestEpisodeNo ?? 0 + 1}화
            </span>
            <span className="text-dark-gray-500 text-12pxr md:text-14pxr">
              &nbsp;이어보기
            </span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center">
            <span className="text-primary-100 text-12pxr md:text-14pxr font-semibold">
              첫화 보기
            </span>
          </div>
        );
      }
    }
  };

  const renderInterestEndDate = () => {
    return (
      <>
        {data.badge?.interestEndDate && pageType === "interestDrop"
          ? (() => {
              const endDateInfo = getInterestEndDate(
                data.badge?.interestEndDate,
                data?.interestStatus
              );
              if (!endDateInfo.text) return null;

              if (endDateInfo.hasRedText && endDateInfo.redPart) {
                const beforeRed = endDateInfo.text
                  .replace(endDateInfo.redPart, "")
                  .trim();
                return (
                  <span className="text-12pxr md:14pxr text-[#6B6E76] flex flex-wrap gap-5pxr md:gap-10pxr items-center">
                    <span className="hidden md:block h-[10px] w-[1px] bg-[#DEDFE5]"></span>
                    {beforeRed}
                    <span className="text-[#FF2703]">
                      {endDateInfo.redPart}
                    </span>
                    <span className="block md:hidden h-[10px] w-[1px] bg-[#DEDFE5]"></span>
                  </span>
                );
              }

              return (
                <span className="text-12pxr md:14pxr text-dark-gray-500 flex flex-wrap gap-5pxr md:gap-10pxr items-center">
                  <span className="hidden md:block h-[10px] w-[1px] bg-[#DEDFE5]"></span>{" "}
                  {endDateInfo.text}
                  <span className="block md:hidden h-[10px] w-[1px] bg-[#DEDFE5]"></span>{" "}
                </span>
              );
            })()
          : null}
      </>
    );
  };

  const handleButtonClick = () => {
    const entrySource = getEntrySourceByPageType(pageType);
    if (entrySource) {
      setPendingProductDetailEntrySource(data.productId, entrySource);
    }
    const detailPath = buildProductDetailPath(data.productId);

    // 관심 끊김 작품인 경우
    if (data.badge?.interestEndDate) {
      return router.push(detailPath);
      // 회차 이동인 경우
    } else {
      // data.episodeCount !== 0 && data.episodeId !== undefined
      //   ? router.push(`/viewer/${data.episodeId}`)
      //   : setConfirm({
      //       content: "열람 가능한 회차가 없거나 작품 열람이 닫혔습니다.",
      //       buttonCount: 1,
      //     });
      router.push(detailPath);
    }
  };

  return (
    <div className="relative flex items-center justify-between h-[130px]">
      <div
        className="relative flex gap-10pxr md:gap-24pxr cursor-pointer"
        onClick={() => {
          const entrySource = getEntrySourceByPageType(pageType);
          if (entrySource) {
            setPendingProductDetailEntrySource(data.productId, entrySource);
          }
          router.push(buildProductDetailPath(data.productId));
        }}
      >
        {(data?.image && data?.image?.coverImagePath) ||
        data?.coverImagePath ? (
          <Image
            src={
              data?.image?.coverImagePath ||
              data?.coverImagePath ||
              "https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
            }
            alt={data.title}
            width={90}
            height={130}
            className={`object-cover min-w-[90px] h-[130px] rounded-[10px]`}
          />
        ) : (
          <Image
            src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
            alt={data.title}
            width={90}
            height={130}
            className={`object-cover min-w-[90px] h-[130px] rounded-[10px]`}
          />
        )}

        {data.priceType === "paid" && (
          <div className="absolute flex gap-[2px] top-[5px] left-[5px]">
            <SquareBadge
              type={getPromotionBadgeType(
                data.badge?.waitForFreeYn || data.badge?.waitingForFreeYn,
                data.badge?.freeEpisodeTicketCount,
                data.badge?.timepassFromTo,
                data.badge?.sixNinePathYn
              )}
              freeEpisodeNumber={data.badge?.freeEpisodeTicketCount}
              timePassValue={data.badge?.timepassFromTo}
            />
          </div>
        )}
        <div className="flex flex-col gap-3pxr justify-center max-w-[170px] md:max-w-[330px]">
          <div className="md:hidden">
            <ProductStateBadge product={data} hasFreeOrPaidBadge hasUpBadge />
          </div>
          <div className="flex items-center gap-7pxr">
            <span className="text-14pxr md:text-17pxr font-semibold line-clamp-2">
              {data.title}
            </span>
            <div className="hidden md:block">
              <ProductStateBadge product={data} hasFreeOrPaidBadge hasUpBadge />
            </div>
          </div>
          <div className="flex flex-wrap gap-5pxr md:gap-12pxr items-center">
            <UserNickname
              product={data}
              userNickname={data?.authorNickname || data.authorName || ""}
              hasGle={hasGle}
            />
            <span className="md:hidden text-11pxr text-dark-gray-500 flex items-center gap-5pxr">
              <span className="h-[10px] w-[1px] bg-[#DEDFE5]"></span>
              {getLatestEpisodeDate(
                data.properties?.latestEpisodeDate ||
                  data?.latestEpisodeDate ||
                  ""
              )}
            </span>
            {data?.illustratorNickname ? (
              <>
                <span className="hidden md:block h-[10px] w-[1px] bg-[#DEDFE5]"></span>
                <span className="hidden md:block">
                  {" "}
                  {data?.illustratorNickname} 그림
                </span>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-5pxr md:gap-10pxr items-center">
            <span className="hidden md:block text-14pxr text-dark-gray-500">
              {getLatestEpisodeDate(
                data.properties?.latestEpisodeDate ||
                  data?.latestEpisodeDate ||
                  ""
              )}
            </span>
            {renderInterestEndDate()}
            <div className="md:hidden flex">
              <span className="text-12pxr text-dark-gray-500 font-semibold">
                {(data.trendindex?.readedEpisodeCount ||
                  data?.readedEpisodeCount) ??
                  1}
              </span>
              <span className="text-12pxr text-dark-gray-200">
                {/* &nbsp;/ {data.trendindex?.hasEpisodeCount ?? 1}화 */}
                &nbsp;/ {data.totalOpenEpisodeCount ?? 1}화
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-20pxr">
        <div className="flex">
          <span className="text-13pxr text-dark-gray-500 font-semibold">
            {(data.trendindex?.readedEpisodeCount ||
              data?.readedEpisodeCount) ??
              0}
          </span>
          <span className="text-13pxr text-dark-gray-200">
            {/* &nbsp;/ {data.trendindex?.hasEpisodeCount ?? 1}화 */}
            &nbsp;/ {data.totalOpenEpisodeCount ?? 1}화
          </span>
        </div>
        <Button variant="secondary" size="lg" onClick={handleButtonClick}>
          {renderButtonContent()}
        </Button>
        {(pageType === "preference" || pageType === "lastViewed") && (
          <button
            className="flex justify-center items-center w-[42px] h-[42px] rounded-full bg-light-gray-300 hover:bg-light-gray-600"
            onClick={(e) => {
              handleOpenModal(e);
            }}
          >
            <Trash />
          </button>
        )}
      </div>
      <div className="absolute bottom-[10px] right-0">
        <button
          onClick={handleButtonClick}
          className="md:hidden border border-dark-gray-100 rounded-full px-7pxr py-3pxr"
        >
          {renderButtonContent()}
        </button>
      </div>
      {(pageType === "preference" || pageType === "lastViewed") && (
        <button
          className="md:hidden absolute top-[10px] right-0 flex justify-center items-center w-[32px] h-[32px] rounded-full bg-light-gray-300 hover:bg-light-gray-600"
          onClick={(e) => {
            handleOpenModal(e);
          }}
        >
          <Trash />
        </button>
      )}
    </div>
  );
};
export default ProductListCard;
