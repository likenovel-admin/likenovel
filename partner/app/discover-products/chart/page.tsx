"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Dot } from "lucide-react";
import ReadRatingChart from "@/app/discover-products/chart/components/read-rating-chart";
import BookmarkTrendingChart from "@/app/discover-products/chart/components/bookmark-trending-chart";
import InterestTrendingChart from "@/app/discover-products/chart/components/interest-trending-chart";
import EarlyViewsHitCountChart from "@/app/discover-products/chart/components/early-views-hit-count-chart";
import TargetReaderAnalysisChart from "@/app/discover-products/chart/components/target-reader-analysis-chart";
import AnalysisDataTable from "@/app/discover-products/chart/components/analysis-data-table";
import { useGetProductDiscoveryStatisticsDetail } from "@/api/product-discovery-statistics";
import { useSearchParams } from "next/navigation";
import FullPageLoader from "@/components/common/FullPageLoader";
import { format } from "date-fns";
import ViewsPerEpisode from "@/app/discover-products/chart/components/views-per-episode";
import TargetReaderAnalysisDetails from "@/app/discover-products/chart/components/target-reader-analysis-details";
import RecommendSimilarWorks from "@/app/discover-products/chart/components/recommend-similar-works";
import { useProfile } from "@/hooks/useProfile";

