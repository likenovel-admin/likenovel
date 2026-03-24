import {
  useUserApplyAppliedPromotion,
  useUserCancelAppliedPromotion,
} from "@/app/api/query/mypage/user";
import { AppliedPromotion } from "@/app/api/query/mypage/user/dto";
import useBottomSheetStore from "@/store/bottomSheetStore";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { getFormattingDate } from "@/utils/getFormattingDate";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import ExclamationTooltip from "../common/ExclamationTooltip";
import SquareBadge from "../common/SquareBadge";
import Check from "/public/images/check.svg";
import Clock from "/public/images/clock.svg";
import CloseRed from "/public/images/close-red-2.svg";
import TriangleWarnWhite from "/public/images/triangle-warn-white.svg";

interface RequestPromotionProps {
  appliedPromotions: AppliedPromotion[];
  productId: number;
  remainingSlots: number;
}

const RequestPromotion = ({
  appliedPromotions,
  productId,
  remainingSlots,
}: RequestPromotionProps) => {
  const { setConfirm } = useConfirmStore();
  const { setToast } = useToastStore();
  const { closeModal: _closeModal } = useModalStore();
  const { closeBottomSheet } = useBottomSheetStore();
  const closeModal = () => {
    _closeModal();
    closeBottomSheet();
  };
  const queryClient = useQueryClient();
  const applyPromotionMutation = useUserApplyAppliedPromotion();
  const cancelPromotionMutation = useUserCancelAppliedPromotion();

  // Calculate default dates
  const today = new Date();
  const oneWeekLater = new Date(today);
  oneWeekLater.setDate(today.getDate() + 7);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const defaultStartDate = formatDate(today);
  const defaultEndDate = formatDate(oneWeekLater);

  // Default promotions to show if no data
  const defaultPromotions: AppliedPromotion[] = [
    {
      id: 0,
      product_id: 0,
      type: "waiting-for-free",
      status: "none",
      start_date: defaultStartDate,
      end_date: defaultEndDate,
      num_of_ticket_per_person: 0,
      created_id: 0,
      created_date: "",
      updated_id: null,
      updated_date: null,
      can_apply_text: "",
      can_apply: true,
      remaining_slots: remainingSlots,
    },
    {
      id: 0,
      product_id: 0,
      type: "6-9-path",
      status: "none",
      start_date: defaultStartDate,
      end_date: defaultEndDate,
      num_of_ticket_per_person: 0,
      created_id: 0,
      created_date: "",
      updated_id: null,
      updated_date: null,
      can_apply_text:
        remainingSlots <= 0 ? "이번 주 신청 마감" : "이번 주 신청 가능",
      can_apply: remainingSlots > 0,
      remaining_slots: remainingSlots,
    },
  ];

  // Build promotions to display - always show both types
  const promotionsToDisplay = (() => {
    if (appliedPromotions.length === 0) {
      // No data at all - show both defaults
      return defaultPromotions;
    }

    if (appliedPromotions.length === 2) {
      // Already have both types
      return appliedPromotions;
    }

    // Only have 1 promotion - need to add the missing one
    const existingType = appliedPromotions[0].type;
    const missingDefault = defaultPromotions.find(
      (def) => def.type !== existingType
    );

    return missingDefault
      ? [...appliedPromotions, missingDefault]
      : appliedPromotions;
  })();

  const handleApplyPromotion = (promotion: AppliedPromotion) => {
    if (applyPromotionMutation.isPending) return;
    setConfirm({
      content: "이 프로모션을 신청하시겠습니까?",
      confirmText: "신청",
      onConfirm: () => {
        applyPromotionMutation.mutate(
          {
            productId: promotion.product_id || productId,
            data: {
              type: promotion.type,
              start_date: promotion.start_date,
              end_date: promotion.end_date,
            },
          },
          {
            onSuccess: () => {
              setToast({
                message: "프로모션을 신청했습니다.",
                type: "success",
              });
              queryClient.invalidateQueries({
                queryKey: ["selectUserProductsWithPromotions"],
              });
              closeModal();
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message ||
                  "프로모션 신청에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      },
    });
  };

  const handleCancelPromotion = (promotion: AppliedPromotion) => {
    if (cancelPromotionMutation.isPending) return;
    setConfirm({
      content: "이 프로모션 신청을 철회하시겠습니까?",
      confirmText: "철회",
      onConfirm: () => {
        cancelPromotionMutation.mutate(
          { productId: promotion.id || 0 },
          {
            onSuccess: () => {
              setToast({
                message: "프로모션 신청을 철회했습니다.",
                type: "success",
              });
              queryClient.invalidateQueries({
                queryKey: ["selectUserProductsWithPromotions"],
              });
              closeModal();
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message ||
                  "프로모션 신청 철회에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      },
    });
  };

  return (
    <div className="w-[100vw] md:w-[527px]">
      {/* <span className="flex justify-center pb-4 font-bold text-22pxr">
        신청 프로모션
      </span> */}
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
          <span className="font-bold text-22pxr">신청 프로모션</span>
        </div>
      </div>
      <div className="flex flex-col bg-light-gray-100 gap-1 p-4">
        {promotionsToDisplay.length > 0 ? (
          promotionsToDisplay.map((promotion) => {
            return (
              <React.Fragment key={promotion.id}>
                {promotion.type === "waiting-for-free" && (
                  <div className="flex justify-between bg-white rounded-xl pr-5 h-[95px] items-center md:px-4 md:py-6">
                    <div className="px-4 pt-3 pb-4 text-17pxr flex flex-col gap-1 font-medium">
                      <div className="gap-1 flex flex-col">
                        {promotion.status === "apply" && (
                          <div className="flex items-center w-fit h-[20px] pr-2 gap-3pxr md:gap-6pxr bg-[#2F7FFF] rounded-full p-0.5">
                            <Clock className="w-[15px] md:w-[18px] h-[15px] md:h-[18px] text-white" />
                            <span className="text-12pxr md:text-14pxr text-white">
                              심사중
                            </span>
                          </div>
                        )}
                        {promotion.status === "deny" && (
                          <div className="flex items-center w-fit h-[20px] pr-2 gap-3pxr md:gap-6pxr bg-red-100 rounded-full p-0.5">
                            <TriangleWarnWhite className="w-[15px] md:w-[18px] h-[15px] md:h-[18px] text-white" />
                            <span className="text-12pxr md:text-14pxr text-white">
                              심사반려
                            </span>
                          </div>
                        )}
                        {promotion.type === "waiting-for-free" && (
                          <div className="flex gap-2 items-center">
                            <SquareBadge type={["waitForFree"]} />
                            기다리면 무료{" "}
                            <ExclamationTooltip message="기다리면 무료 대상 기간 동안 24시간마다 무료대여권 1장을 지급합니다." />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className="text-primary-100 text-12pxr ">
                        {promotion.can_apply_text}
                      </span>

                      {promotion.status !== "apply" && (
                        <>
                          <button
                            onClick={() => handleApplyPromotion(promotion)}
                            disabled={
                              applyPromotionMutation.isPending ||
                              cancelPromotionMutation.isPending
                            }
                            className="p-1 h-fit md:p-2 text-12pxr md:text-14pxr gap-1.5 flex items-center border rounded-full w-fit"
                          >
                            <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#E6F0FF] flex justify-center items-center">
                              <Check className="w-[13px] h-[9px] text-primary-200" />
                            </div>
                            신청
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {promotion.type === "6-9-path" && (
                  <div className="flex justify-between bg-white rounded-xl pr-5 h-[95px] items-center md:px-4 md:py-6">
                    <div className="px-4 pt-3 pb-4 text-17pxr flex flex-col gap-1 font-medium">
                      {promotion.status === "deny" && (
                        <div className="flex items-center w-fit h-[20px] pr-2 gap-3pxr md:gap-6pxr bg-red-100 rounded-full p-0.5">
                          <TriangleWarnWhite className="w-[15px] md:w-[18px] h-[15px] md:h-[18px] text-white" />
                          <span className="text-12pxr md:text-14pxr text-white">
                            심사반려
                          </span>
                        </div>
                      )}
                      {promotion.type === "6-9-path" && (
                        <div className="flex gap-2 items-center">
                          <SquareBadge
                            type={["timePass"]}
                            timePassValue="6-9"
                          />
                          6-9 무료{" "}
                          <ExclamationTooltip message="매주 69패스에 선정된 작품은 오전/오후 6시~9시 동안 무료대여권 1장을 지급합니다." />
                        </div>
                      )}
                      {!!promotion.start_date && !!promotion.end_date && (
                        <span className="text-12pxr md:text-14pxr text-dark-gray-500">
                          {getFormattingDate(
                            promotion.start_date,
                            "YYYY.MM.DD"
                          )}{" "}
                          ~{" "}
                          {getFormattingDate(promotion.end_date, "YYYY.MM.DD")}{" "}
                          중 하루
                        </span>
                      )}
                      <span className="text-12pxr md:text-14pxr text-dark-gray-500">
                        남은자리{" "}
                        <span>
                          {promotion.remaining_slots}/
                          <span className="text-dark-gray-300">20</span>
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className="text-primary-100 text-12pxr ">
                        {promotion.can_apply_text}
                      </span>
                      {promotion.status === "apply" ? (
                        <button
                          onClick={() => handleCancelPromotion(promotion)}
                          disabled={
                            applyPromotionMutation.isPending ||
                            cancelPromotionMutation.isPending
                          }
                          className="p-1 h-fit md:p-2 text-12pxr md:text-14pxr gap-1.5 flex items-center border rounded-full"
                        >
                          {/* <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#FEEAEA] flex justify-center items-center"> */}
                          <CloseRed className="w-[24px] h-[24px] md:w-[24px] md:h-[24px] text-red-100" />
                          {/* </div> */}
                          철회
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyPromotion(promotion)}
                          disabled={
                            promotion.can_apply === false ||
                            promotion.remaining_slots <= 0 ||
                            applyPromotionMutation.isPending ||
                            cancelPromotionMutation.isPending
                          }
                          className="p-1 h-fit md:p-2 text-12pxr md:text-14pxr gap-1.5 flex items-center border rounded-full w-fit"
                        >
                          <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#E6F0FF] flex justify-center items-center">
                            <Check className="w-[13px] h-[9px] text-primary-200" />
                          </div>
                          신청
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        ) : (
          <div className="flex justify-center items-center h-[200px] text-dark-gray-400">
            신청된 프로모션이 없습니다.
          </div>
        )}
      </div>
      <button className="md:hidden w-[100vw] h-[60px] text-14pxr flex justify-center items-center">
        취소
      </button>
    </div>
  );
};

export default RequestPromotion;
