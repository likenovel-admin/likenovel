"use client";
import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import ExclamationTooltip from "@/components/common/ExclamationTooltip";
import Spinner from "@/components/common/Spinner";
import HomeItem from "@/components/mypage/HomeItem";
import TasteDashboard from "@/components/recommendation/TasteDashboard";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  const { data: userInfo, isLoading } = useSelectUserInfo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const userData = userInfo?.data;

  return (
    <div>
      <div className="break-keep text-18pxr text-black-100 py-[30px] font-normal flex items-center justify-center">
        <strong>회원님의 이용정보&nbsp;</strong> 입니다.
      </div>
      <ul className="px-4 flex flex-col gap-2 max-w-[500px] mx-auto">
        <li>
          <HomeItem
            icon={"/images/cash.svg"}
            title="보유 캐시"
            numberContent={
              <div className="text-primary-100 text-15pxr md:text-20pxr">
                {(userData?.totalCash || 0).toLocaleString()}
                <span className="text-black-100">{"C"}</span>
              </div>
            }
            rightContent={
              <div
                className="rounded-full bg-primary-100 text-white flex items-center justify-center text-12pxr md:text-14pxr px-[10px] h-[30px] md:h-[32px] my-auto cursor-pointer"
                onClick={() => {
                  router.push("/product/mypage/cash");
                }}
              >
                캐시충전
              </div>
            }
          />
        </li>
        <li>
          <HomeItem
            icon={"/images/interest.svg"}
            title="관심 유지수"
            numberContent={
              <div className="text-black-100 text-15pxr md:text-20pxr">
                {(userData?.totalInterestSustainCount || 0).toLocaleString()}
              </div>
            }
            rightContent={<ExclamationTooltip />}
          />
        </li>
        {/* <li>
          <HomeItem
            icon={"/images/popular.svg"}
            title="인기 적중"
            numberContent={
              <div className="text-black-100 text-15pxr md:text-20pxr">
                {(userData?.totalVoteWinCount || 0).toLocaleString()}
                <span className="text-dark-gray-100">
                  {" / " + (userData?.totalVoteRound || 0)}
                </span>
              </div>
            }
            rightContent={<ExclamationTooltip />}
          />
        </li> */}
        <li>
          <HomeItem
            icon={"/images/total-read.svg"}
            title="총 읽은 작품 수"
            numberContent={
              <div className="text-black-100 text-15pxr md:text-20pxr">
                {(userData?.totalReadProductCount || 0).toLocaleString()}
              </div>
            }
            rightContent={<ExclamationTooltip />}
          />
        </li>
        <li>
          <HomeItem
            icon={"/images/series.svg"}
            title="연재한 작품 수"
            numberContent={
              <div className="text-black-100 text-15pxr md:text-20pxr">
                {(userData?.totalWrittenProductCount || 0).toLocaleString()}
              </div>
            }
            rightContent={<ExclamationTooltip />}
          />
        </li>
        {/* <li>
          <HomeItem
            icon={"/images/ended.svg"}
            title="완결 기어"
            numberContent={
              <div className="text-black-100 text-15pxr md:text-20pxr">
                {(0).toLocaleString()}
              </div>
            }
            rightContent={<ExclamationTooltip />}
          />
        </li> */}
      </ul>
      <div className="px-4 max-w-[500px] mx-auto mt-16pxr">
        <TasteDashboard />
      </div>
    </div>
  );
};

export default Page;
