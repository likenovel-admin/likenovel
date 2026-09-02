import BookmarkButton from "@/components/common/BookmarkButton";
import LikeButton from "@/components/menu/LikeButton";
import WebsochatButton from "@/components/menu/WebsochatButton";
import useViewStore from "@/store/viewerStore";
import type { ViewerWebsochatButtonState } from "@/utils/websochatLaunch";
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
  websochatButtonState?: ViewerWebsochatButtonState;
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
  websochatButtonState,
  handleWebsochatClick,
}: Props) => {
  const { settings } = useViewStore((state) => ({
    settings: state.settings,
  }));
  const shouldShowWebsochatButton = websochatButtonState
    ? websochatButtonState !== "hidden"
    : !!showWebsochatButton;
  const isWebsochatPending = websochatButtonState === "pending";
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
          <div className="flex w-full md:hidden items-center justify-between gap-4pxr">
            <button
              onClick={handleNavigatePrevChap}
              disabled={!previousEpisodeId}
              className="flex h-40pxr shrink-0 items-center justify-center rounded-[6px] px-2pxr text-dark-gray-500 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="이전화"
            >
              <div className="flex items-center gap-4pxr">
                <ArrowLeft className="h-[11px] w-[6px] text-black-200" />
                <span className="text-12pxr leading-none">이전화</span>
              </div>
            </button>
            <div className="flex min-w-0 shrink items-center justify-center gap-1pxr min-[390px]:gap-2pxr">
              <button
                className="relative flex h-40pxr w-32pxr items-center justify-center"
                onClick={handleCommentState}
                aria-label="댓글"
              >
                <Image
                  src="/images/comment.svg"
                  alt=""
                  width={21}
                  height={21}
                />
                {commentCount && commentCount > 0 ? (
                  <span className="absolute right-0 top-[4px] flex h-[15px] min-w-[20px] items-center justify-center rounded-[100px] bg-black-100 px-[5px] text-[10px] font-medium text-white">
                    {commentCount > 99 ? "99+" : commentCount}
                  </span>
                ) : null}
              </button>
              <LikeButton
                likeYN={likedYN || "N"}
                buttonStyle="flex h-40pxr w-32pxr items-center justify-center"
                likeStyle="h-[21px] w-[23px] text-dark-gray-500 hover:text-dark-gray-600"
                activeLikeStyle="h-[21px] w-[23px]"
              />
              <BookmarkButton
                productId={productId || 0}
                bookmarkYn={bookmarkYn || "N"}
                buttonStyle="flex h-40pxr w-28pxr items-center justify-center"
                bookmarkStyle="h-[21px] w-[15px] text-dark-gray-500 hover:text-dark-gray-600"
                activeBookmarkStyle="h-[21px] w-[15px]"
              />
              {shouldShowWebsochatButton && (
                <WebsochatButton
                  label="웹소챗"
                  onClick={handleWebsochatClick}
                  pending={isWebsochatPending}
                  variant="subtle"
                  className="ml-3pxr h-34pxr min-w-[82px] px-10pxr text-13pxr [&>svg]:h-15pxr [&>svg]:w-15pxr min-[390px]:ml-5pxr min-[390px]:min-w-[88px]"
                />
              )}
            </div>
            <button
              onClick={handleNavigateNextChap}
              disabled={!nextEpisodeId}
              className="flex h-40pxr shrink-0 items-center justify-center rounded-[6px] px-2pxr font-medium text-black-100 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="다음화"
            >
              <div className="flex items-center gap-4pxr">
                <span className="text-12pxr leading-none">다음화</span>
                <ArrowRight className="h-[11px] w-[6px] text-black-200" />
              </div>
            </button>
          </div>
          <button
            onClick={handleNavigatePrevChap}
            disabled={!previousEpisodeId}
            className="hidden disabled:cursor-not-allowed disabled:opacity-50 md:block"
          >
            <div className="hidden md:flex items-center gap-4">
              <ArrowLeft className="w-[10px] h-[18px] text-black-200" />
              <span className="text-15pxr">이전화</span>
            </div>
          </button>
          {shouldShowWebsochatButton && (
            <WebsochatButton
              label="이번 회차로 웹소챗"
              onClick={handleWebsochatClick}
              pending={isWebsochatPending}
              variant="subtle"
              className="hidden h-40pxr min-w-[172px] px-22pxr text-15pxr md:inline-flex"
            />
          )}
          <button
            onClick={handleNavigateNextChap}
            disabled={!nextEpisodeId}
            className="hidden disabled:cursor-not-allowed disabled:opacity-50 md:block"
          >
            <div className="hidden md:flex items-center gap-4">
              <span className="text-15pxr">다음화</span>
              <ArrowRight className="w-[10px] h-[18px] text-black-200" />
            </div>
          </button>
        </>
      )}
    </div>
  );
};
export default ViewerBottomNav;
