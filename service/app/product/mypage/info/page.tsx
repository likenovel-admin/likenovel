"use client";
import { useSelectUser } from "@/app/api/auth";
import { useUserSignoff } from "@/app/api/query/mypage/user";
import Spinner from "@/components/common/Spinner";
import UpdateMyInfoPassword from "@/components/mypage/UpdateMyInfoPassword";
import UpdateMyInfoSocial from "@/components/mypage/UpdateMyInfoSocial";
import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import useToastStore from "@/store/toastStore";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface NiceEncodeType {
  enc_data: string;
  integrity_value: string;
  token_version_id: string;
}

const Page = () => {
  const router = useRouter();
  const userSignoff = useUserSignoff();
  const { setConfirm } = useConfirmStore();
  const { setToast } = useToastStore();
  const { signOut } = useAuthStore();
  const { data: userData, isLoading } = useSelectUser();
  const isLikenovelLogin = userData?.data?.recentSignInType === "likenovel";

  const handleSignoff = () => {
    setConfirm({
      content: (
        <div className="flex flex-col gap-[5px]">
          <span className="text-15pxr md:text-18pxr font-bold text-center">
            정말로 회원탈퇴를 하시겠습니까?
          </span>
          <span className="text-13pxr md:text-14pxr text-gray-500 text-center">
            탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
          </span>
        </div>
      ),
      confirmText: "탈퇴하기",
      buttonCount: 2,
      onConfirm: async () => {
        await userSignoff.mutateAsync(undefined, {
          onSuccess: () => {
            setToast({
              message: "회원탈퇴가 완료되었습니다.",
              type: "success",
            });
            signOut();
            router.push("/");
          },
          onError: (error: any) => {
            setToast({
              message:
                error?.response?.data?.message ||
                "회원탈퇴에 실패했습니다. 다시 시도해주세요.",
              type: "error",
            });
          },
        });
      },
    });
  };

  return (
    <div className="pt-[30px] mb-[-102px] px-4 pb-[10px] md:pt-11 md:pb-8 flex md:items-center flex-col md:w-[555px] md:mx-auto">
      <span className="text-18pxr md:text-24pxr font-semibold pb-[10px] md:pb-8">
        내 정보 수정
      </span>
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {isLikenovelLogin ? <UpdateMyInfoPassword /> : <UpdateMyInfoSocial />}
          <div className="w-full border-t mt-10 md:hidden"></div>
          <button
            onClick={handleSignoff}
            className="gap-1 flex items-center text-gray-500 mt-5 md:self-start text-14pxr md:text-16pxr"
          >
            회원탈퇴
            <Image
              src="/images/arrow-right-small.svg"
              width={7}
              height={10}
              alt="회원탈퇴"
            />
          </button>
        </>
      )}
    </div>
  );
};

export default Page;
