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
import FireDetail from "/public/images/fire-detail.svg";
import FireEmptyDetail from "/public/images/fire-empty-detail.svg";
import Office from "/public/images/office.svg";
import ViewDetail from "/public/images/view-detail.svg";
const summaryGuideLines = [
  "조회수·선작수·추천수·CP 조회수는 현재 누적 기준이며, 우측 증감 수치는 전일 대비입니다.",
  "관심 관련 지표는 무료작품 기준으로 집계되며, 당일 읽기 기록은 익일 반영될 수 있습니다.",
];

const MyProductManageArea = () => {
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
            <span className="text-17pxr font-bold">
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
          icon: (
            <Image
              src={"/images/bookmark-detail.svg"}
              alt="총 선작수"
              width={20}
              height={20}
            />
          ),
          title: "총 선작수",
          count: summaryData.data.totalBookmarkCount,
          indicator: summaryData.data.totalBookmarkCountIndicator,
        },
        {
          icon: (
            <Image
              src={"/images/thumbs-up-detail.svg"}
              alt="총 추천수"
              width={25}
              height={25}
            />
          ),
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
    <div className="flex justify-between w-full border border-t-0 border-l-black-100 border-r-black-100 border-b-black-100 rounded-b-[20px] shadow-md">
      <div className="flex flex-col justify-center w-full">
        <div className="flex justify-between p-30pxr">
          <div className="flex gap-14pxr items-center">
            <Image
              src={
                summaryData?.data.profileImagePath ||
                "/images/profile-basic.svg"
              }
              alt="프로필 이미지"
              width={58}
              height={58}
              className="min-w-[58px] h-[58px] rounded-full"
            />
            <div className="flex flex-col">
              <div
                className="flex items-center md:gap-10pxr lg:gap-30pxr max-w-[500px] cursor-pointer"
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
                  textStyle="text-22pxr font-semibold mr-5pxr"
                  badgeStyle="w-[20px] h-[22px]"
                  spanStyle="max-w-[200px]"
                />
                <ArrowRight className="w-[5px] h-[8px] text-dark-gray-500" />
              </div>
              <span className="text-13pxr text-dark-gray-300">
                {summaryData?.data.email}
              </span>
            </div>
          </div>
          <button
            className="w-[140px] border-[2px] border-primary-100 text-primary-100 text-15pxr font-medium p-10pxr rounded-[14px] hover:bg-primary-100 hover:text-white"
            onClick={handleCreateProductClick}
          >
            새로운 작품 등록
          </button>
        </div>
        <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0" />
        <div className="flex flex-col gap-30pxr p-30pxr">
          <div className="flex w-full justify-between flex-wrap">
            {manageData.slice(0, 4).map((item) => (
              <div
                className="flex gap-10pxr md:basis-[45%] md:mb-10pxr lg:mb-0 lg:basis-[20%]"
                key={item.title}
              >
                <div className="flex justify-center items-center w-[50px] h-[50px] border border-light-gray-300 rounded-full">
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-14pxr font-medium text-dark-gray-400">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-7pxr">
                    <span className="text-18pxr font-semibold">
                      {(item.count || 0).toLocaleString("ko-KR")}
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
          <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0" />
          <div className="flex w-full justify-between flex-wrap">
            {manageData.slice(4, 7).map((item) => (
              <div
                className="flex gap-10pxr md:basis-[45%] md:mb-10pxr lg:mb-0 lg:basis-[20%]"
                key={item.title}
              >
                <div className="flex justify-center items-center w-[50px] h-[50px] border border-light-gray-300 rounded-full">
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-14pxr font-medium text-dark-gray-400">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-7pxr">
                    <span className="text-18pxr font-semibold">
                      {(item.count || 0).toLocaleString("ko-KR")}
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
          <div className="flex flex-col gap-6pxr">
            {summaryGuideLines.map((line) => (
              <span key={line} className="text-12pxr text-dark-gray-300">
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default MyProductManageArea;
