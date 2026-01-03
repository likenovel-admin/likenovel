import Image from "next/image";
import { useCallback } from "react";

interface AddProfileButtonProps {
  onAddProfile?: () => void;
}

const AddProfileButton = ({ onAddProfile }: AddProfileButtonProps) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onAddProfile) {
        onAddProfile();
      }
    },
    [onAddProfile]
  );

  return (
    <div>
      <button
        onClick={handleClick}
        className="text-13pxr cursor-pointer text-dark-gray-500 h-11 flex gap-3 items-center justify-center w-full rounded-full bg-light-gray-100 md:bg-transparent mt-5"
      >
        프로필 추가
        <div className="w-6 h-6 bg-white flex items-center justify-center rounded-full border border-gray-300">
          <Image
            src="/images/plus-round.svg"
            alt="plus"
            width={10}
            height={10}
          />
        </div>
      </button>
    </div>
  );
};

export default AddProfileButton;
