"use client";
import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import Modal from "@/components/common/Modal";
import WarningModal from "@/components/modal/WarningModal";
import useModalStore from "@/store/modalStore";
import FormArea from "@/components/makingProduct/FormArea";
import { useBgColor } from "@/contexts/BgColorContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function MakingProduct() {
  const { setBgColor } = useBgColor();
  const router = useRouter();
  const { data: userInfo } = useSelectUserInfo();
  const { setModal } = useModalStore();
  const isCpUser = userInfo?.data?.userRole === "CP";

  useEffect(() => {
    setBgColor("bg-[#F7F8FA]");
    return () => {
      setBgColor("bg-white");
    };
  }, [setBgColor]);

  useEffect(() => {
    if (!isCpUser) return;

    setModal(
      <WarningModal
        content={
          <span className="text-17pxr font-bold">
            파트너사이트에서 신규작품생성을 해주세요.
          </span>
        }
      />
    );
    router.replace("/product/author");
  }, [isCpUser, router, setModal]);

  return (
    <div className="w-full h-auto bg-[#F7F8FA]">
      <div className="flex flex-col w-full max-w-[1120px] mx-auto">
        <div className="flex flex-col justify-center items-center gap-12pxr mt-33pxr md:mt-60pxr">
          <span className="text-18pxr md:text-28pxr font-bold">
            작품 만들기
          </span>
          <span className="text-12pxr md:text-18pxr font-medium text-dark-gray-300">
            작품을 등록하고, 다양한 혜택과 함께 구독자를 만들어 보세요.
          </span>
        </div>
        {!isCpUser && <FormArea />}
      </div>
      <Modal size="sm" />
    </div>
  );
}
