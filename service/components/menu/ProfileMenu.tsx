import Check from "@/public/images/check.svg";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import Button from "../common/Button";
import ModalContainer from "../common/ModalContainer";
import RoundBadge from "../common/RoundBadge";
import UserNickname from "../common/UserNickname";

const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => {
    setIsOpen(false);
  };
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mr-3 flex justify-center items-center w-[28px] h-[28px] border rounded-full hover:text-primary-100"
      >
        <Image
          src="/images/refresh-two-arrow.svg"
          alt="프로필 변경"
          width={13}
          height={13}
        />
      </button>
      <ProfileModal isOpen={isOpen} onClose={onClose} />
    </>
  );
};

const ProfileModal = ({ isOpen, onClose }: CommonModalProps) => {
  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return [
        {
          id: 1,
          name: "홍길동",
          profileImage: "/images/test/pic1.png",
          levelImage: "/images/test/level.svg",
        },
        {
          id: 2,
          name: "김철수",
          profileImage: "/images/test/pic1.png",
          levelImage: "/images/test/level.svg",
        },
        {
          id: 3,
          name: "김철수",
          profileImage: "/images/test/pic2.png",
          levelImage: "/images/test/level.svg",
        },
      ];
    },
  });
  const [selectedProfileId, setSelectedProfileId] = useState(data?.[0].id);
  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      title="프로필 변경"
      usePortal={false}
    >
      <div className="flex flex-col h-full md:w-[500px]">
        <div className="flex flex-col p-4 gap-4 md:bg-light-gray-100">
          {data?.map((profile) => (
            <ProfileItem
              key={profile.id}
              {...profile}
              isSelected={selectedProfileId === profile.id}
              setSelectedProfileId={setSelectedProfileId}
            />
          ))}
        </div>
        <div className="flex justify-end p-4 mt-auto sticky bottom-0">
          <Button variant="black" className="w-full" onClick={onClose}>
            확인
          </Button>
        </div>
      </div>
    </ModalContainer>
  );
};

interface ProfileItemProps {
  id: number;
  name: string;
  profileImage: string;
  levelImage: string;
  isSelected: boolean;
  setSelectedProfileId: (id: number) => void;
}
const ProfileItem = ({
  id,
  levelImage,
  name,
  profileImage,
  isSelected,
  setSelectedProfileId,
}: ProfileItemProps) => {
  const handleSelect = () => {
    setSelectedProfileId(id);
  };
  return (
    <label
      className="cursor-pointer bg-white flex items-center justify-center md:flex-col md:items-start gap-4 relative p-5 md:py-4 py-8 border rounded-xl"
      onClick={handleSelect}
    >
      <div className="flex gap-1 absolute top-4 left-4 md:top-0 md:left-0 md:relative">
        <RoundBadge type="author" />
        <RoundBadge
          type="custom"
          className="px-1"
          color="bg-black-100"
          text="대표"
        />
        <RoundBadge
          type="custom"
          className="px-1"
          color="bg-[#F87211]"
          text="편집자"
        />
        <RoundBadge
          type="custom"
          className="px-1"
          color="bg-[#386FD9]"
          text="개인"
        />
        <RoundBadge
          type="custom"
          className="px-1"
          color="bg-[#8D42EC]"
          text="CP"
        />
      </div>
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="relative">
          <div className="relative w-[60px] h-[60px] rounded-full overflow-hidden">
            <Image src={profileImage} alt="프로필" fill />
          </div>
          <button
            className="absolute bottom-1 right-[-8px]"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Image
              src={"/images/picture.svg"}
              alt="레벨"
              width={28}
              height={28}
            />
          </button>
        </div>
        <UserNickname
          userNickname={name}
          product={
            {
              badge: {
                authorEventLevelBadgeImagePath: levelImage,
              },
            } as any
          }
        />
        <div
          className={`w-8 h-8 ${
            isSelected ? "bg-primary-100" : "border bg-white"
          }  rounded-full absolute md:top-[35%] top-4 right-4 flex items-center justify-center`}
        >
          <Check
            className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-400"}`}
          />
        </div>
      </div>
    </label>
  );
};

export default ProfileMenu;
