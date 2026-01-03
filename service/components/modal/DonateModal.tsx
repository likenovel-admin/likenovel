"use client";
import { useSelectUserInfo, useUserSponsorProduct } from "@/app/api/query/mypage/user";
import { TYPE_MODAL } from "@/constants/common";
import useMediaDevice from "@/hooks/useMediaDevice";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import BottomSheetContainer from "../common/BottomSheetContainer";
import Button from "../common/Button";
import ModalBottomButton from "../common/ModalBottomButton";
import ModalContainer from "../common/ModalContainer";
import Input from "../form/input";
import SelectBox from "../form/selectbox";

interface DonateModalProps extends CommonModalProps {}

const TitleContents = ({ authorName }: { authorName?: string }) => {
  return (
    <div className="flex flex-col text-center">
      <span>{authorName || "작가"}님에게 후원하기</span>
      <span className="text-14pxr text-gray-600 font-normal">
        작가님께 따뜻한 마음을 담아 후원하세요.
      </span>
    </div>
  );
};
const DonateModal = () => {
  const device = useMediaDevice();
  const { typeModal, typeModalData, closeTypeModal } = useModalStore();
  const isOpen = typeModal === TYPE_MODAL.DONATE;

  // Extract data from typeModalData
  const productId = typeModalData?.productId || typeModalData?.product_id;
  const authorId = typeModalData?.author_id || typeModalData?.authorId;
  const authorName = typeModalData?.authorName || typeModalData?.author_name;

  if (device === "mobile") {
    return (
      <BottomSheetContainer
        title={<TitleContents authorName={authorName} />}
        isOpen={isOpen}
        onClose={closeTypeModal}
      >
        <DonateContents onClose={closeTypeModal} productId={productId} authorId={authorId} authorName={authorName} />
      </BottomSheetContainer>
    );
  } else if (
    device === "tablet" ||
    device === "desktop" ||
    device === "miniTablet"
  ) {
    return (
      <ModalContainer
        title={<TitleContents authorName={authorName} />}
        isOpen={isOpen}
        onClose={closeTypeModal}
        size="full"
      >
        <DonateContents onClose={closeTypeModal} productId={productId} authorId={authorId} authorName={authorName} />
      </ModalContainer>
    );
  } else {
    return null;
  }
};

