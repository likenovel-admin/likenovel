import { useChangeBookmark } from "@/app/api/query/bookmark";
import useAuthStore from "@/store/authStore";
import useToastStore from "@/store/toastStore";
import { setLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ActiveBookmark from "/public/images/active-bookmark.svg";
import WhiteBookmark from "/public/images/book-mark-white.svg";
import Bookmark from "/public/images/bookmark.svg";
interface Props {
  productId: number;
  bookmarkYn: "Y" | "N";
  buttonStyle?: string;
  bookmarkStyle?: string;
  activeBookmarkStyle?: string;
}
const BookmarkButton = ({
  productId,
  bookmarkYn,
  buttonStyle,
  bookmarkStyle,
  activeBookmarkStyle,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { setToast } = useToastStore();
  const { mutateAsync } = useChangeBookmark();
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(bookmarkYn === "Y");

  useEffect(() => {
    setIsBookmarked(bookmarkYn === "Y");
  }, [bookmarkYn]);

  const handleBookmarkClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
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
      const nextBookmarked = !isBookmarked;
      setIsBookmarked(nextBookmarked);
      const response = await mutateAsync(productId);
      const nextBookmarkYn = response?.data?.data?.bookmarkYn;
      if (nextBookmarkYn === "Y" || nextBookmarkYn === "N") {
        setIsBookmarked(nextBookmarkYn === "Y");
      }
      queryClient.invalidateQueries({
        queryKey: ["selectProductDetail", productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["selectBookmarks"],
      });
      setToast({
        message: (
          <span className="flex items-center gap-13pxr text-14pxr md:text-16pxr">
            <WhiteBookmark />
            {isBookmarked
              ? "선호작에서 삭제했습니다."
              : "선호작에 추가했습니다."}
          </span>
        ),
        type: "success",
        isShowIcon: false,
      });
    } catch (error) {
      setIsBookmarked(isBookmarked);
      setToast({
        message: "선호작 변경에 실패했습니다.",
        type: "error",
      });
    }
  };

  return (
    <button onClick={handleBookmarkClick} className={buttonStyle}>
      {/* Mobile version - Image */}
      <div className="block md:hidden">
        {isBookmarked ? (
          <Image
            src="/images/active-bookmark.svg"
            alt="북마크 활성"
            width={16}
            height={22}
            className={activeBookmarkStyle}
          />
        ) : (
          <Image
            src="/images/bookmark.svg"
            alt="북마크"
            width={16}
            height={22}
            className={bookmarkStyle}
          />
        )}
      </div>
      {/* Desktop version - SVG Component */}
      <div className="hidden md:block">
        {isBookmarked ? (
          <ActiveBookmark className={activeBookmarkStyle} />
        ) : (
          <Bookmark className={bookmarkStyle} />
        )}
      </div>
    </button>
  );
};
export default BookmarkButton;
