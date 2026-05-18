import {
  useCheckNickNameDuplicate,
  usePurchaseNicknameChange,
  useSelectProfileFile,
  useSelectUserProfileDetail,
  useUserAddProfiles,
  useUserUpdateProfiles,
} from "@/app/api/query/mypage/user";
import { useUpdateUpload } from "@/app/api/query/upload";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Button from "../common/Button";
import Spinner from "../common/Spinner";
import BottomButton from "../form/bottomButton";
import CheckboxGroup from "../form/checkbox/CheckboxGroup";
import { default as Input } from "../form/input";
import Toggle from "../form/toggle";
import ConfirmChangeNickNameModal from "./ConfirmChangeNickNameModal";

interface FormData {
  nickname: string;
  badge: string[];
  isDefault: boolean;
  profileImage?: File;
}

interface ProfileAddModalProps {
  profileId?: number | string;
}

const ProfileAddModal = ({ profileId }: ProfileAddModalProps) => {
  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr";
  const inputTextClassName =
    "text-12pxr md:text-14pxr h-44pxr md:h-44pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-8pxr";

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>();
  const { setToast } = useToastStore();
  const { closeModal } = useModalStore();
  const queryClient = useQueryClient();
  const addProfile = useUserAddProfiles();
  const updateProfile = useUserUpdateProfiles();
  const selectProfileFile = useSelectProfileFile();
  const updateUpload = useUpdateUpload();
  const purchaseNicknameChange = usePurchaseNicknameChange();
  const { mutateAsync: checkNicknameMutate, isPending } =
    useCheckNickNameDuplicate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string>(
    "/images/profile-default.svg"
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isCheckedNickname, setIsCheckedNickname] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [originalNickname, setOriginalNickname] = useState<string>("");
  const [nicknameChangeableCount, setNicknameChangeableCount] =
    useState<number>(3);
  const [showConfirmChangeNickname, setShowConfirmChangeNickname] =
    useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const isEditMode = !!profileId;

  const handleCloseModal = () => {
    setIsCheckedNickname(false);
    setShowSuccessMessage(false);
    setOriginalNickname("");
    setPreviewImage("/images/profile-default.svg");
    setUploadedFile(null);
    reset();
    closeModal();
  };

  // Fetch profile detail if editing
  const { data: profileDetailData } = useSelectUserProfileDetail(
    profileId || 0
  );

  // Set form data when profile detail is loaded
  useEffect(() => {
    if (profileDetailData?.data) {
      const profile = profileDetailData.data;
      const badges: string[] = [];

      if (profile.userEventLevelBadgeImagePath) badges.push("guardian1");
      if (profile.userInterestLevelBadgeImagePath) badges.push("guardian2");

      reset({
        nickname: profile.userNickname,
        badge: badges,
        isDefault: profile.defaultYn === "Y",
      });

      // Save original nickname for comparison
      setOriginalNickname(profile.userNickname);
      setNicknameChangeableCount(profile.nicknameChangeableCount);

      if (profile.userProfileImagePath) {
        setPreviewImage(profile.userProfileImagePath);
      }
    }
  }, [profileDetailData, reset]);

  // Reset nickname check when nickname changes
  useEffect(() => {
    const currentNickname = watch("nickname");
    // If editing and nickname is same as original, mark as checked
    if (isEditMode && currentNickname === originalNickname) {
      setIsCheckedNickname(true);
      setShowSuccessMessage(false); // Don't show success message for original nickname
    } else {
      setIsCheckedNickname(false);
      setShowSuccessMessage(false);
    }
  }, [watch("nickname"), isEditMode, originalNickname]);

  const getFileName = (file: File) => {
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    return `profile_${timestamp}.${extension}`;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

    // Set preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    setUploadedFile(file);
    setValue("profileImage", file);
  };

  const performSubmit = async (data: FormData) => {
    try {
      let profileImageFileId: number | undefined;

      // Upload profile image if exists
      if (uploadedFile) {
        // Step 1: Get upload URL
        const res = await selectProfileFile.mutateAsync(
          getFileName(uploadedFile)
        );

        if (
          res?.data?.profileImageUploadPath &&
          res?.data?.profileImageFileId
        ) {
          // Step 2: Upload actual file to S3
          await updateUpload.mutateAsync({
            url: res.data.profileImageUploadPath,
            file: uploadedFile,
            file_type: uploadedFile.type,
          });

          profileImageFileId = res.data.profileImageFileId;
        }
      }

      // Step 3: Create or Update profile
      const badges = data.badge || [];
      const requestBody = {
        user_nickname: data.nickname,
        event_badge_yn: badges.includes("guardian1") ? "Y" : ("N" as "Y" | "N"),
        interest_badge_yn: badges.includes("guardian2")
          ? "Y"
          : ("N" as "Y" | "N"),
        default_yn: data.isDefault ? "Y" : ("N" as "Y" | "N"),
        ...(profileImageFileId && {
          profile_image_file_id: profileImageFileId,
        }),
      };

      if (isEditMode) {
        // Update existing profile
        await updateProfile.mutateAsync(
          {
            id: profileId!,
            body: requestBody,
          },
          {
            onSuccess: () => {
              setToast({
                message: "프로필이 수정되었습니다.",
                type: "success",
              });
              // Refetch profiles to show updated profile
              queryClient.invalidateQueries({
                queryKey: ["selectUserProfiles"],
              });
              queryClient.invalidateQueries({
                queryKey: ["selectUserProfileDetail", profileId],
              });
              queryClient.invalidateQueries({
                queryKey: ["selectUserInfo"],
              });
              handleCloseModal();
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message ||
                  "프로필 수정에 실패하였습니다.",
                type: "error",
              });
            },
          }
        );
      } else {
        // Add new profile
        await addProfile.mutateAsync(
          {
            ...requestBody,
            profile_image_file_id: profileImageFileId || 0,
          },
          {
            onSuccess: () => {
              setToast({
                message: "프로필이 추가되었습니다.",
                type: "success",
              });
              // Refetch profiles to show new profile
              queryClient.invalidateQueries({
                queryKey: ["selectUserProfiles"],
              });
              handleCloseModal();
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message ||
                  "프로필 추가에 실패하였습니다.",
                type: "error",
              });
            },
          }
        );
      }
    } catch (error) {
      console.error("Profile save error:", error);
      setToast({
        message: isEditMode
          ? "프로필 수정에 실패했습니다."
          : "프로필 추가에 실패했습니다.",
        type: "error",
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    // Check if nickname changed and nicknameChangeableCount is 0
    if (
      isEditMode &&
      data.nickname !== originalNickname &&
      nicknameChangeableCount === 0
    ) {
      // Show confirm modal for purchasing nickname change
      setPendingFormData(data);
      setShowConfirmChangeNickname(true);
      return;
    }

    // Proceed with normal submit
    await performSubmit(data);
  };

  const handleConfirmChangeNickname = async () => {
    setShowConfirmChangeNickname(false);
    if (pendingFormData) {
      try {
        // Call purchase nickname change API first
        await purchaseNicknameChange.mutateAsync(profileId!);

        // If purchase successful, proceed with profile update
        await performSubmit(pendingFormData);
        setPendingFormData(null);
      } catch (error: any) {
        // Show error toast if purchase fails
        setToast({
          message:
            error?.response?.data?.message ||
            "닉네임 변경권 구매에 실패했습니다.",
          type: "error",
        });
        setPendingFormData(null);
      }
    }
  };

  const handleCancelChangeNickname = () => {
    setShowConfirmChangeNickname(false);
    setPendingFormData(null);
  };

  const onCheckNickname = async (nickname: string) => {
    try {
      await checkNicknameMutate({ user_nickname: nickname });
      setIsCheckedNickname(true);
      setShowSuccessMessage(true); // Show success message after successful check
      clearErrors("nickname");
      return true;
    } catch (error: any) {
      setIsCheckedNickname(false);
      setShowSuccessMessage(false);
      setError("nickname", {
        type: "manual",
        message: error?.response?.data?.message || "사용중인 닉네임입니다.",
      });
      return false;
    }
  };

  const validateNickname = async (nickname: string) => {
    if (!nickname || nickname.trim() === "") {
      setError("nickname", {
        type: "manual",
        message: "닉네임을 입력해주세요.",
      });
      return false;
    }

    // Check Korean, English, numbers only
    // if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname)) {
    //   setError("nickname", {
    //     type: "manual",
    //     message: "닉네임은 한글/영문/숫자만 사용할 수 있습니다.",
    //   });
    //   return false;
    // }

    // Skip duplicate check if editing and nickname is same as original
    if (isEditMode && nickname === originalNickname) {
      setIsCheckedNickname(true);
      clearErrors("nickname");
      return true;
    }

    return await onCheckNickname(nickname);
  };

  const onError = (errors: any) => {
    console.log("errors", errors);
  };

  console.log(
    " !!errors.nickname || isCheckedNickname || showSuccessMessage",
    !!errors.nickname,
    isCheckedNickname,
    showSuccessMessage
  );

  return (
    <>
      <form className="h-full">
        <div className="h-full overflow-y-auto">
          <div className="px-4 md:px-11 pb-4 md:pb-5 md:w-[550px]">
            <div className="text-black-100 text-20pxr md:text-22pxr font-bold gap-3 flex flex-col">
              {isEditMode ? "프로필 수정" : "프로필 추가"}
              <ul className="flex flex-col ml-3 text-gray-500">
                <li className="text-12pxr md:text-14pxr font-normal list-disc list-outside">
                  닉네임은 한글/영문/숫자만 사용할 수 있으며, 이메일 아이디와
                  동일한 문자열은 사용이 불가해요.
                </li>
                <li className="text-12pxr md:text-14pxr font-normal ml-[-12px]">
                  * 프로필 용량은 ~까지 가능합니다
                </li>
              </ul>
            </div>
          </div>
          <div className="h-[10px] bg-light-gray-100 "></div>
          <div className="flex justify-center items-center mt-7 gap-7 flex-col px-4 md:px-11 pb-4 md:pb-5 ">
            <div className="relative w-fit">
              <div className="w-[80px] h-[80px] md:w-[80px] md:h-[80px] overflow-hidden rounded-full relative">
                <Image
                  src={previewImage}
                  alt={"프로필 사진"}
                  fill
                  className="object-cover"
                />
              </div>
              <label className="w-8 h-8 absolute overflow-hidden rounded-full right-[-4px] bottom-[-4px] cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleFileChange}
                />
                <Image src={"/images/picture.svg"} alt="사진 변경" fill />
              </label>
            </div>
            <div className="flex items-end gap-1 w-full">
              <Input
                label="닉네임"
                {...register("nickname", {
                  required: "닉네임을 입력해주세요.",
                  validate: async () => {
                    if (!isCheckedNickname) {
                      return "닉네임 중복확인이 필요합니다.";
                    }
                    return true;
                  },
                })}
                placeholder="닉네임을 입력해주세요"
                labelStyle={labelClassName}
                inputStyle={inputTextClassName}
                full
                isError={!!errors.nickname}
                errorText={errors.nickname?.message}
                successText={showSuccessMessage && "사용 가능한 닉네임입니다."}
                additionalText={
                  <div className="flex gap-1 items-center mr-0 md:mr-3">
                    {/* {isEditMode && (
                    <span className="text-gray-300 text-13pxr">
                      <span className="text-dark-gray-500">
                        {nicknameChangeableCount}
                      </span>{" "}
                      / 3회
                    </span>
                  )} */}
                    <Button
                      variant="black"
                      type="button"
                      className={`h-[44px] mt-auto text-14pxr block md:hidden px-0 py-0 min-w-[74px] whitespace-nowrap ${
                        !!errors.nickname || showSuccessMessage
                          ? "mt-auto md:mb-26pxr"
                          : "mt-auto"
                      }`}
                      size={"md"}
                      onClick={() => validateNickname(watch("nickname"))}
                      disabled={
                        isPending ||
                        (isEditMode && watch("nickname") === originalNickname)
                      }
                    >
                      {isPending ? (
                        <Spinner color="#FFFFFF" size={20} />
                      ) : (
                        "중복확인"
                      )}
                    </Button>
                  </div>
                }
              />
              <Button
                type="button"
                variant="black"
                className={`mt-auto min-w-[74px] px-0 py-0 h-[44px] text-14pxr hidden md:block whitespace-nowrap ${
                  !!errors.nickname || showSuccessMessage
                    ? "mb-26pxr"
                    : "mt-auto"
                }`}
                size={"md"}
                onClick={() => validateNickname(watch("nickname"))}
                disabled={
                  isPending ||
                  (isEditMode && watch("nickname") === originalNickname)
                }
              >
                {isPending ? <Spinner color="#FFFFFF" size={20} /> : "중복확인"}
              </Button>
            </div>
            <div className="flex justify-start w-full">
              <Controller
                control={control}
                name="badge"
                render={({ field }) => (
                  <CheckboxGroup
                    {...field}
                    onChange={(selectedValues) => {
                      field.onChange(selectedValues);
                    }}
                    type="square"
                    selectedValues={field.value ?? []}
                    checkboxClassName="border-0 px-0 gap-0"
                    className="gap-5"
                    options={[
                      {
                        label: (
                          <div className="ml-[-12px] text-black-100 font-normal text-14pxr flex gap-2 mr-3">
                            수호자
                          </div>
                        ),
                        value: "guardian1",
                      },
                      {
                        label: (
                          <div className="ml-[-12px] text-black-100 font-normal text-14pxr flex gap-2 mr-3">
                            수호자
                          </div>
                        ),
                        value: "guardian2",
                      },
                      {
                        label: (
                          <div className="ml-[-12px] text-black-100 font-normal text-14pxr flex gap-2 mr-3">
                            뱃지 미사용
                          </div>
                        ),
                        value: "nobadge",
                      },
                    ]}
                  />
                )}
              />
            </div>
            <div className="flex justify-start w-full">
              <Controller
                control={control}
                name="isDefault"
                defaultValue={false}
                render={({ field }) => (
                  <Toggle
                    label="대표프로필 설정"
                    labelStyle={labelClassName}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        <BottomButton
          disabled={
            addProfile.isPending ||
            updateProfile.isPending ||
            selectProfileFile.isPending ||
            updateUpload.isPending ||
            purchaseNicknameChange.isPending
          }
          onCancelClick={handleCloseModal}
          onSubmitClick={handleSubmit(onSubmit, onError)}
          submitText={isEditMode ? "수정" : "등록"}
        />
      </form>

      {showConfirmChangeNickname && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-[20px] w-full md:w-[420px] mx-4 flex items-center justify-center overflow-hidden">
            <ConfirmChangeNickNameModal
              onConfirm={handleConfirmChangeNickname}
              onCancel={handleCancelChangeNickname}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileAddModal;
