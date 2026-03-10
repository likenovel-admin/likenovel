import { IComment } from "@/components/common/CommentArea";
import ProductReaction from "@/components/common/ProductReaction";
import { AlarmContents } from "@/components/modal/SendAlarmModal";
import useModalStore from "@/store/modalStore";
import { IEpisode, IEvaluation, INotice, IProduct } from "@/types";
import { sumTimesEvaluation } from "@/utils/common";
import { getLatestEpisodeDate } from "@/utils/getLatestEpisodeDate";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { getUpdateFrequency } from "@/utils/getUpdateFrequency";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Button from "../common/Button";
import ProductStateBadge from "../common/ProductStateBadge";
import SimpleMenu from "../common/SimpleMenu";
import Spinner from "../common/Spinner";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";
import EpisodeTabArea from "./EpisodeTabArea";
import ArrowDown from "/public/images/arrow-down.svg";
import ArrowUp from "/public/images/arrow-up.svg";
import Bookmark from "/public/images/bookmark.svg";
import Return from "/public/images/return.svg";
import View from "/public/images/view.svg";

interface Props {
  data?: IProduct;
  isSuccess?: boolean;
  isLoading?: boolean;
  evaluations: Partial<IEvaluation>;
  episodes: IEpisode[];
  notices: INotice[];
  comments?: IComment[];
}

const ProductCoverArea = ({
  data,
  evaluations,
  isSuccess,
  isLoading,
  episodes,
  notices,
  comments,
}: Props) => {
  const router = useRouter();
  const { setModal } = useModalStore();
  const handleGoBack = () => {
    // router.back();
    router.push("/product/author");
  };

  const handleOpenSendNotification = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModal(<AlarmContents productId={data?.productId} />);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <span className="text-gray-500">작품 정보를 불러올 수 없습니다.</span>
      </div>
    );
  }

  return (
    <div className="contents md:flex">
      <div className="flex flex-col border-b bg-white md:border-r w-auto md:flex-1 md:w-0">
        <div className="flex px-16pxr md:px-0 w-full mx-auto pt-3 bg-light-gray-100 md:bg-white justify-between">
          <button
            className="flex items-center gap-6pxr mt-0 md:mt-10pxr mb-15pxr"
            onClick={handleGoBack}
          >
            <Return className="w-[10px] md:w-[17px] md:h-[18px]" />
            <span className="text-13pxr md:text-15pxr">이전 페이지</span>
          </button>
          {/* <div className="flex items-center gap-3pxr md:hidden">
            <Bookmark className="w-[13px] h-[15px] text-dark-gray-400" />
          </div> */}
          <div className="md:contents">
            <SimpleMenu
              menuList={[
                {
                  title: "작품 정보 수정",
                  onClick() {
                    router.push(
                      `/product/author/making-product/${data.productId}`
                    );
                  },
                },
              ]}
            />
          </div>
        </div>
        <div className="contents md:block">
          <div className="px-4 md:px-0 flex flex-col items-center md:items-start md:gap-8 md:flex-row md:min-h-[294px] md:h-fit">
            <div className="relative h-[190px] w-[100vw] md:h-auto md:w-auto z-20 bg-light-gray-100 md:bg-white mb-16 md:mb-0 flex justify-center">
              <div className="relative w-[150px] h-[190px] md:w-[210px] md:h-[294px] bottom-[-30px] md:bottom-0">
                <Image
                  src={
                    data?.image?.coverImagePath ||
                    "/images/test/temp-cover.jpeg"
                  }
                  alt={data.title || "책표지"}
                  fill
                  className={`object-cover min-w-[150px] h-[190px] md:min-w-[210px] md:h-[294px] rounded-[10px]`}
                />
                <div
                  className={`absolute flex bottom-[5px] left-[5px] gap-[2px]`}
                >
                  <SquareBadge
                    type={getPromotionBadgeType(
                      data.badge?.waitForFreeYn || data.badge?.waitingForFreeYn,
                      data.badge?.freeEpisodeTicketCount,
                      data.badge?.timepassFromTo,
                      data.badge?.sixNinePathYn
                    )}
                    freeEpisodeNumber={data.badge?.freeEpisodeTicketCount}
                    timePassValue={data.badge?.timepassFromTo}
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col md:items-stretch items-center md:mr-4 h-full md:min-h-[294px] w-full">
              <div className="flex justify-start">
                <ProductStateBadge product={data} hasUpBadge />
              </div>
              <div className="text-21pxr font-semibold mt-1 md:text-28pxr">
                {data.title}
              </div>
              <div className="flex gap-3">
                <UserNickname
                  userNickname={data.authorNickname}
                  product={data}
                />
                {data?.illustratorNickname ? (
                  <>
                    <span className="text-gray-300">|</span>
                    <div className="text-14pxr text-gray-600">
                      {data.illustratorNickname}
                    </div>
                  </>
                ) : null}
                {data?.properties?.latestEpisodeDate ? (
                  <>
                    <span className="text-gray-300">|</span>
                    <div className="text-14pxr text-gray-600">
                      {getLatestEpisodeDate(
                        data?.properties?.latestEpisodeDate || ""
                      )}
                    </div>
                  </>
                ) : null}
              </div>
              <div className="flex items-center text-14pxr text-gray-600 mt-1">
                <span className="text-14pxr text-[#4D5159]">
                  {/* 총 {data.trendindex?.hasEpisodeCount}화 */}총{" "}
                  {data.totalOpenEpisodeCount}화
                </span>
                <div className="w-3pxr h-3pxr bg-[#B2B5C3] rounded-full mx-11pxr" />
                <span className="text-14pxr text-[#4D5159]">
                  {getUpdateFrequency(data.properties?.updateFrequency || "")}
                </span>
              </div>
              <div className="contents md:flex items-center gap-4 ">
                <div className="flex gap-3 mt-3">
                  <div className="text-[#4D5159] text-13pxr flex gap-1 items-center">
                    <View className="w-3 h-[14px]" />
                    {data.trendindex?.hitCount}
                  </div>
                  <div className="text-[#4D5159] text-13pxr flex gap-1 items-center">
                    <Image
                      src="/images/like.svg"
                      width={15}
                      height={12}
                      alt="좋아요"
                    />
                    {data.trendindex?.recommendCount}
                  </div>
                  <div className="text-[#4D5159] text-13pxr flex gap-1 items-center">
                    <Bookmark className="w-[8px] h-[13px]" />
                    {data.trendindex?.bookmarkCount}
                  </div>
                </div>
                <div className="text-13pxr text-dark-gray-300 mt-2">
                  CP조회수{" "}
                  <span className="text-[#4D5159]">
                    {data.trendindex?.cpHitCount}
                  </span>
                  <span className="mx-2 text-gray-300">|</span>연독률{" "}
                  <span className="text-[#4D5159]">
                    {data.trendindex?.readThroughRate ? `${data.trendindex.readThroughRate}%` : '-'}
                  </span>
                </div>
              </div>
              <MoreArea synopsis={data.synopsis} />
              <div className="hidden md:flex gap-2 ml-auto mt-auto">
                {/* TODO: 라우터 수정 필요 */}
                <Button
                  onClick={() => {
                    router.push(`/making-episode/${data.productId}`);
                  }}
                >
                  회차/공지 쓰기
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleOpenSendNotification}
                >
                  독자 알림
                  <span className="text-gray-400">
                    {" "}
                    ({data?.remainingNotificationCount || 0}회 남음)
                  </span>
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-start w-full my-5 px-4 md:w-[70%] md:px-0">
            {data.keywords?.map((genre, index) => (
              <button
                key={index}
                className="p-3 bg-gray-100 rounded-full text-13pxr text-dark-gray-400 h-[34px] flex justify-center items-center"
              >
                #{genre}
              </button>
            ))}
          </div>

          <div className="w-[100vw] md:w-full h-2 bg-light-gray-100 md:h-[1px]" />
        </div>
        <div className="md:hidden block md:min-w-[270px]">
          <RatingArea evaluations={evaluations} />
        </div>
        <div className="mt-8 md:mr-6">
          <EpisodeTabArea
            episodes={episodes}
            notices={notices}
            productId={data?.productId || 0}
            comments={comments}
            updateFrequency={data?.properties?.updateFrequency}
          />
        </div>
      </div>
      <div className="hidden md:block md:min-w-[270px]">
        <RatingArea evaluations={evaluations} />
      </div>
    </div>
  );
};

