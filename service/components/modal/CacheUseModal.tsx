"use client";

import {
  usePurchaseAllEpisode,
  useSelectUserInfo,
} from "@/app/api/query/mypage/user";
import { TYPE_MODAL } from "@/constants/common";
import useMediaDevice from "@/hooks/useMediaDevice";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BottomSheetContainer from "../common/BottomSheetContainer";
import Button from "../common/Button";
import ModalBottomButton from "../common/ModalBottomButton";
import ModalContainer from "../common/ModalContainer";

const CacheUseModal = () => {
  const device = useMediaDevice();
  const { typeModal, typeModalData, closeTypeModal } = useModalStore();
  const isOpen = typeModal === TYPE_MODAL.CASH_USE;

  if (device === "mobile") {
    return (
      <BottomSheetContainer isOpen={isOpen} onClose={closeTypeModal}>
        <CacheUseContents onClose={closeTypeModal} data={typeModalData} />
      </BottomSheetContainer>
    );
  } else if (
    device === "tablet" ||
    device === "desktop" ||
    device === "miniTablet"
  ) {
    return (
      <ModalContainer isOpen={isOpen} onClose={closeTypeModal} size="full">
        <CacheUseContents onClose={closeTypeModal} data={typeModalData} />
      </ModalContainer>
    );
  } else {
    return null;
  }
};

const CacheUseContents = ({
  onClose,
  data,
}: {
  onClose: () => void;
  data?: {
    productId?: number;
    price?: number;
    episodeCount?: number;
  };
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setToast } = useToastStore();

  // Get user profiles to retrieve default profileId
  const { data: userInfo } = useSelectUserInfo();

  // Calculate total user cash from transaction history
  const userCash = userInfo?.data.totalCash || 0;

  // Purchase mutation with onSuccess and onError handlers
  const purchaseMutation = usePurchaseAllEpisode();

  const productId = data?.productId;
  const price = data?.price || 0;
  const episodeCount = data?.episodeCount || 0;

  const handlePurchase = async () => {
    if (purchaseMutation.isPending) return;
    if (!productId) {
      setToast({
        message: "상품 정보를 찾을 수 없습니다.",
        type: "error",
      });
      return;
    }

    if (!userInfo?.data.profileId) {
      setToast({
        message: "프로필 정보를 찾을 수 없습니다.",
        type: "error",
      });
      return;
    }

    // Check if user has enough cash
    if (userCash < price) {
      setToast({
        message: "캐시가 부족합니다. 충전 후 이용해주세요.",
        type: "warning",
      });
      return;
    }

    try {
      await purchaseMutation.mutateAsync(
        {
          product_id: productId,
          body: {
            profile_id: userInfo.data.profileId,
          },
        },
        {
          onSuccess: () => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["selectUserCash"] });
            queryClient.invalidateQueries({ queryKey: ["product", productId] });
            queryClient.invalidateQueries({ queryKey: ["selectEpisode"] });

            setToast({
              message: "모든 회차 구매가 완료되었습니다!",
              type: "success",
            });

            onClose();
          },
          onError: (error: any) => {
            console.error("Purchase error:", error);
            setToast({
              message:
                error.response?.data?.message || "구매 중 오류가 발생했습니다.",
              type: "error",
            });
          },
        }
      );
    } catch (error) {
      // Error already handled in onError callback
      console.error("Purchase failed:", error);
    }
  };

  const handleChargeClick = () => {
    // TODO: Navigate to charge page or open charge modal
    router.push("/product/mypage/cash"); // Adjust route as needed
  };
  return (
    <div className="h-fit flex flex-col items-center md:w-[300px]">
      <div className="px-6 w-full">
        <div className="flex flex-col w-full text-18pxr font-semibold">
          <div>캐시를 사용하여</div>
          <div>모든 회차를 구매합니다.</div>
        </div>
        <div className="flex gap-2 py-2 items-center">
          <Image
            src={"/images/coin-yellow.svg"}
            alt="잔여캐시"
            width={24}
            height={24}
          />
          <span className="text-14pxr text-gray-600">잔여캐시</span>
          <span className="text-20pxr font-semibold text-primary-100">
            {userCash.toLocaleString()}
            <span className="text-gray-600">c</span>
          </span>
        </div>
        <div className="text-12pxr text-gray-600 flex gap-2">
          <div>·</div>
          일괄 구매 시, 한 편이라도 열람하면 나머지 편 취소는 불가능합니다
        </div>
        <div className="flex flex-col gap-1.5 my-6">
          <Button onClick={handleChargeClick}>캐시 충전하기</Button>
          <Button variant="black" onClick={handlePurchase}>
            구매하기({price.toLocaleString()}캐시)
          </Button>
        </div>
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
export default CacheUseModal;
