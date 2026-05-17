import BookmarkButton from "@/components/common/BookmarkButton";
import LikeButton from "@/components/menu/LikeButton";
import WebsochatButton from "@/components/menu/WebsochatButton";
import useViewStore from "@/store/viewerStore";
import Image from "next/image";
import ArrowLeft from "/public/images/arrow-left-medium.svg";
import ArrowRight from "/public/images/arrow-right-medium.svg";
interface Props {
  showNav?: boolean;
  handleNavigateNextChap: () => void;
  handleNavigatePrevChap: () => void;
  previousEpisodeId?: number;
  nextEpisodeId?: number;
  commentCount?: number;
  productId?: number;
  bookmarkYn?: "Y" | "N";
  likedYN?: "Y" | "N";
  handleCommentState?: () => void;
  showWebsochatButton?: boolean;
  handleWebsochatClick?: () => void;
}

const ViewerBottomNav = ({
  showNav,
  handleNavigateNextChap,
  handleNavigatePrevChap,
  previousEpisodeId,
  nextEpisodeId,
  commentCount,
  productId,
  bookmarkYn,
  likedYN,
  handleCommentState,
  showWebsochatButton,
  handleWebsochatClick,
}: Props) => {
  const { settings } = useViewStore((state) => ({
    settings: state.settings,
  }));
  return (
    <div
      className={`flex fixed bottom-0 left-0 z-50 w-full h-[calc(60px+env(safe-area-inset-bottom))] items-center justify-between px-[16px] pb-[env(safe-area-inset-bottom)] md:h-[60px] md:px-[120px] md:pb-0 ${
        showNav
          ? "bg-white"
          : settings.theme === "dark"
          ? "bg-dark-theme-bg"
          : settings.theme === "green"
          ? "bg-green-theme-bg"
          : settings.theme === "blue"
          ? "bg-blue-theme-bg"
          : "bg-light-theme-bg"
      }`}
    >
      {showNav && (
        <>
          <div className="flex md:hidden items-center gap-16pxr min-[390px]:gap-[22px]">
            <button className=" relative" onClick={handleCommentState}>
              <Image
                src="/images/comment.svg"
                alt="댓글"
                width={22}
                height={22}
              />
              {commentCount && commentCount > 0 ? (
                <span className="absolute -top-[8px] -right-[13px] min-w-[22px] h-[16px] px-[5px] rounded-[100px] bg-[#111317] text-white text-[11px] flex items-center justify-center font-medium">
                  {commentCount > 99 ? "99+" : commentCount}
                </span>
              ) : null}
            </button>
            <div className="">
              <LikeButton
                likeYN={likedYN || "N"}
                buttonStyle=""
                likeStyle="w-[24px] h-[22px] text-dark-gray-500 hover:text-dark-gray-600"
                activeLikeStyle="w-[24px] h-[22px]"
              />
            </div>
            <div className="flex items-center gap-10pxr">
              <BookmarkButton
                productId={productId || 0}
                bookmarkYn={bookmarkYn || "N"}
                buttonStyle=""
                bookmarkStyle="w-[16px] h-[22px] text-dark-gray-500 hover:text-dark-gray-600"
                activeBookmarkStyle="w-[16px] h-[22px]"
              />
              {showWebsochatButton && (
                <WebsochatButton
                  label="웹소챗"
                  onClick={handleWebsochatClick}
                  className="h-42pxr min-w-[104px] px-14pxr text-15pxr [&>svg]:h-18pxr [&>svg]:w-18pxr min-[390px]:min-w-[112px] min-[390px]:px-16pxr"
                />
              )}
            </div>
          </div>
          <button
            onClick={handleNavigatePrevChap}
            disabled={!previousEpisodeId}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="hidden md:flex items-center gap-4">
              <ArrowLeft className="w-[10px] h-[18px] text-black-200" />
              <span className="text-15pxr">이전화</span>
            </div>
          </button>
          {showWebsochatButton && (
            <WebsochatButton
              label="이번 회차로 웹소챗"
              onClick={handleWebsochatClick}
              className="hidden h-40pxr min-w-[172px] px-22pxr text-15pxr md:inline-flex"
            />
          )}
          <button
            onClick={handleNavigateNextChap}
            disabled={!nextEpisodeId}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="hidden md:flex items-center gap-4">
              <span className="text-15pxr">다음화</span>
              <ArrowRight className="w-[10px] h-[18px] text-black-200" />
            </div>
          </button>
          <div className="flex md:hidden gap-12pxr min-[390px]:gap-20pxr">
            <button
              onClick={handleNavigatePrevChap}
              disabled={!previousEpisodeId}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-5pxr">
                <ArrowLeft className="w-[7px] h-[12px] text-black-200" />
                <span className="text-13pxr">이전화</span>
              </div>
            </button>
            <button
              onClick={handleNavigateNextChap}
              disabled={!nextEpisodeId}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-5pxr">
                <span className="text-13pxr">다음화</span>
                <ArrowRight className="w-[7px] h-[12px] text-black-200" />
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
export default ViewerBottomNav;
