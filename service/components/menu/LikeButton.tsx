import { useLikeEpisode, useUnLikeEpisode } from "@/app/api/query/episode";
import useAuthStore from "@/store/authStore";
import useToastStore from "@/store/toastStore";
import { setLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThumbsUpBlue from "/public/images/thumbs-up-blue.svg";
import ThumbsUp from "/public/images/thumbs-up.svg";

interface Props {
  likeYN: "Y" | "N";
  buttonStyle?: string;
  likeStyle?: string;
  activeLikeStyle?: string;
}
const LikeButton = ({
  likeYN,
  buttonStyle,
  likeStyle,
  activeLikeStyle,
}: Props) => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/");
  const episodeId = Number(pathSegments[pathSegments.length - 1]);

  const router = useRouter();
  const { setToast } = useToastStore();
  const likeEpisode = useLikeEpisode();
  const unLikeEpisode = useUnLikeEpisode();
  const { isAuthenticated } = useAuthStore();

  const [isLiked, setIsLiked] = useState(likeYN === "Y");

  useEffect(() => {
    setIsLiked(likeYN === "Y");
  }, [likeYN]);

  const handleLikeClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      // Save current page before redirecting to login
      const currentPath = window.location.pathname + window.location.search;
      setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);

      router.push(`/login?modal=open`, {
        scroll: false,
      });
      return;
    }
    try {
      setIsLiked(!isLiked);
      if (!isLiked) {
        await likeEpisode.mutateAsync(episodeId);
        setToast({
          message: "좋아요를 눌렀습니다.",
          type: "success",
          isShowIcon: false,
        });
      } else {
        await unLikeEpisode.mutateAsync(episodeId);
        setToast({
          message: "좋아요를 취소했습니다.",
          type: "success",
          isShowIcon: false,
        });
      }
    } catch (error) {
      setToast({
        message: "선호작 변경에 실패했습니다.",
        type: "error",
      });
    }
  };

  return (
    <button onClick={handleLikeClick} className={buttonStyle}>
      {/* Mobile version - Image */}
      <div className="block md:hidden">
        {isLiked ? (
          <Image
            src="/images/thumbs-up-blue.svg"
            alt="좋아요"
            width={24}
            height={22}
            className={activeLikeStyle}
          />
        ) : (
          <Image
            src="/images/thumbs-up.svg"
            alt="좋아요"
            width={24}
            height={22}
            className={likeStyle}
          />
        )}
      </div>
      {/* Desktop version - SVG Component */}
      <div className="hidden md:block">
        {isLiked ? (
          <ThumbsUpBlue className={activeLikeStyle} />
        ) : (
          <ThumbsUp className={likeStyle} />
        )}
      </div>
    </button>
  );
};
export default LikeButton;
