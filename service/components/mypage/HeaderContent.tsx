import {
  useSelectProfileFile,
  useSelectUserInfo,
  useUserUpdateProfiles,
} from "@/app/api/query/mypage/user";
import { useUpdateUpload } from "@/app/api/query/upload";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { getFileName } from "@/utils/common";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import Button from "../common/Button";
import Modal from "../common/Modal";
import RoundBadge from "../common/RoundBadge";
import RequestEditorModal from "./RequestEditorModal";

const HeaderContent = () => {
  const { setModal } = useModalStore();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const selectProfileFile = useSelectProfileFile();
  const updateUpload = useUpdateUpload();
  const updateProfile = useUserUpdateProfiles();
  const { data: userInfo } = useSelectUserInfo();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleOpenModal = useCallback(() => {
    setModal(<RequestEditorModal />);
  }, [setModal]);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setToast({
          message: "JPG, PNG, GIF 파일만 업로드 가능합니다.",
          type: "error",
        });
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setToast({
          message: "파일 크기는 5MB 이하여야 합니다.",
          type: "error",
        });
        return;
      }

      try {
        setIsUploading(true);

        // Step 1: Get upload URL
        const res = await selectProfileFile.mutateAsync(getFileName(file));

        if (
          res?.data?.profileImageUploadPath &&
          res?.data?.profileImageFileId
        ) {
          // Step 2: Upload actual file to S3
          await updateUpload.mutateAsync({
            url: res.data.profileImageUploadPath,
            file: file,
            file_type: file.type,
          });

          // Step 3: Update profile with new image file ID
          if (userInfo?.data?.profileId) {
            await updateProfile.mutateAsync({
              id: userInfo.data.profileId,
              body: {
                profile_image_file_id: res.data.profileImageFileId,
              },
            });
          }

          setToast({
            message: "프로필 이미지가 업데이트되었습니다.",
            type: "success",
          });

          // Refetch user info to show new image
          queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });
          queryClient.invalidateQueries({ queryKey: ["selectUserProfiles"] });
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        setToast({
          message:
            error?.response?.data?.message ||
            "프로필 이미지 업로드에 실패했습니다.",
          type: "error",
        });
      } finally {
        setIsUploading(false);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [
      selectProfileFile,
      updateUpload,
      updateProfile,
      setToast,
      queryClient,
      userInfo?.data?.profileId,
    ]
  );

  return (
    <div className="pt-[33px] md:pt-[45px] px-4 pb-4 flex justify-between items-center">
      <div className="flex gap-14pxr items-center">
        <div className="relative">
          <div
            className="overflow-hidden rounded-full relative w-[36px] h-[36px] md:w-[60px] md:h-[60px]"
            onClick={() => router.push("/product/mypage/profile")}
          >
            <Image
              src={
                userInfo?.data.userProfileImagePath ||
                "/images/profile-default.svg"
              }
              alt="프로필 이미지"
              fill
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <label
            className={`absolute bottom-[-5px] right-[-5px] md:bottom-[-6px] md:right-[-6px] ${
              isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Image
              src={"/images/change-profile-pc.svg"}
              alt="프로필변경"
              width={34}
              height={28}
              className="hidden md:flex"
            />
            <Image
              src={"/images/change-profile-mobile.svg"}
              alt="프로필변경"
              width={22}
              height={22}
              className="flex md:hidden"
            />
          </label>
        </div>
        <div className="flex flex-col">
          <div
            className="flex items-center gap-1 text-18pxr md:text-22pxr font-semibold max-w-[500px] cursor-pointer"
            onClick={() => ""}
          >
            {userInfo?.data.userNickname
              ? userInfo?.data.userNickname + "님,"
              : ""}
            {["author", "CP", "editor"].includes(
              userInfo?.data.userRole as string
            ) && (
              <RoundBadge
                type={userInfo?.data.userRole as "author" | "CP" | "editor"}
                size="small"
              />
            )}
            {userInfo?.data.identityYn === "Y" && (
              <div className="w-fit h-[20px] rounded-full p-[2px]  text-[#2f7fff] text-10pxr flex gap-[2px] bg-[#DFEBFF] pr-1">
                <Image
                  src="/images/covid-check.svg"
                  alt="본인인증"
                  width={14}
                  height={14}
                />
                본인인증
              </div>
            )}
          </div>
          <span className="text-11pxr md:text-13pxr text-dark-gray-300 flex gap-[2px] mt-1">
            {"회원등급"}
            <Image
              src={
                userInfo?.data.userInterestLevelBadgeImagePath ||
                "/images/test/level.svg"
              }
              alt="작가 등급"
              width={12}
              height={14}
            />{" "}
            {"입니다"}
          </span>
        </div>
      </div>
      {!["editor", "CP"].includes(userInfo?.data?.userRole || "") &&
        userInfo?.data?.applyCPEditorYN === "N" && (
          <>
            <Button
              size="lg"
              className="hidden md:block"
              variant="black"
              onClick={handleOpenModal}
            >
              CP사 입점 신청
            </Button>
            <Button
              size="sm"
              className="block md:hidden"
              variant="black"
              onClick={handleOpenModal}
            >
              CP사 입점 신청
            </Button>
          </>
        )}
      <Modal size="full" />
    </div>
  );
};

export default HeaderContent;
