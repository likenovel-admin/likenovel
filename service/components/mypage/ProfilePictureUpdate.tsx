"use client";

import {
  useSelectProfileFile,
  useUserUpdateProfiles,
} from "@/app/api/query/mypage/user";
import { useUpdateUpload } from "@/app/api/query/upload";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { ChangeEvent, useState } from "react";

interface IProfilePictureUpdate {
  picture?: string;
  profileId?: number;
  currentNickname?: string;
  currentEventBadgeYn?: "Y" | "N";
  currentInterestBadgeYn?: "Y" | "N";
  currentDefaultYn?: "Y" | "N";
  onUploadSuccess?: (fileId: number, imageUrl: string) => void;
}

const ProfilePictureUpdate = ({
  picture = "/images/profile-default.svg",
  profileId,
  currentNickname,
  currentEventBadgeYn = "N",
  currentInterestBadgeYn = "N",
  currentDefaultYn = "N",
  onUploadSuccess,
}: IProfilePictureUpdate) => {
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const selectProfileFile = useSelectProfileFile();
  const updateUpload = useUpdateUpload();
  const updateProfile = useUserUpdateProfiles();
  const [previewImage, setPreviewImage] = useState<string>(picture);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<string | null>(null);

  const getFileName = (file: File) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    return `profile_${timestamp}_${randomString}.${extension}`;
  };

  console.log("profileId", profileId);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if same file was already uploaded
    const fileIdentifier = `${file.name}-${file.size}-${file.lastModified}`;
    if (lastUploadedFile === fileIdentifier) {
      setToast({
        message: "이미 업로드한 파일입니다. 다른 파일을 선택해주세요.",
        type: "warning",
      });
      // Reset input to allow re-selecting
      e.target.value = "";
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setToast({
        message: "JPG, PNG, GIF 파일만 업로드 가능합니다.",
        type: "error",
      });
      e.target.value = "";
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setToast({
        message: "파일 크기는 5MB 이하여야 합니다.",
        type: "error",
      });
      e.target.value = "";
      return;
    }

    // Set preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setIsUploading(true);

      // Step 1: Get upload URL
      const res = await selectProfileFile.mutateAsync(getFileName(file));

      if (res?.data?.profileImageUploadPath && res?.data?.profileImageFileId) {
        // Step 2: Upload actual file to S3
        await updateUpload.mutateAsync({
          url: res.data.profileImageUploadPath,
          file: file,
          file_type: file.type,
        });

        // Step 3: Update profile with new image file ID (if profileId provided)
        if (profileId) {
          await updateProfile.mutateAsync({
            id: profileId,
            body: {
              // user_nickname: "admin2",
              // event_badge_yn: "Y",
              // interest_badge_yn: "Y",
              // default_yn: "Y",
              profile_image_file_id: res.data.profileImageFileId,
            },
          });

          // Invalidate queries to refresh profile data
          queryClient.invalidateQueries({
            queryKey: ["selectUserProfiles"],
          });
          queryClient.invalidateQueries({
            queryKey: ["selectUserInfo"],
          });
          queryClient.invalidateQueries({
            queryKey: ["selectUserProfileDetail", profileId],
          });
        }

        setToast({
          message: "프로필 사진이 업로드되었습니다.",
          type: "success",
        });

        // Save uploaded file identifier to prevent duplicate upload
        setLastUploadedFile(fileIdentifier);

        // Callback with file ID if provided
        if (onUploadSuccess) {
          onUploadSuccess(
            res.data.profileImageFileId,
            res.data.profileImageUploadPath
          );
        }
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      setToast({
        message: "프로필 사진 업로드에 실패했습니다.",
        type: "error",
      });
      // Reset preview to original
      setPreviewImage(picture);
    } finally {
      setIsUploading(false);
      // Reset input value to allow uploading different file
      e.target.value = "";
    }
  };

  return (
    <div className="relative w-fit">
      <div className="w-[80px] h-[80px] md:w-[80px] md:h-[80px] overflow-hidden rounded-full relative">
        <Image
          src={previewImage}
          alt={"프로필 사진"}
          fill
          className="rounded-full object-cover"
        />
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <label className="w-8 h-8 absolute overflow-hidden rounded-full right-[-4px] bottom-[-4px] cursor-pointer">
        <input
          type="file"
          hidden
          accept="image/jpeg,image/jpg,image/png,image/gif"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Image src={"/images/picture.svg"} alt="사진 변경" fill />
      </label>
    </div>
  );
};

export default ProfilePictureUpdate;
