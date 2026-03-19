"use client";
import {
  usePurchaseEpisode,
  useSelectUserInfo,
  useUseRentalTicket,
} from "@/app/api/query/mypage/user";
import { useGetAvailableTickets } from "@/app/api/query/product";
import { TYPE_MODAL } from "@/constants/common";
import useMediaDevice from "@/hooks/useMediaDevice";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import {
  appendFunnelResumeToPath,
  getCurrentInternalPath,
  getEpisodeIdFromViewerPathname,
  getOriginPageTypeFromPathname,
} from "@/utils/funnelResume";
import { postNextEpisodeClickSignalBestEffort } from "@/utils/nextEpisodeClickSignal";
import { buildViewerPath } from "@/utils/viewerPath";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomSheetContainer from "../common/BottomSheetContainer";
import Button from "../common/Button";
import ModalBottomButton from "../common/ModalBottomButton";
import ModalContainer from "../common/ModalContainer";
import ArrowRight from "/public/images/arrow-right-medium.svg";

interface CacheStatusModalProps extends CommonModalProps {
  title: string;
}
const CacheStatusModal = () => {
  const device = useMediaDevice();
  const { typeModal, closeTypeModal, typeModalData } = useModalStore();
  const isOpen = typeModal === TYPE_MODAL.RENT_OWN;
  console.log(device);
  if (device === "mobile") {
    return (
      <BottomSheetContainer
        title={typeModalData?.title}
        isOpen={isOpen}
        onClose={closeTypeModal}
      >
        <CacheStatusContents
          onClose={closeTypeModal}
          typeModalData={typeModalData}
        />
      </BottomSheetContainer>
    );
  } else if (
    device === "tablet" ||
    device === "desktop" ||
    device === "miniTablet"
  ) {
    return (
      <ModalContainer
        title={typeModalData?.title}
        isOpen={isOpen}
        onClose={closeTypeModal}
        size="full"
      >
        <CacheStatusContents
          onClose={closeTypeModal}
          typeModalData={typeModalData}
        />
      </ModalContainer>
    );
  } else {
    return null;
  }
};

