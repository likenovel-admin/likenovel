import BookmarkButton from "@/components/common/BookmarkButton";
import LikeButton from "@/components/menu/LikeButton";
import useViewStore from "@/store/viewerStore";
import { useRouter } from "next/navigation";
import Closed from "/public/images/close.svg";
import Comment from "/public/images/comment.svg";
import Home from "/public/images/home.svg";
import Road from "/public/images/road.svg";
import Run from "/public/images/run.svg";
import ScrollType from "/public/images/scroll-type.svg";
import Setting from "/public/images/setting.svg";

interface Props {
  productId: number;
  productTitle: string;
  episodeTitle?: string;
  isScroll: boolean;
  commentState: boolean;
  noticeState: boolean;
  bookmarkYn: "Y" | "N";
  likedYN: "Y" | "N";
  bingeWatchYn: "Y" | "N";
  commentCount?: number;
  setIsScroll: (isScroll: boolean) => void;
  showNav?: boolean;
  handleCommentState: () => void;
  onSettingClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onBingeWatch: () => void;
}

const ViewerNav = ({
  productId,
  productTitle,
  episodeTitle,
  isScroll,
  bookmarkYn,
  likedYN,
  setIsScroll,
  showNav,
  commentState,
  noticeState,
  bingeWatchYn,
  commentCount,
  handleCommentState,
  onSettingClick,
  onBingeWatch,
}: Props) => {
  const router = useRouter();
  const { settings } = useViewStore((state) => ({
    settings: state.settings,
  }));
  return (
    <div
      role="navigation"
      aria-label="뷰어 상단 메뉴"
      className={`fixed top-0 left-0 z-50 flex h-[68px] w-full items-center justify-between gap-2 px-[16px] md:px-[120px] ${
        showNav
          ? "bg-white"
          : settings.theme === "dark"
          ? "bg-dark-theme-bg"
          : settings.theme === "green"
          ? "bg-green-theme-bg"
          : settings.theme === "blue"
          ? "bg-blue-theme-bg"
          : "bg-light-theme-bg"
      } ${commentState || noticeState ? "border-b" : ""}`}
    >
      {showNav && (
        <>
          <div className="flex min-w-0 items-center gap-10pxr">
            <button
              type="button"
              aria-label="작품 상세로 이동"
              onClick={() => {
                router.replace(`/product/${productId}`);
              }}
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center md:h-auto md:w-auto md:p-2"
            >
              <Home />
            </button>
            <div className="min-w-0 lg:hidden">
              {episodeTitle ? (
                <div className="flex min-w-0 flex-col items-start">
                  <p className="text-11pxr font-normal text-dark-gray-400 line-clamp-1">
                    {productTitle}
                  </p>
                  <p className="font-bold text-15pxr line-clamp-2">
                    {episodeTitle}
                  </p>
                </div>
              ) : (
                <p className="font-semibold">{productTitle}</p>
              )}
            </div>
          </div>

          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
            {episodeTitle ? (
              <div className="flex flex-col items-start 2md:items-center">
                <p className="text-11pxr 2md:text-13pxr font-normal text-dark-gray-400">
                  {productTitle}
                </p>
                <p className="font-bold text-15pxr 2md:text-16pxr">
                  {episodeTitle}
                </p>
              </div>
            ) : (
              <p className="font-semibold">{productTitle}</p>
            )}
          </div>
          {!noticeState && (
            <>
              {commentState ? (
                <>
                  <button
                    type="button"
                    aria-label="댓글 닫기"
                    onClick={handleCommentState}
                  >
                    <Closed className="w-18pxr h-18pxr" />
                  </button>
                </>
              ) : (
                <div className="flex shrink-0 items-center gap-[6px] md:gap-24pxr">
                  <button
                    type="button"
                    aria-label="보기 방식 전환"
                    onClick={() => {
                      setIsScroll(!isScroll);
                    }}
                    className="hidden md:block"
                  >
                    <div className={`${!isScroll && "transform rotate-90"}`}>
                      <ScrollType />
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label="정주행"
                    className="hidden md:block"
                    onClick={onBingeWatch}
                  >
                    {bingeWatchYn === "Y" ? <Run /> : <Road />}
                  </button>
                  <button
                    type="button"
                    aria-label="댓글"
                    className="relative hidden md:block"
                    onClick={handleCommentState}
                  >
                    <Comment />
                    {commentCount && commentCount > 0 ? (
                      <span className="absolute -top-[8px] -right-[13px] min-w-[22px] h-[16px] px-[5px] rounded-[100px] bg-[#111317] text-white text-[11px] flex items-center justify-center font-medium">
                        {commentCount > 99 ? "99+" : commentCount}
                      </span>
                    ) : null}
                  </button>
                  {/* <button className="hidden 2md:block p-2">
                <ThumbsUp className="w-[27px] h-[22px]" />
              </button> */}
                  <div className="hidden md:block">
                    <LikeButton
                      likeYN={likedYN}
                      buttonStyle=""
                      likeStyle="w-[27px] h-[22px] text-dark-gray-500 hover:text-dark-gray-600"
                      activeLikeStyle="w-[27px] h-[22px]"
                    />
                  </div>
                  <BookmarkButton
                    productId={productId}
                    bookmarkYn={bookmarkYn || "N"}
                    buttonStyle="flex h-[44px] w-[44px] shrink-0 items-center justify-center md:h-auto md:w-auto"
                    bookmarkStyle="h-[22px] w-[16px] text-dark-gray-500 hover:text-dark-gray-600 md:w-[27px]"
                    activeBookmarkStyle="h-[22px] w-[16px] md:w-[27px]"
                  />
                  <button
                    type="button"
                    aria-label="뷰어 설정"
                    onClick={onSettingClick}
                    className="flex h-[44px] w-[44px] shrink-0 items-center justify-center md:hidden"
                  >
                    <Setting aria-hidden="true" className="h-6 w-6" />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ViewerNav;
