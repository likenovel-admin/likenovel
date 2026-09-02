import BookmarkButton from "@/components/common/BookmarkButton";
import LikeButton from "@/components/menu/LikeButton";
import useConfirmStore from "@/store/confirmStore";
import useViewStore from "@/store/viewerStore";
import { useRouter } from "next/navigation";
import Closed from "/public/images/close.svg";
import Comment from "/public/images/comment.svg";
import Home from "/public/images/home.svg";
import Road from "/public/images/road.svg";
import Run from "/public/images/run.svg";
import ScrollType from "/public/images/scroll-type.svg";

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
}: Props) => {
  const router = useRouter();
  const { settings } = useViewStore((state) => ({
    settings: state.settings,
  }));
  const { setConfirm } = useConfirmStore();

  const handleBingeWatch = () => {
    if (bingeWatchYn === "N") {
      setConfirm({
        content: (
          <div className="flex flex-col items-center">
            <span className="text-18pxr font-semibold leading-[25px] tracking-[-2%] text-[#111317]">
              정주행을 시작합니다!
            </span>
            <span className="text-14pxr font-normal leading-[20px] tracking-[-2%] text-[#4D5159]">
              마지막 페이지 없이 다음회차로 곧장 이동하며,
              <br />
              가지고 계신 대여권 혹은 캐시가 자동소진됩니다.
            </span>
          </div>
        ),
        confirmText: "정주행",
        onConfirm: () => {
          //
        },
      });
    }
  };
  return (
    <div
      className={`fixed top-0 left-0 z-50 flex items-center justify-between h-[68px] px-[16px] md:px-[120px] w-full ${
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
          <div className="flex gap-10pxr">
            <button
              onClick={() => {
                router.replace(`/product/${productId}`);
              }}
              className="p-2"
            >
              <Home />
            </button>
            <div className="lg:hidden ">
              {episodeTitle ? (
                <div className="flex flex-col items-start">
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
                <div className="flex items-center gap-24pxr">
                  <button
                    onClick={() => {
                      setIsScroll(!isScroll);
                    }}
                    className=""
                  >
                    <div className={`${!isScroll && "transform rotate-90"}`}>
                      <ScrollType />
                    </div>
                  </button>
                  <button className="" onClick={handleBingeWatch}>
                    {bingeWatchYn === "Y" ? <Run /> : <Road />}
                  </button>
                  <button
                    className="hidden 2md:block relative"
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
                  <div className="hidden 2md:block">
                    <LikeButton
                      likeYN={likedYN}
                      buttonStyle=""
                      likeStyle="w-[27px] h-[22px] text-dark-gray-500 hover:text-dark-gray-600"
                      activeLikeStyle="w-[27px] h-[22px]"
                    />
                  </div>
                  <div className="hidden 2md:flex items-center">
                    <BookmarkButton
                      productId={productId}
                      bookmarkYn={bookmarkYn || "N"}
                      buttonStyle=""
                      bookmarkStyle="w-[27px] h-[22px] text-dark-gray-500 hover:text-dark-gray-600"
                      activeBookmarkStyle="w-[27px] h-[22px]"
                    />
                  </div>
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