const DonateContents = ({
  onClose,
  productId,
  authorId,
  authorName,
}: {
  onClose: () => void;
  productId?: number;
  authorId?: number;
  authorName?: string;
}) => {
  const [message, setMessage] = useState("늘 응원합니다!");
  const [donateAmount, setDonateAmount] = useState("");
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();

  // Fetch user info to get total cash and profile_id
  const { data: userInfo } = useSelectUserInfo();
  const totalCash = userInfo?.data?.totalCash || 0;
  const profileId = userInfo?.data?.profileId;

  // Sponsor mutation - using useUserSponsorProduct
  const sponsorMutation = useUserSponsorProduct();

  // Handle donate amount input - only allow numbers
  const handleDonateAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    if (value === "" || /^\d+$/.test(value)) {
      setDonateAmount(value);
    }
  };

  // Handle sponsor submit
  const handleSponsorSubmit = async () => {
    if (!productId) {
      setToast({
        message: "작품 정보를 찾을 수 없습니다.",
        type: "error",
      });
      return;
    }

    if (!profileId) {
      setToast({
        message: "프로필 정보를 찾을 수 없습니다.",
        type: "error",
      });
      return;
    }

    const amount = parseInt(donateAmount);
    if (!amount || amount <= 0) {
      setToast({
        message: "후원 금액을 입력해주세요.",
        type: "error",
      });
      return;
    }

    if (amount > totalCash) {
      setToast({
        message: "보유 캐시가 부족합니다.",
        type: "error",
      });
      return;
    }

    if (!message) {
      setToast({
        message: "전달 메시지를 선택해주세요.",
        type: "error",
      });
      return;
    }

    try {
      await sponsorMutation.mutateAsync({
        product_id: productId,
        profile_id: profileId,
        donation_price: amount,
        message: message,
      });

      setToast({
        message: "후원이 완료되었습니다.",
        type: "success",
      });

      // Invalidate user info to refresh cash balance
      queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });

      // Close modal
      onClose();
    } catch (error) {
      setToast({
        message: "후원에 실패했습니다. 다시 시도해주세요.",
        type: "error",
      });
    }
  };

  return (
    <div className="h-fit flex flex-col items-center md:w-[500px]">
      <div className="bg-light-gray-100 border-t w-full py-3 px-5">
        <div className="flex gap-2 items-center bg-white rounded-xl px-5 py-3 md:py-5 justify-center">
          <div className="relative w-[18px] h-[18px] md:w-6 md:h-6">
            <Image src={"/images/coin-yellow.svg"} alt="잔여캐시" fill />
          </div>
          <span className="text-13pxr md:text-14pxr text-gray-600">
            잔여캐시
          </span>
          <span className="text-16pxr md:text-20pxr font-semibold text-primary-100">
            {totalCash.toLocaleString()}
            <span className="text-gray-600">c</span>
          </span>
        </div>
      </div>
      <div className="w-full px-5 pt-5">
        <span className="text-14pxr text-gray-600 font-semibold">
          후원할 캐시
        </span>
        <div className="mt-2"></div>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={donateAmount}
          onChange={handleDonateAmountChange}
          placeholder="0"
          additionalText={
            <div className="h-full text-12pxr text-gray-500 pr-3 pl-1 mr-[2px] bg-white">
              캐시
            </div>
          }
          inputStyle="w-full h-[44px]"
        />
      </div>
      <DonateAmountButton
        donateAmount={donateAmount}
        setDonateAmount={setDonateAmount}
      />
      <div className="w-full px-5 mt-5 mb-3">
        <span className="text-14pxr text-gray-600 font-semibold">
          전달메시지
        </span>
        <SelectBox
          value={message}
          className="h-[44px] mt-2"
          onChange={(event) => setMessage(event.target.value)}
          options={[
            {
              value: "늘 응원합니다!",
              label: "늘 응원합니다!",
            },
            {
              value: "고생 많으셨습니다",
              label: "고생 많으셨습니다",
            },
            {
              value: "다음화가 기다려집니다",
              label: "다음화가 기다려집니다",
            },
            {
              value: "조금 더 신경써주세요",
              label: "조금 더 신경써주세요",
            },
          ]}
        />
      </div>
      <div className="w-full flex justify-center flex-col gap-2 px-5 mb-4">
        <Button
          className="w-full h-[44px]"
          onClick={handleSponsorSubmit}
          disabled={sponsorMutation.isPending}
        >
          {sponsorMutation.isPending
            ? "후원 중..."
            : totalCash > 0
            ? "후원하기"
            : "결제하고 후원하기"}
        </Button>
        {/* <button className="text-primary-100 flex items-center gap-1 w-full justify-center h-[44px]">
          충전하기
          <ArrowRight className="w-3 h-3" />
        </button> */}
      </div>
      <div className="w-full sticky bottom-0 bg-white md:mt-6">
        <ModalBottomButton
          leftButton={{
            text: "취소",
            onClick: onClose,
            className: "border-0 border-t border-t-[#EFF0F4]",
          }}
        />
      </div>
    </div>
  );
};

const DonateAmountButton = ({
  donateAmount,
  setDonateAmount,
}: {
  donateAmount: string;
  setDonateAmount: (value: string) => void;
}) => {
  const amountList = [100, 1000, 5000, 10000, 100000];

  const handleAmountClick = (amount: number) => {
    const currentAmount = parseInt(donateAmount) || 0;
    const newAmount = currentAmount + amount;
    setDonateAmount(newAmount.toString());
  };

  return (
    <div className="w-full px-5">
      <div className="flex gap-2 w-full pt-3 md:pb-6 md:border-b">
        {amountList.map((amount) => (
          <button
            onClick={() => handleAmountClick(amount)}
            key={amount}
            className="rounded-lg text-12pxr md:text-14pxr border bg-light-gray-100 flex-1 h-[44px] hover:bg-white transition-colors"
          >
            +{amount.toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DonateModal;
