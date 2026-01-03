import { ReactNode } from "react";
import ProfilePictureUpdate from "./ProfilePictureUpdate";
interface ProfileItemProps {
  picture?: string;
  title: string;
  badgeContent: ReactNode | ReactNode[];
  rightContent: ReactNode;
  gradeContent?: ReactNode | ReactNode[];
  profileId?: number;
  nickname?: string;
  eventBadgeYn?: "Y" | "N";
  interestBadgeYn?: "Y" | "N";
  defaultYn?: "Y" | "N";
}
const ProfileItem = ({
  picture,
  badgeContent,
  rightContent,
  title,
  gradeContent,
  profileId,
  nickname,
  eventBadgeYn,
  interestBadgeYn,
  defaultYn,
}: ProfileItemProps) => {
  return (
    <div className="flex flex-col border h-fit rounded-2xl pl-3 py-4 md:pl-5 md:py7 pr-3 gap-4">
      <div className="flex justify-between w-full">
        <div className="flex gap-1">{badgeContent}</div>
        {rightContent}
      </div>
      <div className="m-auto flex flex-col justify-center items-center gap-2">
        <ProfilePictureUpdate
          picture={picture}
          profileId={profileId}
          currentNickname={nickname}
          currentEventBadgeYn={eventBadgeYn}
          currentInterestBadgeYn={interestBadgeYn}
          currentDefaultYn={defaultYn}
        />
        <div className="flex flex-1 flex-col my-auto">
          <div className="text-12pxr md:text-16pxr text-gray-600">{title}</div>
        </div>
        <div className="flex gap-1">{gradeContent}</div>
      </div>
    </div>
  );
};

export default ProfileItem;