const CacheStatusContents = ({
  onClose,
  typeModalData,
}: {
  onClose: () => void;
  typeModalData?: any;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { setToast } = useToastStore();

  // Fetch user info (includes total cash)
  const { data: userInfo } = useSelectUserInfo();

  // Fetch available tickets for this product/episode
  const { data: ticketData, refetch } = useGetAvailableTickets({
    episode_id: typeModalData?.episodeId,
    product_id: typeModalData?.productId,
  });

  // Purchase episode mutation
  const purchaseEpisode = usePurchaseEpisode();

  // Use rental ticket mutation
  const useRentalTicket = useUseRentalTicket();

  // Get available rental tickets (old code - commented for reference)
  // const availableRentalTickets =
  //   ticketData?.data?.filter(
  //     (ticket) =>
  //       // ticket.own_type === "rental" &&
  //       ticket.use_yn === "N"
  //   ) || [];

  // Get available rental tickets from new API
  const availableRentalTickets = ticketData?.data || [];

  // Calculate total rental tickets count
  const rentalTicketCount = availableRentalTickets.length;

  // Get total cash from user info
  const totalCash = userInfo?.data?.totalCash || 0;

  // Get episode price with default value 100
  const episodePrice = 100;

  // Check if user has enough cash
  const hasEnoughCash = totalCash >= episodePrice;

  useEffect(() => {
    if (typeModalData?.episodeId && typeModalData?.productId) {
      refetch();
    }
  }, [refetch, typeModalData?.episodeId, typeModalData?.productId]);

  const invalidateViewerPathQueries = () => {
    const destinationEpisodeId = Number(typeModalData?.episodeId || 0);
    const fromEpisodeId = Number(typeModalData?.signalContext?.fromEpisodeId || 0);

    if (destinationEpisodeId) {
      queryClient.invalidateQueries({
        queryKey: ["selectViewerPath", destinationEpisodeId],
      });
    }

    if (fromEpisodeId) {
      queryClient.invalidateQueries({
        queryKey: ["selectViewerPath", fromEpisodeId],
      });
    }
  };

  const navigateToViewer = (episodeId: number, productId: number) => {
    postNextEpisodeClickSignalBestEffort(typeModalData?.signalContext);
    router.push(
      buildViewerPath(episodeId, {
        productId,
      })
    );
  };

  const handleMoveToRecharge = () => {
    const productId = Number(typeModalData?.productId || 0);
    if (!productId) {
      router.push("/product/mypage/cash");
      onClose();
      return;
    }

    router.push(
      appendFunnelResumeToPath("/product/mypage/cash", {
        productId,
        reason: "payment",
        originPageType: getOriginPageTypeFromPathname(pathname),
        originEpisodeId: getEpisodeIdFromViewerPathname(pathname),
        returnPath: getCurrentInternalPath(),
      })
    );
    onClose();
  };

  const handleUseRentalTicket = async () => {
    if (useRentalTicket.isPending) return;

    if (!typeModalData?.episodeId) {
      setToast({
        message: "에피소드 정보를 불러올 수 없습니다.",
        type: "error",
      });
      return;
    }

    if (availableRentalTickets.length === 0) {
      setToast({
        message: "사용 가능한 무료 대여권이 없습니다.",
        type: "error",
      });
      return;
    }

    // Get the first available rental ticket
    const firstTicket = availableRentalTickets[0];

    try {
      await useRentalTicket.mutateAsync(
        {
          episode_id: typeModalData.episodeId,
          rental_ticket_id: firstTicket.id,
        },
        {
          onSuccess: () => {
            setToast({
              message: "무료 대여권을 사용했습니다.",
              type: "success",
            });

            // Refresh queries
            queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });
            queryClient.invalidateQueries({
              queryKey: ["getEpisodeList"],
            });
            queryClient.invalidateQueries({
              queryKey: ["selectProductDetail", typeModalData.productId],
            });
            queryClient.invalidateQueries({
              queryKey: [
                "getEpisodeList",
                typeModalData.episodeId,
                typeModalData.productId,
              ],
            });
            invalidateViewerPathQueries();

            onClose();

            navigateToViewer(typeModalData.episodeId, typeModalData.productId);
          },
          onError: (error: any) => {
            setToast({
              message:
                error?.response?.data?.message ||
                "무료 대여권 사용에 실패했습니다.",
              type: "error",
            });
          },
        }
      );
    } catch (error: any) {
      setToast({
        message:
          error?.response?.data?.message || "무료 대여권 사용에 실패했습니다.",
        type: "error",
      });
    }
  };

  const handlePurchaseEpisode = async () => {
    if (purchaseEpisode.isPending) return;

    if (!typeModalData?.episodeId || !userInfo?.data?.profileId) {
      setToast({
        message: "에피소드 정보를 불러올 수 없습니다.",
        type: "error",
      });
      return;
    }

    try {
      await purchaseEpisode.mutateAsync(
        {
          episode_id: typeModalData.episodeId,
          body: {
            profile_id: userInfo.data.profileId,
          },
        },
        {
          onSuccess: () => {
            setToast({
              message: "에피소드를 구매했습니다.",
              type: "success",
            });

            // Refresh user info and tickets
            queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });
            queryClient.invalidateQueries({
              queryKey: ["getEpisodeList"],
            });
            queryClient.invalidateQueries({
              queryKey: ["selectProductDetail", typeModalData.productId],
            });
            queryClient.invalidateQueries({
              queryKey: [
                "getEpisodeList",
                typeModalData.episodeId,
                typeModalData.productId,
              ],
            });
            invalidateViewerPathQueries();

            onClose();

            navigateToViewer(typeModalData.episodeId, typeModalData.productId);
          },
          onError: (error: any) => {
            setToast({
              message: error?.response?.data?.message || "구매에 실패했습니다.",
              type: "error",
            });
          },
        }
      );
    } catch (error: any) {
      setToast({
        message: error?.response?.data?.message || "구매에 실패했습니다.",
        type: "error",
      });
    }
  };

  return (
    <div className="h-fit flex flex-col items-center md:w-[358px]">
      {typeModalData?.episodeTitle && (
        <p className="w-full px-10 text-14pxr text-dark-gray-400 truncate">
          {typeModalData.episodeTitle}
        </p>
      )}
      <div className="w-full px-10">
        <ul className="text-16pxr list-disc py-4">
          <li>
            무료 대여권
            <span className="text-black-100 font-semibold">
              {rentalTicketCount}장
            </span>
          </li>
          <li>
            잔여캐쉬
            <span className="text-primary-100 font-semibold">
              {totalCash.toLocaleString()}원
            </span>
          </li>
        </ul>
      </div>
      {(!!rentalTicketCount || hasEnoughCash) && (
        <div className="w-full flex justify-center">
          <button
            className="text-primary-100 flex items-center gap-1"
            onClick={handleMoveToRecharge}
          >
            캐쉬충전하기
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="w-full p-6 pt-4 flex flex-col gap-3">
        {!!rentalTicketCount && (
          <Button
            className="w-full h-auto"
            onClick={handleUseRentalTicket}
            disabled={rentalTicketCount === 0 || useRentalTicket.isPending}
          >
            <div className="text-16pxr text-white my-2 font-medium flex flex-col">
              무료 대여권
            </div>
          </Button>
        )}
        {hasEnoughCash && (
          <Button
            className="w-full h-auto bg-black-100"
            onClick={handlePurchaseEpisode}
            disabled={purchaseEpisode.isPending}
          >
            <div className="text-16pxr text-white my-2 font-medium flex flex-col">
              소장하기
              <span className="text-13pxr font-normal text-blue-200">
                {episodePrice}캐시로 구매
              </span>
            </div>
          </Button>
        )}
        {!rentalTicketCount && !hasEnoughCash && (
          <Button
            className="w-full h-auto bg-primary-100"
            onClick={handleMoveToRecharge}
          >
            <div className="text-16pxr text-white my-2 font-medium flex flex-col">
              캐시 충전하기
              <span className="text-13pxr font-normal text-blue-200">
                잔여 캐시가 부족합니다
              </span>
            </div>
          </Button>
        )}
      </div>
      <div className="w-full sticky bottom-0 bg-white mt-6 md:mt-0">
        <ModalBottomButton
          leftButton={{
            text: "취소",
            onClick: onClose,
          }}
        />
      </div>
    </div>
  );
};
export default CacheStatusModal;
