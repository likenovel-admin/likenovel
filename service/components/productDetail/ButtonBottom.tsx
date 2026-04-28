"use client";

import {
  useGetAvailableTickets,
  useInterestProduct,
} from "@/app/api/query/product";
import Button from "@/components/common/Button";
import { TYPE_MODAL } from "@/constants/common";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useAuthStore from "@/store/authStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { ProductInterestStatus } from "@/types";
import { isEndDateExpired } from "@/utils/getLatestEpisodeDate";
import { savePendingWebsochatLaunch } from "@/utils/websochatLaunch";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface Props {
  productId?: number;
  isPaidProduct?: boolean;
  isVolumeProduct?: boolean;
  episodeTypePaidCount?: number;
  ownPrice?: number;
  rentalPrice?: number;
  interestStatus: ProductInterestStatus;
  interestEndDate?: string;
  authorId: number;
  authorName?: string;
  productName?: string;
  coverImagePath?: string | null;
  publishedLatestEpisodeNo?: number | null;
  syncedLatestEpisodeNo?: number | null;
  contextStatus?: string | null;
}

const ButtonBottom = ({
  productId,
  isPaidProduct,
  isVolumeProduct,
  episodeTypePaidCount,
  ownPrice = 0,
  rentalPrice = 0,
  interestStatus,
  interestEndDate,
  authorId,
  authorName,
  productName,
  coverImagePath,
  publishedLatestEpisodeNo,
  syncedLatestEpisodeNo,
  contextStatus,
}: Props) => {
  const router = useRouter();
  const { setTypeModal } = useModalStore();
  const { withLoginRequired } = useAuthWrapper();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, accessToken } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
  }));
  const canUseUserScope = !!accessToken && !!user?.userId && isAuthenticated;
  const resolvedPublishedLatestEpisodeNo = Math.max(
    Number(publishedLatestEpisodeNo || 0),
    0
  );
  const resolvedSyncedLatestEpisodeNo = Math.max(
    Number(syncedLatestEpisodeNo || 0),
    0
  );
  const shouldShowWebsochatButton =
    contextStatus === "ready" &&
    !!productId &&
    !!productName &&
    resolvedPublishedLatestEpisodeNo > 0 &&
    resolvedSyncedLatestEpisodeNo > 0;

  const handleWebsochatClick = () => {
    if (!shouldShowWebsochatButton || !productId || !productName) return;
    savePendingWebsochatLaunch({
      productId,
      title: productName,
      authorNickname: authorName || null,
      coverImagePath: coverImagePath || null,
      latestEpisodeNo: resolvedPublishedLatestEpisodeNo,
      publishedLatestEpisodeNo: resolvedPublishedLatestEpisodeNo,
      syncedLatestEpisodeNo: resolvedSyncedLatestEpisodeNo,
      contextStatus: contextStatus || null,
      action: {
        label: "작품 대화",
        prompt: "이 작품에 대해 뭐든 편하게 이야기해줘",
        modeKey: "qa",
        qaActionKey: null,
      },
    });
    router.push("/websochat");
  };

  // Fetch available tickets for paid products
  const { data: ticketsData } = useGetAvailableTickets({
    product_id: isPaidProduct ? productId : undefined,
    enabled: isPaidProduct ? canUseUserScope : false,
  });

  // Interest product mutation
  const { mutate: reviveInterest, isPending: isRevivingInterest } =
    useInterestProduct();

  // Calculate ticket counts by type
  const ticketCounts = useMemo(() => {
    const defaultCounts = {
      free_for_first: 0,
      reader_of_prev: 0,
      waiting_for_free: 0,
      "6-9-path": 0,
      total: 0,
      gift: 0,
      quest: 0,
      event: 0,
      other: 0,
    };

    if (!ticketsData?.count_by_type) {
      return defaultCounts;
    }

    const { count_by_type } = ticketsData;

    // Start with count_by_type values
    let counts = {
      free_for_first: count_by_type.free_for_first || 0,
      reader_of_prev: count_by_type.reader_of_prev || 0,
      waiting_for_free: count_by_type.waiting_for_free || 0,
      "6-9-path": count_by_type["6-9-path"] || 0,
      gift: count_by_type.gift || 0,
      quest: count_by_type.quest || 0,
      event: count_by_type.event || 0,
    };

    // Only check ticketsData.data if gift count > 0
    if (
      count_by_type.gift > 0 &&
      ticketsData?.data &&
      Array.isArray(ticketsData.data)
    ) {
      // Re-count from ticketsData.data array

      ticketsData.data.forEach((ticket) => {
        const ticketType = ticket.ticket_type;
        if (ticket.type === "gift") {
          if (ticketType === "free-for-first") {
            counts.free_for_first++;
          } else if (ticketType === "reader-of-prev") {
            counts.reader_of_prev++;
          } else if (ticketType === "waiting-for-free") {
            counts.waiting_for_free++;
          } else if (ticketType === "6-9-path") {
            counts["6-9-path"]++;
          }
        }
      });
    }

    const total = ticketsData.data?.length || 0;

    // Calculate "other" = all tickets EXCEPT categorized ticket types
    const other =
      total -
      (counts.free_for_first +
        counts.reader_of_prev +
        counts.waiting_for_free +
        counts["6-9-path"] +
        counts.quest +
        counts.event);

    return {
      ...counts,
      other,
      total,
    };
  }, [ticketsData]);

  const handleDonateClick = withLoginRequired(() => {
    setTypeModal(TYPE_MODAL.DONATE, {
      productId,
      authorId,
      authorName,
    });
  });

  const handleRentalTicketClick = withLoginRequired(() => {
    setTypeModal(TYPE_MODAL.RENTAL_STATUS, {
      title: productName,
      productId,
      ticketCounts,
    });
  });

  const bulkPurchasePrice = isVolumeProduct
    ? ownPrice
    : episodeTypePaidCount
      ? episodeTypePaidCount * 100
      : 0;
  const formattedPrice = bulkPurchasePrice.toLocaleString("ko-KR");

  const handleBulkPurchaseClick = withLoginRequired(() => {
    setTypeModal(TYPE_MODAL.CASH_USE, {
      productId,
      price: bulkPurchasePrice,
      ownPrice,
      rentalPrice,
      purchaseMode: isVolumeProduct ? "volume" : "serial",
      episodeCount: episodeTypePaidCount,
    });
  });

  const handleReviveInterestClick = withLoginRequired(() => {
    if (isRevivingInterest) return;
    if (!productId) return;

    reviveInterest(productId, {
      onSuccess: () => {
        setToast({
          message: "관심이 되살아났습니다.",
          type: "confirm",
        });
        // Refetch product details to update interest status
        queryClient.invalidateQueries({
          queryKey: ["selectProductDetail", productId],
        });
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message || "관심 되살리기에 실패했습니다.";
        setToast({
          message: errorMessage,
          type: "error",
        });
      },
    });
  });

  return (
    <div className="fixed bottom-0 left-0 w-full mx-auto h-80pxr md:h-74pxr bg-black md:bg-white flex flex-col justify-center z-50">
      <div className="w-full max-w-[1200px] mx-auto rounded-t-[20px] px-8pxr md:px-60pxr md:rounded-none h-full bg-white flex gap-4pxr md:gap-8pxr md:justify-between items-center">
        <div className="flex gap-4pxr md:gap-8pxr items-center flex-1 md:flex-none">
          {interestStatus === "no_interest" &&
          interestEndDate &&
          isEndDateExpired(interestEndDate) ? (
            <Button
              onClick={handleReviveInterestClick}
              disabled={isRevivingInterest}
              className="flex gap-3pxr md:gap-7pxr items-center justify-center flex-1 md:flex-none md:w-[176px] md:h-[52px] h-[48px] bg-white border border-[#E4E6ED] rounded-10px md:rounded-14px text-12pxr md:text-14pxr !text-dark-gray-500 hover:!bg-white hover:opacity-70 px-8pxr md:px-16pxr disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Image
                src="/images/fire-off.png"
                alt="관심 끊김"
                width={16}
                height={21}
                className="w-[16px] h-[21px] md:w-[20px] md:h-[26px]"
              />
              관심 되살리기
            </Button>
          ) : interestStatus === "interest_active" ||
            interestStatus === "interest_ending_soon" ? (
            <Button className="flex gap-3pxr md:gap-7pxr items-center justify-center flex-1 md:flex-none md:w-[176px] md:h-[52px] h-[48px] !bg-[#F7F7F8] border-none rounded-10px md:rounded-14px text-12pxr md:text-14pxr !text-dark-gray-500 hover:!bg-white hover:opacity-70 px-8pxr md:px-16pxr whitespace-nowrap">
              <Image
                src="/images/test/fire.svg"
                alt="관심 끊김"
                width={16}
                height={21}
                className="w-[16px] h-[21px] md:w-[20px] md:h-[26px]"
              />
              관심유지중
            </Button>
          ) : null}
          <Button
            onClick={handleDonateClick}
            className="flex gap-3pxr md:gap-9pxr items-center justify-center flex-1 md:flex-none md:w-[176px] md:h-[52px] h-[48px] bg-white border border-primary-200 rounded-10px md:rounded-14px text-12pxr md:text-14pxr !text-black-200 hover:!bg-white hover:opacity-70 px-8pxr md:px-16pxr whitespace-nowrap"
          >
            <Image
              src="/images/coin-outline.svg"
              alt="후원하기"
              width={16}
              height={21}
              className="w-[16px] h-[21px] md:w-[20px] md:h-[26px]"
            />
            후원하기
          </Button>
          {shouldShowWebsochatButton ? (
            <Button
              onClick={handleWebsochatClick}
              className="flex items-center justify-center flex-1 md:flex-none md:w-[176px] md:h-[52px] h-[48px] bg-primary-200 rounded-10px md:rounded-14px text-12pxr md:text-14pxr !text-white hover:opacity-70 px-8pxr md:px-16pxr whitespace-nowrap"
            >
              <span className="md:hidden">웹소챗</span>
              <span className="hidden md:inline">웹소챗 하러가기</span>
            </Button>
          ) : null}
        </div>
        <div className="flex gap-4pxr md:gap-8pxr items-center flex-1 md:flex-none">
          {isPaidProduct && (
            <Button
              className="flex gap-3pxr md:gap-7pxr items-center justify-center flex-1 md:flex-none md:w-[176px] md:h-[52px] h-[48px] bg-white border border-[#E4E6ED] rounded-10px md:rounded-14px text-12pxr md:text-14pxr !text-dark-gray-500 hover:!bg-white hover:opacity-70 px-8pxr md:px-16pxr"
              onClick={handleRentalTicketClick}
            >
              대여권 {ticketCounts.total}장
            </Button>
          )}
          {((isVolumeProduct && ownPrice > 0) ||
            (!isVolumeProduct && episodeTypePaidCount && episodeTypePaidCount > 0)) ? (
            <Button
              className="flex gap-3pxr md:gap-7pxr items-center justify-center flex-1 md:flex-none md:w-[176px] md:h-[52px] h-[48px] bg-primary-200 rounded-10px md:rounded-14px text-12pxr md:text-14pxr !text-white hover:opacity-70 px-8pxr md:px-16pxr"
              onClick={handleBulkPurchaseClick}
            >
              {isVolumeProduct ? "소장/대여" : `일괄구매 ${formattedPrice}원`}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ButtonBottom;
