import {
  useSelectUserPromotionIssuanceStatus,
  useUserDirectPromotionSave,
} from "@/app/api/query/mypage/user";
import type { DirectPromotion as DirectPromotionType } from "@/app/api/query/mypage/user/dto";
import { useSelectProductDetail } from "@/app/api/query/product";
import Button from "@/components/common/Button";
import Toggle from "@/components/form/toggle";
import useBottomSheetStore from "@/store/bottomSheetStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import MessageBubble from "../common/MessageBubble";
import SettingLevel from "../viewer/SettingLevel";
import CircleWarnYellow from "/public/images/circle-warn-yellow.svg";

interface DirectPromotionProps {
  directPromotions?: DirectPromotionType[];
  productId?: number;
}

const DirectPromotion = ({
  directPromotions = [],
  productId,
}: DirectPromotionProps) => {
  const [promotionCounts, setPromotionCounts] = useState<{
    [key: string]: number;
  }>({});
  const { closeModal: _closeModal } = useModalStore();
  const { closeBottomSheet } = useBottomSheetStore();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const saveDirectPromotionMutation = useUserDirectPromotionSave();

  // Get reader-of-prev promotion ID
  const readerOfPrevPromotion = directPromotions.find(
    (promo) => (promo as any).type === "reader-of-prev"
  );

  // Fetch issuance status for reader-of-prev promotion
  const { data: issuanceStatus } = useSelectUserPromotionIssuanceStatus(
    readerOfPrevPromotion?.id || 0
  );

  // Fetch product details to get public episode count
  const { data: productDetail } = useSelectProductDetail(productId || 0);

  // Calculate number of public episodes
  const publicEpisodeCount =
    productDetail?.data?.episodes?.filter((episode) => {
      // Check if episode is public (openYn === "Y" or episodeOpenYn === "Y")
      const isOpen = episode.episodeOpenYn === "Y";

      // Check if publishReserveDate has passed (episode is already published)
      const now = new Date();
      const publishDate = episode.publishReserveDate
        ? new Date(episode.publishReserveDate)
        : null;
      const isPublished = !publishDate || publishDate <= now;

      return isOpen || isPublished;
    }).length || 0; // Default to 18 if no data

  const closeModal = () => {
    _closeModal();
    closeBottomSheet();
  };

  // Helper function to get promotion label based on type
  const getPromotionLabel = (type: string) => {
    switch (type) {
      case "free-for-first":
        return "첫 방문자 무료 대여권";
      case "reader-of-prev":
        return "선작 독자 무료 대여권";
      default:
        return "프로모션";
    }
  };

  // Function to update individual promotion count
  const updatePromotionCount = (promotionId: string, newCount: number) => {
    setPromotionCounts((prev) => ({
      ...prev,
      [promotionId]: newCount,
    }));
  };

  const getPromotionKey = (promotion: any) =>
    promotion.id ? String(promotion.id) : promotion.type;

  // Function to get current count for a promotion
  const getPromotionCount = (promotion: any) => {
    const promotionId = getPromotionKey(promotion);
    return (
      promotionCounts[promotionId] ?? promotion.num_of_ticket_per_person ?? 3
    );
  };

  // 항상 2종(free-for-first, reader-of-prev)을 표시. 기존 데이터가 있으면 그 값, 없으면 기본값.
  const defaultPromotionTypes = [
    { type: "free-for-first", label: "첫 방문자 무료 대여권" },
    { type: "reader-of-prev", label: "선작 독자 무료 대여권" },
  ];

  const promotionsToDisplay = defaultPromotionTypes.map((def) => {
    const existing = directPromotions.find((p) => p.type === def.type);
    return existing ?? { type: def.type, status: "stop" as const, num_of_ticket_per_person: 1 };
  });

  const isFreeForFirstEnabled = (promotion: any) => {
    const promotionId = getPromotionKey(promotion);
    if (promotionCounts[promotionId] !== undefined) {
      return promotionCounts[promotionId] > 0;
    }
    return (
      promotion.type === "free-for-first" &&
      promotion.status === "ing" &&
      (promotion.num_of_ticket_per_person ?? 0) > 0
    );
  };

  const handleFreeForFirstToggle = (promotion: any, enabled: boolean) => {
    if (publicEpisodeCount < 1) {
      updatePromotionCount(getPromotionKey(promotion), 0);
      return;
    }
    updatePromotionCount(getPromotionKey(promotion), enabled ? 1 : 0);
  };

  const getFreeForFirstDisplayCount = (promotion: any) =>
    isFreeForFirstEnabled(promotion) ? Math.max(getPromotionCount(promotion), 1) : 0;

  const isFreeForFirstEnded = (promotion: any) =>
    promotion.type === "free-for-first" && promotion.status === "end";

  const handleSave = () => {
    if (!productId || saveDirectPromotionMutation.isPending) return;

    // promotionsToDisplay(항상 2종)에서 현재 모달에 보이는 값을 그대로 전송
    const data: {
      num_of_ticket_per_person_for_free_for_first?: number;
      num_of_ticket_per_person_for_reader_of_prev?: number;
    } = {};

    promotionsToDisplay.forEach((promotion) => {
      const currentCount = getPromotionCount(promotion);
      if (promotion.type === "free-for-first") {
        data.num_of_ticket_per_person_for_free_for_first =
          publicEpisodeCount < 1 ? 0 : getFreeForFirstDisplayCount(promotion);
      } else if (promotion.type === "reader-of-prev") {
        data.num_of_ticket_per_person_for_reader_of_prev = currentCount;
      }
    });

    // Call the save API
    saveDirectPromotionMutation.mutate(
      { id: productId, data },
      {
        onSuccess: (res: any) => {
          const issuedCount = res?.data?.issued_count;
          const message =
            issuedCount && issuedCount > 0
              ? `${issuedCount}명에게 선작독자 대여권이 발급되었습니다.`
              : "프로모션 설정이 저장되었습니다.";
          setToast({
            message,
            type: "success",
          });
          queryClient.invalidateQueries({
            queryKey: ["selectUserProductsWithPromotions"],
          });
          queryClient.invalidateQueries({
            queryKey: ["selectUserPromotionIssuanceStatus"],
          });
          closeModal();
        },
        onError: (error: any) => {
          setToast({
            message:
              error?.response?.data?.message ||
              "프로모션 설정 저장에 실패했습니다.",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <div className="w-[100vw] md:w-[527px]">
      <div className="h-[76px]">
        <div className="flex justify-end items-center h-[17px] mt-[16px] mr-[16px] mb-[4px] relative">
          <button
            onClick={closeModal}
            className="right-0 top-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.5 1.5L13.5 13.5M13.5 1.5L1.5 13.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex justify-center items-center pb-[16px] relative">
          <span className="font-bold text-22pxr">직접 프로모션</span>
        </div>
      </div>
      <div className="flex flex-col bg-light-gray-100 gap-4 p-4">
        {promotionsToDisplay.map((promotion: any, index) => (
          <div
            key={promotion.id || `${promotion.type}_${index}`}
            className="flex justify-between bg-white rounded-xl pr-5 h-[95px] items-center relative"
          >
            {promotion.type === "free-for-first" &&
              isFreeForFirstEnabled(promotion) && (
                <div className="absolute top-[-10px] left-[0px]">
                  <MessageBubble>진행중</MessageBubble>
                </div>
              )}
            {isFreeForFirstEnded(promotion) && (
              <div className="absolute top-[-10px] left-[0px]">
                <MessageBubble>종료됨</MessageBubble>
              </div>
            )}
            <div className="px-4 pt-3 pb-4 text-20pxr flex flex-col gap-2 font-medium">
              {getPromotionLabel(promotion.type)}
              <span className="text-16pxr">명당 증정 대여권</span>
              {promotion.type === "reader-of-prev" && (
                <div className="flex items-center gap-5pxr">
                  <CircleWarnYellow className="w-[14px] h-[14px]" />
                  <span className="text-14pxr text-[#7C8189]">
                    매주 월요일 초기화
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end">
              {promotion.type === "reader-of-prev" &&
              issuanceStatus?.issued_this_week ? (
                <div className="flex flex-col items-end gap-2">
                  <SettingLevel
                    count={getPromotionCount(promotion)}
                    setCount={() => {}}
                    maximum={publicEpisodeCount}
                    disabled
                  />
                  <span className="text-12pxr text-dark-gray-300 text-right">
                    {(() => {
                      if (!issuanceStatus?.this_week_issued_date) return "발급 완료";
                      const d = new Date(issuanceStatus.this_week_issued_date);
                      return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}시에 ${issuanceStatus.this_week_issued_count || 0}명에게 발급됨`;
                    })()}
                  </span>
                </div>
              ) : promotion.type === "free-for-first" ? (
                <div className="flex flex-col items-end gap-2">
                  <Toggle
                    checked={
                      publicEpisodeCount > 0 && isFreeForFirstEnabled(promotion)
                    }
                    disabled={publicEpisodeCount < 1 || isFreeForFirstEnded(promotion)}
                    onChange={(event) =>
                      handleFreeForFirstToggle(
                        promotion,
                        event.target.checked
                      )
                    }
                  />
                  <SettingLevel
                    count={getFreeForFirstDisplayCount(promotion)}
                    setCount={(newCount) =>
                      updatePromotionCount(getPromotionKey(promotion), newCount)
                    }
                    maximum={publicEpisodeCount}
                    minimum={1}
                    disabled={
                      publicEpisodeCount < 1 ||
                      isFreeForFirstEnded(promotion) ||
                      !isFreeForFirstEnabled(promotion)
                    }
                  />
                </div>
              ) : (
                <SettingLevel
                  count={getPromotionCount(promotion)}
                  setCount={(newCount) =>
                    updatePromotionCount(getPromotionKey(promotion), newCount)
                  }
                    maximum={publicEpisodeCount}
                />
              )}
            </div>
          </div>
        ))}

        {/* {directPromotions.length > 0 && (
          <div
            className="flex justify-between bg-white rounded-xl pr-5 h-[95px] items-center relative cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={handlePromotionStop}
          >
            <div className="px-4 pt-3 pb-4 text-20pxr flex flex-col gap-2 font-medium">
              프로모션 중지
            </div>
          </div>
        )} */}
      </div>
      <div className="flex pt-19pxr mb-30pxr mx-34pxr gap-8pxr max-w-full">
        <Button
          className="rounded-[14px] w-[38.3%]"
          variant="secondary"
          size={"xl"}
          onClick={closeModal}
          disabled={
            saveDirectPromotionMutation.isPending
          }
          type="button"
        >
          취소
        </Button>
        <Button
          className="flex-1 rounded-[14px]"
          size={"xl"}
          type="button"
          disabled={
            saveDirectPromotionMutation.isPending
          }
          onClick={handleSave}
        >
          저장
        </Button>
      </div>
    </div>
  );
};

export default DirectPromotion;
