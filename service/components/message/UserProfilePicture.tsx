import Image from "next/image";
import { useState } from "react";

const UserProfilePicture = ({ picture }: { picture?: string }) => {
  const [isImageError, setIsImageError] = useState(false);
  return (
    <div className="rounded-full w-[34px] h-[34px] overflow-hidden">
      <Image
        src={
          isImageError || !picture
            ? "/images/message-default-picture.svg"
            : picture
        }
        alt="프로필"
        width={34}
        height={34}
        className="w-[34px] h-[34px] rounded-full object-cover"
        objectFit="contain"
        onError={() => setIsImageError(true)}
      />
    </div>
  );
};

export default UserProfilePicture;