const MoreArea = ({ synopsis }: { synopsis?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!synopsis) return null;

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  };

  const shouldShowMore = synopsis.length > 150;
  const truncatedText =
    shouldShowMore && !isExpanded ? truncateText(synopsis, 120) : synopsis;

  return (
    <div className="w-full md:w-auto mt-6 border-t md:border-t-0 text-14pxr leading-[20px] text-dark-gray-500">
      <div className="pt-3">
        <div>
          {truncatedText}
          {!isExpanded && shouldShowMore && (
            <>
              ...{" "}
              <button
                onClick={() => setIsExpanded(true)}
                className="text-nowrap text-13pxr text-[#424751] inline-flex items-center gap-1 hover:underline"
              >
                더보기
                <ArrowDown className="w-[14px] h-[8px]" />
              </button>
            </>
          )}
          {isExpanded && (
            <>
              {" "}
              <button
                onClick={() => setIsExpanded(false)}
                className="text-13pxr text-[#424751] inline-flex items-center gap-1 hover:underline"
              >
                접기
                <ArrowUp className="w-[12px] h-[8px]" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const RatingArea = ({ evaluations }: { evaluations: Partial<IEvaluation> }) => {
  const totalParticipants = useMemo(() => {
    if (evaluations) {
      return sumTimesEvaluation(
        evaluations as unknown as Record<string, number>
      ).toLocaleString("ko-KR");
    }
    return 0;
  }, [evaluations]);

  return (
    <div className="flex w-full justify-center bg-white px-4">
      <div className="w-full">
        <div className="flex gap-10pxr items-center mt-30pxr mb-15pxr">
          <span className="text-18pxr font-semibold">평가</span>
          <div className="h-[12px] border border-t-0 border-b-0 border-l-light-gray-500 border-r-0" />
          <div>
            <span className="text-13pxr text-dark-gray-300">총</span>
            {/* TODO: api 받아서 명수 데이터 넣기 */}
            <span className="text-13pxr text-primary-100 font-semibold">
              &nbsp;{totalParticipants}명&nbsp;
            </span>
            <span className="text-13pxr text-dark-gray-300">참여 중</span>
          </div>
        </div>
        {/* TODO: api 데이터로 바꾸기 */}
        <ProductReaction evaluations={evaluations} />
      </div>
    </div>
  );
};

export default ProductCoverArea;
