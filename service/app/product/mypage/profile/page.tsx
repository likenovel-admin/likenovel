"use client";
import {
  useSelectUserInfo,
  useSelectUserProfiles,
  useUserDeleteProfile,
} from "@/app/api/query/mypage/user";
import RoundBadge from "@/components/common/RoundBadge";
import SimpleMenu from "@/components/common/SimpleMenu";
import Spinner from "@/components/common/Spinner";
// import AddProfileButton from "@/components/mypage/AddProfileButton";
import ProfileAddModal from "@/components/mypage/ProfileAddModal";
import ProfileItem from "@/components/mypage/ProfileItem";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

const Page = () => {
  const { setModal } = useModalStore();
  const { setConfirm, closeConfirm } = useConfirmStore();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const { data: profilesData, isLoading } = useSelectUserProfiles();
  const { data: userInfoData } = useSelectUserInfo();
  const profiles = profilesData?.data || [];
  const userRole = userInfoData?.data?.userRole || "user";
  const deleteProfile = useUserDeleteProfile();

  const getMaxProfileLimit = () => {
    // CP/Editor: max 3 profiles (2 regular + 1 admin-given)
    if (userRole === "author") {
      return 3;
    }
    // General member: max 2 profiles
    return 2;
  };

  const handleAddProfile = () => {
    const maxLimit = getMaxProfileLimit();

    if (profiles.length >= maxLimit) {
      setConfirm({
        content: `최대 ${maxLimit}개의 프로필만 생성할 수 있습니다.`,
        confirmText: "확인",
        buttonCount: 1,
      });
      return;
    }

    setModal(<ProfileAddModal />);
  };

  const handleDeleteProfile = (profileId: number) => {
    setConfirm({
      content: "프로필을 삭제하시겠습니까?",
      confirmText: "삭제",
      onConfirm: async () => {
        try {
          await deleteProfile.mutateAsync(profileId, {
            onSuccess: () => {
              setToast({
                message: "프로필이 삭제되었습니다.",
                type: "success",
              });
              queryClient.invalidateQueries({
                queryKey: ["selectUserProfiles"],
              });
              closeConfirm();
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message ||
                  "프로필 삭제에 실패하였습니다.",
                type: "error",
              });
              closeConfirm();
            },
          });
        } catch (error) {
          console.error("Profile delete error:", error);
        }
      },
      buttonCount: 2,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pt-7 px-4">
      <div className="flex justify-between">
        <div>
          <span className="text-18pxr font-semibold">프로필 관리</span>
          <ul className="list-outside list-disc gap-2 ml-3 mt-1 text-gray-600 text-11pxr">
            <li>
              한글/영문/숫자만 사용할 수 있으며, 이메일 아이디와 동일한 문자열은
              사용이 불가해요.
            </li>
            <li className="list-none">* 프로필 용량은 ~까지 가능합니다</li>
            <li>대표 프로필은 이벤트 결과 공지에 사용됩니다.</li>
          </ul>
        </div>
        {/* <div className="hidden md:block">
          <AddProfileButton onAddProfile={handleAddProfile} />
        </div> */}
      </div>
      <ul className="flex flex-col md:flex-row gap-4 mt-8 md:flex-wrap">
        {profiles.map((profile) => (
          <li key={profile.profileId} className="md:min-w-[350px] flex-1">
            <ProfileItem
              profileId={profile.profileId}
              picture={
                profile.userProfileImagePath || "/images/profile-default.svg"
              }
              badgeContent={[
                profile.userRole === "author" && (
                  <RoundBadge type="author" size="small" key="author" />
                ),
                profile.defaultYn === "Y" && (
                  <RoundBadge type="author" size="small" key="default" />
                ),
              ].filter(Boolean)}
              title={profile.userNickname}
              gradeContent={[
                profile.userInterestLevelBadgeImagePath && (
                  <Image
                    key="interest"
                    src={profile.userInterestLevelBadgeImagePath}
                    alt="관심 등급"
                    width={24}
                    height={28}
                  />
                ),
                profile.userEventLevelBadgeImagePath && (
                  <Image
                    key="event"
                    src={profile.userEventLevelBadgeImagePath}
                    alt="이벤트 등급"
                    width={24}
                    height={28}
                  />
                ),
              ].filter(Boolean)}
              rightContent={
                <SimpleMenu
                  menuList={[
                    {
                      title: "수정",
                      onClick: () => {
                        setModal(
                          <ProfileAddModal profileId={profile.profileId} />
                        );
                      },
                    },
                    // {
                    //   title: "삭제",
                    //   onClick: () => handleDeleteProfile(profile.profileId),
                    // },
                  ]}
                />
              }
            />
          </li>
        ))}
      </ul>
      {/* <div className="md:hidden">
        <AddProfileButton onAddProfile={handleAddProfile} />
      </div> */}
    </div>
  );
};

export default Page;
