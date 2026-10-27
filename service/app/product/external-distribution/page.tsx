"use client";

import { useGetExternalDistributionProductsInfinite } from "@/app/api/query/product";
import BoxProductList from "@/components/common/BoxProductList";
import Spinner from "@/components/common/Spinner";
import Tab from "@/components/common/Tab";
import {
  buildExternalDistributionDescription,
  buildExternalDistributionPath,
  EXTERNAL_DISTRIBUTION_PLATFORM_ORDER,
  EXTERNAL_DISTRIBUTION_PLATFORMS,
  parseExternalDistributionPlatform,
} from "@/constants/externalDistribution";
import useAuthStore from "@/store/authStore";
import { getHomeQueryState } from "@/utils/homeQueryState";
import { findPreviousNonMatchingPath } from "@/utils/navigationHistory";
import { PRODUCT_DETAIL_ENTRY_SOURCE } from "@/utils/productPath";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef } from "react";
import Return from "/public/images/return.svg";

const PLATFORM_TABS = EXTERNAL_DISTRIBUTION_PLATFORM_ORDER.map((platform) => ({
  label: EXTERNAL_DISTRIBUTION_PLATFORMS[platform].label,
  value: platform,
}));

function ExternalDistributionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const platform = parseExternalDistributionPlatform(
    searchParams.get("platform")
  );
  const platformLabel = EXTERNAL_DISTRIBUTION_PLATFORMS[platform].label;
  const { user, isAuthenticated, accessToken, isAuthInitialized } =
    useAuthStore();
  const adultYn = user?.isOnAdult ? "Y" : "N";
  const queryState = getHomeQueryState({
    isAuthInitialized,
    isAuthenticated,
    accessToken,
    userId: user?.userId,
  });
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetExternalDistributionProductsInfinite(
    platform,
    adultYn,
    queryState.enabled,
    queryState.productCacheIdentity
  );
  const products = useMemo(
    () => data?.pages.flatMap((page) => page?.data?.products ?? []) ?? [],
    [data]
  );
  const minOpenEpisodes = data?.pages[0]?.data?.minOpenEpisodes;
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasNextPage || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "400px 0px", threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleGoBack = () => {
    const previousPath = findPreviousNonMatchingPath([
      /^\/product\/external-distribution(?:[?#]|$)/,
    ]);
    router.push(previousPath || "/");
  };

  const handleTabChange = (value: string) => {
    router.replace(
      buildExternalDistributionPath(parseExternalDistributionPlatform(value)),
      { scroll: false }
    );
  };

  const showLoading = !queryState.enabled || isLoading;

  return (
    <main className="w-full">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="mb-20pxr px-16pxr md:mb-30pxr md:px-0">
          <button
            type="button"
            aria-label="이전 페이지"
            onClick={handleGoBack}
            className="mb-15pxr flex items-center gap-6pxr text-dark-gray-500 outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2 md:mt-10pxr"
          >
            <Return
              aria-hidden="true"
              className="h-auto w-[10px] md:h-[18px] md:w-[17px]"
            />
            <span className="text-13pxr md:text-15pxr">이전 페이지</span>
          </button>
          <h1 className="text-20pxr font-bold leading-[28px] text-black-100 md:text-22pxr md:leading-[30px]">
            {platformLabel}에서도 연재되는 작품
          </h1>
          {minOpenEpisodes ? (
            <p className="mt-6pxr text-14pxr leading-[20px] text-dark-gray-500">
              {buildExternalDistributionDescription(platform, minOpenEpisodes)}
            </p>
          ) : null}
          <div className="mt-16pxr">
            <Tab
              tabs={PLATFORM_TABS}
              style="black"
              activeTab={platform}
              onTabChange={handleTabChange}
            />
          </div>
        </header>

        {showLoading && (
          <div className="flex min-h-[320px] items-center justify-center">
            <Spinner />
          </div>
        )}
        {!showLoading && isError && (
          <div
            role="alert"
            className="flex min-h-[240px] flex-col items-center justify-center gap-12pxr text-14pxr text-dark-gray-500"
          >
            <p>작품 목록을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="font-medium text-primary-100 underline underline-offset-4 disabled:text-dark-gray-300"
            >
              {isFetching ? "불러오는 중..." : "다시 불러오기"}
            </button>
          </div>
        )}
        {!showLoading && !isError && products.length === 0 && (
          <p className="flex min-h-[240px] items-center justify-center text-14pxr text-dark-gray-500">
            아직 {platformLabel}에서 연재 중인 작품이 없어요.
          </p>
        )}
        {!showLoading && !isError && products.length > 0 && (
          <BoxProductList
            data={products}
            pageType="paid"
            entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.EXTERNAL_DISTRIBUTION_LIST}
            externalPlatform={platform}
          />
        )}
        <div ref={observerTarget} className="h-[1px]" aria-hidden="true" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-20pxr">
            <Spinner />
          </div>
        )}
      </div>
    </main>
  );
}

export default function ExternalDistributionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <ExternalDistributionContent />
    </Suspense>
  );
}