const DiscoverProductsChart = () => {
  const { isAuthor, isPartner } = useProfile();
  const searchParams = useSearchParams();
  const id = searchParams.get("productId");
  const scope = searchParams.get("mode") === "summary" && isPartner === true
    ? "contracted"
    : undefined;
  const isSummaryView =
    isAuthor === true ||
    (isPartner === true && searchParams.get("mode") === "summary");
  const { data, isLoading, isFetching } =
    useGetProductDiscoveryStatisticsDetail(id || "", scope);

  return (
    <div className="relative">
      <div className="absolute w-full h-[650px] sm:h-[550px] md:h-[400px] lg:h-[360px] bg-[#272848]" />
      <header className="relative flex h-10 shrink-0 items-center gap-2 {/*bg-[#272848]*/} text-zinc-100 z-10 pt-6 md:pl-8">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="text-zinc-100 text-xs">
                <BreadcrumbLink
                  href={isSummaryView ? "/discover-products?mode=summary" : "/discover-products"}
                >
                  {isSummaryView ? "작품요약" : "발굴작품 조회"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-zinc-100" />
              <BreadcrumbItem className="text-zinc-100 text-xs font-semibold">
                상세
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="relative flex flex-1 flex-col gap-1 text-zinc-100 z-10 p-4 md:pl-14">
        <div className="flex flex-1 items-center text-[14px]">
          <span>{data?.author_nickname || ""}작가</span>{" "}
          <Dot size={20} strokeWidth={1.25} />
          <span>
            {data?.created_date
              ? format(new Date(data.created_date), "yyyy-MM-dd")
              : ""}{" "}
            등록
          </span>
        </div>
        <div className="text-3xl font-semibold mb-2">{data?.title || ""}</div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-auto md:grid-rows-2 gap-2">
            <div className="flex flex-1 items-center gap-2 bg-white rounded-lg text-black mx-1 p-4 shadow">
              <div className="bg-[#FBF3EC] rounded-full md:p-2.5">
                <svg
                  width="22"
                  height="25"
                  viewBox="0 0 22 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5 2.18359C2.23858 2.18359 0 4.42217 0 7.18359V7.20979H22V7.18359C22 4.42217 19.7614 2.18359 17 2.18359H5ZM22 9.22032H0V19.2994C0 22.0608 2.23858 24.2994 5 24.2994H17C19.7614 24.2994 22 22.0608 22 19.2994V9.22032Z"
                    fill="#FF8F3D"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.3956 12.2956C14.8745 12.1116 14.3043 12.3853 14.122 12.9069L13.0694 15.9185L12.0171 12.908C11.8817 12.5205 11.5323 12.2699 11.148 12.2419C10.7049 12.2037 10.2757 12.4673 10.122 12.9069L9.06937 15.9185L8.01711 12.908C7.83477 12.3863 7.26456 12.1126 6.7435 12.2967C6.22245 12.4807 5.94786 13.0528 6.1302 13.5745L6.44515 14.4755H5.80531C5.25012 14.4755 4.80005 14.9256 4.80005 15.4808C4.80005 16.036 5.25012 16.4861 5.80531 16.4861H7.1479L8.12194 19.2727C8.27548 19.712 8.70406 19.9755 9.14673 19.9378C9.53156 19.9104 9.8816 19.6596 10.0172 19.2717L11.0694 16.2614L12.1219 19.2727C12.2755 19.712 12.7041 19.9754 13.1467 19.9378C13.5316 19.9104 13.8816 19.6596 14.0172 19.2717L14.9908 16.4861H16.2948C16.85 16.4861 17.3 16.036 17.3 15.4808C17.3 14.9256 16.85 14.4755 16.2948 14.4755H15.6936L16.0089 13.5734C16.1912 13.0518 15.9167 12.4797 15.3956 12.2956Z"
                    fill="#FFE3CE"
                  />
                  <rect
                    x="5"
                    y="0.171875"
                    width="2"
                    height="4.02105"
                    rx="1"
                    fill="#FFE3CE"
                  />
                  <rect
                    x="15"
                    y="0.171875"
                    width="2"
                    height="4.02105"
                    rx="1"
                    fill="#FFE3CE"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm">활성독자율</div>
                <div className="text-xl font-semibold">
                  {data?.active_reader_rate || 0}%
                </div>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 bg-white rounded-lg text-black mx-1 p-4 shadow">
              <div className="bg-[#FBF3EC] rounded-full md:p-2.5">
                <svg
                  width="28"
                  height="22"
                  viewBox="0 0 28 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.5079 0.183594C0.675108 0.183594 0 0.858701 0 1.69149C0 2.52428 0.675108 3.19938 1.5079 3.19938H9.4921C10.3249 3.19938 11 2.52428 11 1.69149C11 0.858701 10.3249 0.183594 9.4921 0.183594H1.5079ZM0 6.71769C0 5.8849 0.675108 5.20979 1.5079 5.20979H5.4921C6.32489 5.20979 7 5.8849 7 6.71769C7 7.55048 6.32489 8.22558 5.49211 8.22558H1.5079C0.675108 8.22558 0 7.55048 0 6.71769ZM1.5079 10.2361C0.675108 10.2361 0 10.9112 0 11.744C0 12.5768 0.675108 13.2519 1.5079 13.2519H4.49211C5.32489 13.2519 6 12.5768 6 11.744C6 10.9112 5.32489 10.2361 4.4921 10.2361H1.5079ZM1.5079 15.2624C0.675108 15.2624 0 15.9375 0 16.7703C0 17.6031 0.675108 18.2782 1.5079 18.2782H6.4921C7.32489 18.2782 8 17.6031 8 16.7703C8 15.9375 7.32489 15.2624 6.4921 15.2624H1.5079Z"
                    fill="#FF8F3D"
                  />
                  <ellipse
                    cx="18"
                    cy="11.2401"
                    rx="10"
                    ry="10.0526"
                    fill="#FF8F3D"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M19.1219 15.261L18.0694 12.2497L17.0172 15.26C16.8816 15.6479 16.5316 15.8986 16.1467 15.9261C15.7041 15.9637 15.2755 15.7003 15.1219 15.261L14.1479 12.4743H12.8053C12.2501 12.4743 11.8 12.0243 11.8 11.4691C11.8 10.9139 12.2501 10.4638 12.8053 10.4638H13.4452L13.1302 9.56275C12.9479 9.0411 13.2224 8.46901 13.7435 8.28496C14.2646 8.10091 14.8348 8.37459 15.0171 8.89625L16.0694 11.9067L17.122 8.8952C17.2757 8.45553 17.7049 8.19202 18.148 8.23022C18.5323 8.25813 18.8817 8.50879 19.0171 8.89625L20.0694 11.9067L21.122 8.8952C21.3043 8.37354 21.8745 8.09985 22.3956 8.2839C22.9167 8.46795 23.1912 9.04003 23.0089 9.56169L22.6936 10.4638H23.2948C23.85 10.4638 24.3 10.9139 24.3 11.4691C24.3 12.0243 23.85 12.4743 23.2948 12.4743H21.9908L21.0172 15.26C20.8816 15.6479 20.5315 15.8986 20.1467 15.9261C19.7041 15.9637 19.2755 15.7003 19.1219 15.261Z"
                    fill="#FFE3CE"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm">독자선호율</div>
                <div className="text-xl font-semibold">
                  {data?.reader_preference_rate || 0}%
                </div>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 bg-white rounded-lg text-black mx-1 p-4 shadow">
              <div className="bg-[#FBF3EC] rounded-full md:p-2.5">
                <svg
                  width="20"
                  height="21"
                  viewBox="0 0 20 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    y="0.183594"
                    width="20"
                    height="20.1053"
                    rx="4"
                    fill="#FF8F3D"
                  />
                  <rect
                    x="8"
                    y="0.183594"
                    width="4"
                    height="4.02105"
                    fill="#FFE3CE"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.84741 15.2128C8.5852 15.2178 8.32141 15.1197 8.12132 14.9185L5.29289 12.0752C4.90237 11.6827 4.90237 11.0462 5.29289 10.6536C5.68342 10.261 6.31658 10.261 6.70711 10.6536L8.84445 12.8022L13.1032 8.521C13.4937 8.12842 14.1269 8.12842 14.5174 8.521C14.9079 8.91358 14.9079 9.55007 14.5174 9.94265L9.56767 14.9185C9.36906 15.1181 9.1077 15.2162 8.84741 15.2128Z"
                    fill="#FFE3CE"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm">선인세 제안범위</div>
                <div className="flex flex-1 items-center gap-1 text-[14px] font-semibold">
                  {data?.advance_tax_proposal_scope?.[0]} ~{" "}
                  {data?.advance_tax_proposal_scope?.[1]}원
                </div>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 bg-white rounded-lg text-black mx-1 p-4 shadow">
              <div className="bg-[#FBF3EC] rounded-full md:p-2.5">
                <svg
                  width="26"
                  height="23"
                  viewBox="0 0 26 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2.25349 13.0351C-0.647972 10.1184 -0.647974 5.38944 2.25349 2.47271C5.15495 -0.444026 9.85915 -0.444028 12.7606 2.47271L13.0542 2.76781L13.3355 2.48499C16.2307 -0.425486 20.9249 -0.425488 23.8201 2.48499C26.7153 5.39547 26.7153 10.1143 23.8201 13.0248L20.302 16.5613C20.2388 16.639 20.1712 16.7143 20.099 16.7868L15.1381 21.7738C13.9696 22.9485 12.0751 22.9485 10.9066 21.7738L5.94575 16.7868C5.8469 16.6875 5.75641 16.5829 5.67429 16.4739L2.25349 13.0351Z"
                    fill="#F8607B"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M17.3954 7.93234C16.8743 7.74829 16.3041 8.02198 16.1218 8.54363L15.0692 11.555L14.017 8.54469C13.8816 8.15723 13.5321 7.90657 13.1478 7.87866C12.7048 7.84045 12.2756 8.10397 12.1219 8.54363L11.0693 11.5552L10.017 8.54469C9.83465 8.02303 9.26443 7.74935 8.74338 7.9334C8.22233 8.11745 7.94774 8.68953 8.13008 9.21119L8.44503 10.1122H7.80519C7.25 10.1122 6.79993 10.5623 6.79993 11.1175C6.79993 11.6727 7.25 12.1228 7.80519 12.1228H9.14778L10.1218 14.9095C10.2754 15.3487 10.7039 15.6122 11.1466 15.5745C11.5314 15.5471 11.8815 15.2963 12.0171 14.9084L13.0693 11.8981L14.1218 14.9095C14.2754 15.3489 14.7044 15.6124 15.1472 15.5745C15.5318 15.5468 15.8814 15.296 16.0169 14.9084L16.9906 12.1228H18.2947C18.8499 12.1228 19.2999 11.6727 19.2999 11.1175C19.2999 10.5623 18.8499 10.1122 18.2947 10.1122H17.6933L18.0087 9.21013C18.191 8.68847 17.9164 8.11638 17.3954 7.93234Z"
                    fill="#FFF3F5"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm">연재성실성</div>
                <div className="text-xl font-semibold">
                  {data?.serial_integrity}
                </div>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 bg-white rounded-lg text-black mx-1 p-4 shadow">
              <div className="bg-[#FBF3EC] rounded-full md:p-2.5">
                <svg
                  width="30"
                  height="21"
                  viewBox="0 0 30 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.5079 0.183594C0.675108 0.183594 0 0.858701 0 1.69149C0 2.52428 0.675108 3.19938 1.5079 3.19938H6.4921C7.32489 3.19938 8 2.52428 8 1.69149C8 0.858701 7.32489 0.183594 6.4921 0.183594H1.5079ZM0 6.71788C0 5.88509 0.675108 5.20999 1.5079 5.20999H4.4921C5.32489 5.20999 6 5.88509 6 6.71788C6 7.55067 5.32489 8.22578 4.49211 8.22578H1.5079C0.675108 8.22578 0 7.55067 0 6.71788ZM1.5079 10.2363C0.675108 10.2363 0 10.9114 0 11.7442C0 12.577 0.675108 13.2521 1.5079 13.2521H4.49211C5.32489 13.2521 6 12.577 6 11.7442C6 10.9114 5.32489 10.2363 4.4921 10.2363H1.5079ZM1.5079 15.2626C0.675108 15.2626 0 15.9377 0 16.7705C0 17.6033 0.675108 18.2784 1.5079 18.2784H9.4921C10.3249 18.2784 11 17.6033 11 16.7705C11 15.9377 10.3249 15.2626 9.4921 15.2626H1.5079Z"
                    fill="#F8607B"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.93139 12.5037C6.3562 9.91496 6.35621 5.71779 8.93139 3.12905C11.5066 0.540316 15.6818 0.540316 18.257 3.12905L18.5171 3.39055L18.7671 3.13925C21.3367 0.556066 25.503 0.556066 28.0726 3.13925C30.6423 5.72244 30.6423 9.91061 28.0726 12.4938L24.8264 15.7571C24.7975 15.7861 24.7685 15.8148 24.7392 15.8431C24.6748 15.9227 24.6058 15.9997 24.5321 16.0737L20.6049 20.0216C19.4364 21.1962 17.5419 21.1962 16.3734 20.0216L12.4462 16.0737C12.3514 15.9784 12.2643 15.8783 12.1848 15.7741C12.1758 15.7651 12.1667 15.756 12.1576 15.7469L8.93139 12.5037Z"
                    fill="#F8607B"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M22.8956 7.27609C22.3745 7.09204 21.8043 7.36573 21.622 7.88738L20.5694 10.8989L19.5171 7.88844C19.3817 7.50098 19.0323 7.25032 18.648 7.22241C18.2049 7.1842 17.7757 7.44772 17.622 7.88738L16.5694 10.8989L15.5171 7.88844C15.3348 7.36678 14.7646 7.0931 14.2435 7.27715C13.7224 7.4612 13.4479 8.03328 13.6302 8.55494L13.9452 9.456H13.3053C12.7501 9.456 12.3 9.90607 12.3 10.4613C12.3 11.0165 12.7501 11.4665 13.3053 11.4665H14.6479L15.6219 14.2532C15.7755 14.6925 16.2041 14.9559 16.6467 14.9183C17.0315 14.8908 17.3816 14.6401 17.5172 14.2521L18.5694 11.2419L19.6219 14.2532C19.7755 14.6925 20.2041 14.9559 20.6467 14.9183C21.0315 14.8908 21.3816 14.6401 21.5172 14.2521L22.4908 11.4665H23.7948C24.35 11.4665 24.8 11.0165 24.8 10.4613C24.8 9.90607 24.35 9.456 23.7948 9.456H23.1936L23.5089 8.55388C23.6912 8.03222 23.4167 7.46013 22.8956 7.27609Z"
                    fill="#FFF3F5"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm">신규독자 유입율</div>
                <div className="text-xl font-semibold">
                  {data?.new_reader_inflow_rate}%
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 auto-rows-auto md:grid-cols-3 gap-2 text-black">
            <div className="bg-white rounded-lg md:col-span-3 mx-1">
              <ReadRatingChart data={data?.reading_rate_trends || []} />
            </div>
            <div className="bg-white rounded-lg mx-1">
              <div>
                <BookmarkTrendingChart data={data?.bookmark_trends || []} />
              </div>
            </div>
            <div className="bg-white rounded-lg mx-1">
              <InterestTrendingChart data={data?.interest_trends || []} />
            </div>
            <div className="mx-1">
              <EarlyViewsHitCountChart
                first_episode_count_hit_in_24h={
                  data?.first_episode_count_hit_in_24h || 0
                }
                latest_episode_count_hit_in_24h={
                  data?.latest_episode_count_hit_in_24h || 0
                }
              />
            </div>
            <div className="bg-white rounded-xl mx-1 border bg-card text-card-foreground shadow">
              <ViewsPerEpisode data={data?.episode_count_hit || []} />
            </div>
            <div className="mx-1">
              <TargetReaderAnalysisChart
                data={data?.reader_analysis || []}
                primary_reader_group1={data?.primary_reader_group1 || ""}
                primary_reader_group2={data?.primary_reader_group2 || ""}
              />
            </div>
            <div className="bg-white rounded-xl mx-1 border bg-card text-card-foreground shadow">
              <TargetReaderAnalysisDetails data={data?.reader_analysis || []} />
            </div>
            <div className="bg-white rounded-xl mx-1 border bg-card text-card-foreground shadow">
              <RecommendSimilarWorks
                data={{
                  similar_product_1: data?.similar_product_1 || null,
                  similar_product_2: data?.similar_product_2 || null,
                  similar_product_3: data?.similar_product_3 || null,
                }}
              />
            </div>
            <div className="bg-white rounded-xl mx-1 border bg-card text-card-foreground shadow">
              <div className="flex flex-1 items-center gap-2 bg-white rounded-lg text-black mx-1 p-4">
                <div className="bg-[#FBF3EC] rounded-full p-3">
                  <svg
                    width="20"
                    height="21"
                    viewBox="0 0 20 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      y="0.710938"
                      width="20"
                      height="20.1053"
                      rx="4"
                      fill="#FFBD3D"
                    />
                    <rect
                      x="8"
                      y="0.710938"
                      width="4"
                      height="4.02105"
                      fill="#FFEECC"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.8474 15.7401C8.58519 15.7451 8.32141 15.647 8.12132 15.4459L5.29289 12.6026C4.90237 12.21 4.90237 11.5735 5.29289 11.1809C5.68342 10.7883 6.31658 10.7883 6.70711 11.1809L8.84445 13.3295L13.1032 9.04834C13.4937 8.65576 14.1269 8.65576 14.5174 9.04834C14.9079 9.44092 14.9079 10.0774 14.5174 10.47L9.56767 15.4458C9.36906 15.6455 9.10769 15.7436 8.8474 15.7401Z"
                      fill="#FFEECC"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-semibold">장르</div>
                  <div className="flex flex-1 items-center gap-3 text-[14px] font-medium break-keep">
                    <span>
                      1차장르{" "}
                      <span className="px-1.5 text-lg font-semibold ">
                        {data?.primary_genre}
                      </span>
                    </span>
                    <span>
                      <svg
                        width="8"
                        height="9"
                        viewBox="0 0 8 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="4" cy="4.5" r="4" fill="#D9D9D9" />
                      </svg>
                    </span>
                    <span>
                      2차장르{" "}
                      <span className="px-1.5 text-lg font-semibold">
                        {data?.sub_genre}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FullPageLoader isLoading={isLoading || isFetching} />
    </div>
  );
};
export default DiscoverProductsChart;
