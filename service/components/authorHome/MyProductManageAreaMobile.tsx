import { useMySummary } from "@/app/api/query/author/product";
import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import Spinner from "@/components/common/Spinner";
import WarningModal from "@/components/modal/WarningModal";
import useModalStore from "@/store/modalStore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import RankIndicator from "../common/RankIndicator";
import UserNickname from "../common/UserNickname";
import ArrowRight from "/public/images/arrow-right-medium.svg";
import BookmarkDetail from "/public/images/bookmark-detail.svg";
import FireDetail from "/public/images/fire-detail.svg";
import FireEmptyDetail from "/public/images/fire-empty-detail.svg";
import Office from "/public/images/office.svg";
import ThumbsUpDetail from "/public/images/thumbs-up-detail.svg";
import ViewDetail from "/public/images/view-detail.svg";

const summaryGuideLines = [
  "조회수·선작수·추천수·CP 조회수는 현재 누적 기준이며, 우측 증감 수치는 전일 대비입니다.",
  "관심 관련 지표는 무료작품 기준으로 집계되며, 당일 읽기 기록은 익일 반영될 수 있습니다.",
];

const MyProductManageAreaMobile = () => {
  const router = useRouter();
  const { data: summaryData, isLoading, error } = useMySummary();
  const { data: userInfo } = useSelectUserInfo();
  const { setModal } = useModalStore();

  const isCpUser = userInfo?.data?.userRole === "CP";

  const handleCreateProductClick = () => {
    if (isCpUser) {
      setModal(
        <WarningModal
          content={
            <span className="text-15pxr font-bold">
              파트너사이트에서 신규작품생성을 해주세요.
            </span>
          }
        />
      );
      return;
    }

    router.push("/product/author/making-product");
  };

  const manageData = summaryData?.data
    ? [
        {
          icon: <ViewDetail />,
          title: "총 조회수",
          count: summaryData.data.totalViewCount,
          indicator: summaryData.data.totalViewCountIndicator,
        },
        {
          icon: <BookmarkDetail />,
          title: "총 선작수",
          count: summaryData.data.totalBookmarkCount,
          indicator: summaryData.data.totalBookmarkCountIndicator,
        },
        {
          icon: <ThumbsUpDetail />,
          title: "총 추천수",
          count: summaryData.data.totalRecommendCount,
          indicator: summaryData.data.totalRecommendCountIndicator,
        },
        {
          icon: <Office />,
          title: "CP 조회수",
          count: summaryData.data.totalCPViewCount,
          indicator: summaryData.data.totalCPViewCountIndicator,
        },
        {
          icon: <FireDetail />,
          title: "누적 관심 수",
          count: summaryData.data.interestTotalCount,
          indicator: summaryData.data.interestTotalCountIndicator,
        },
        {
          icon: <FireDetail />,
          title: "관심 유지",
          count: summaryData.data.interestSustainCount,
          indicator: summaryData.data.interestSustainCountIndicator,
        },
        {
          icon: <FireEmptyDetail />,
          title: "관심 이탈",
          count: summaryData.data.interestLossCount,
          indicator: summaryData.data.interestLossCountIndicator,
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center mt-[-100px]">
        <Spinner />
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      <div className="flex flex-col px-16pxr">
        <div className="flex justify-between items-center w-full mt-20pxr">
          <div className="flex gap-7pxr items-center">
            <Image
              src={
                summaryData?.data.profileImagePath ||
                "/images/profile-basic.svg"
              }
              alt="프로필 이미지"
              width={58}
              height={58}
              className="min-w-[50px] h-[50px] rounded-full"
            />
            <div className="flex flex-col">
              <div
                className="flex items-center gap-10pxr max-w-[500px] cursor-pointer"
                // TODO: 마이페이지로 이동
                onClick={() => {
                  router.push("/product/mypage/home");
                }}
              >
                <UserNickname
                  product={
                    { badgeImagePath: summaryData?.data.badgeImagePath } as any
                  }
                  userNickname={`${summaryData?.data.nickname}님`}
                  textStyle="text-15pxr font-semibold"
                  badgeStyle="w-[17px] h-[17px]"
                  spanStyle="max-w-[120px]"
                />
                <ArrowRight className="w-[8px] h-[10px] text-dark-gray-600" />
              </div>
              <span className="text-11pxr text-dark-gray-300">
                {summaryData?.data.email}
              </span>
            </div>
          </div>
          <button
            className="flex items-center justify-center w-[110px] h-[40px] border border-primary-100 text-primary-100 text-13pxr font-medium rounded-[14px] hover:bg-primary-100 hover:text-white"
            onClick={handleCreateProductClick}
          >
            새로운 작품 등록
          </button>
        </div>
        <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0 mt-20pxr mb-30pxr" />
        <div className="grid grid-cols-2 gap-20pxr">
          {manageData.map((item, index) => (
            <div className="flex gap-10pxr" key={item.title}>
              <div className="flex justify-center items-center w-[45px] h-[45px] border border-light-gray-300 rounded-full">
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-13pxr font-medium text-dark-gray-400">
                  {item.title}
                </span>
                <div className="flex items-center gap-7pxr">
                  <span className="text-15pxr font-semibold">
                    {(item.count || 0).toLocaleString()}
                  </span>
                  <RankIndicator
                    rankIndicator={item.indicator}
                    alignLocation="center"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6pxr mt-20pxr">
          {summaryGuideLines.map((line) => (
            <span key={line} className="text-11pxr text-dark-gray-300">
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
export default MyProductManageAreaMobile;
