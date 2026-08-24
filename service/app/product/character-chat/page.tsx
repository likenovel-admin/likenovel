"use client";

import {
  getMainCharacterSlotsQueryKey,
  useGetCharacterChatCatalog,
} from "@/app/api/query/product";
import type {
  ICharacterChatCatalogItem,
  IGetMainCharacterSlotsResponse,
  IMainCharacterSlotItem,
} from "@/app/api/query/product/dto";
import Spinner from "@/components/common/Spinner";
import SelectBox from "@/components/form/selectbox";
import CharacterChatCardGrid from "@/components/main/CharacterChatCardGrid";
import useAuthStore from "@/store/authStore";
import { getHomeQueryState } from "@/utils/homeQueryState";
import { findPreviousNonMatchingPath } from "@/utils/navigationHistory";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Return from "/public/images/return.svg";
import {
  filterCharacterChatCatalog,
  getCharacterChatCatalogPaging,
  isPersonalizedCharacterChatCatalogScope,
  parseCharacterChatCatalogRole,
  parseCharacterChatCatalogScope,
  parseCharacterChatCatalogSort,
  pinHomeCharacterSlots,
  resolveCharacterChatCatalogScope,
  type CharacterChatCatalogRole,
  type CharacterChatCatalogScope,
  type CharacterChatCatalogSort,
} from "./catalogFilter";

const CATALOG_SCOPE_OPTIONS: Array<{
  label: string;
  value: CharacterChatCatalogScope;
}> = [
  { label: "전체", value: "all" },
  { label: "읽고 있는 작품", value: "reading" },
];

const CATALOG_SORT_OPTIONS: Array<{
  label: string;
  value: CharacterChatCatalogSort;
}> = [
  { label: "추천순", value: "recommended" },
  { label: "등록순", value: "latest" },
];

const CATALOG_ROLE_OPTIONS: Array<{
  label: string;
  value: CharacterChatCatalogRole;
}> = [
  { label: "모든 캐릭터", value: "all" },
  { label: "주인공", value: "main_protagonist" },
  { label: "주요인물", value: "major_character" },
];

const EMPTY_CATALOG_ITEMS: ICharacterChatCatalogItem[] = [];
const EMPTY_SLOT_ITEMS: IMainCharacterSlotItem[] = [];

function CharacterChatCatalogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, accessToken, isAuthInitialized } = useAuthStore();
  const [visibleBatchCount, setVisibleBatchCount] = useState(1);
  const [catalogPaging, setCatalogPaging] = useState(() =>
    getCharacterChatCatalogPaging(
      typeof window === "undefined" ? 0 : window.innerWidth
    )
  );
  const adultYn = user?.isOnAdult ? "Y" : "N";
  const queryState = getHomeQueryState({
    isAuthInitialized,
    isAuthenticated,
    accessToken,
    userId: user?.userId,
  });
  const requestedScope = parseCharacterChatCatalogScope(
    searchParams.get("scope")
  );
  const activeRole = parseCharacterChatCatalogRole(searchParams.get("role"));
  const activeSort = parseCharacterChatCatalogSort(searchParams.get("sort"));
  const isHomeEntry = searchParams.get("from") === "home";
  const canUsePersonalizedScope =
    isAuthInitialized && queryState.productCacheIdentity !== "guest";
  const activeScope = resolveCharacterChatCatalogScope(
    requestedScope,
    canUsePersonalizedScope
  );

  const handleGoBack = () => {
    const previousPath = findPreviousNonMatchingPath([
      /^\/product\/character-chat$/,
    ]);

    if (previousPath) {
      router.push(previousPath);
      return;
    }

    router.push("/");
  };

  useEffect(() => {
    const syncCatalogPaging = () => {
      const nextPaging = getCharacterChatCatalogPaging(window.innerWidth);

      setCatalogPaging((currentPaging) =>
        currentPaging.columnCount === nextPaging.columnCount
          ? currentPaging
          : nextPaging
      );
    };

    syncCatalogPaging();
    window.addEventListener("resize", syncCatalogPaging);

    return () => window.removeEventListener("resize", syncCatalogPaging);
  }, []);

  useEffect(() => {
    setVisibleBatchCount(1);
  }, [activeRole, activeScope, activeSort]);

  const handleScopeChange = useCallback(
    (scope: CharacterChatCatalogScope) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.delete("filter");
      nextSearchParams.delete("from");
      if (scope === "all") {
        nextSearchParams.delete("scope");
      } else {
        nextSearchParams.set("scope", scope);
      }
      const queryString = nextSearchParams.toString();
      const targetPath = `${window.location.pathname}${
        queryString ? `?${queryString}` : ""
      }`;

      if (
        isPersonalizedCharacterChatCatalogScope(scope) &&
        !canUsePersonalizedScope
      ) {
        router.push(
          `/login?modal=open&redirect=${encodeURIComponent(targetPath)}`,
          { scroll: false }
        );
        return;
      }

      router.replace(targetPath, { scroll: false });
    },
    [canUsePersonalizedScope, router, searchParams]
  );

  const handleSortChange = useCallback(
    (sort: CharacterChatCatalogSort) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.delete("filter");
      nextSearchParams.delete("from");
      if (sort === "recommended") {
        nextSearchParams.delete("sort");
      } else {
        nextSearchParams.set("sort", sort);
      }
      const queryString = nextSearchParams.toString();
      const targetPath = `${window.location.pathname}${
        queryString ? `?${queryString}` : ""
      }`;

      router.replace(targetPath, { scroll: false });
    },
    [router, searchParams]
  );

  const handleRoleChange = useCallback(
    (role: CharacterChatCatalogRole) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.delete("filter");
      nextSearchParams.delete("from");
      if (role === "all") {
        nextSearchParams.delete("role");
      } else {
        nextSearchParams.set("role", role);
      }
      const queryString = nextSearchParams.toString();
      const targetPath = `${window.location.pathname}${
        queryString ? `?${queryString}` : ""
      }`;

      router.replace(targetPath, { scroll: false });
    },
    [router, searchParams]
  );

  const handleFilterReset = useCallback(() => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("filter");
    nextSearchParams.delete("from");
    nextSearchParams.delete("scope");
    nextSearchParams.delete("role");
    const queryString = nextSearchParams.toString();
    const targetPath = `${window.location.pathname}${
      queryString ? `?${queryString}` : ""
    }`;

    router.replace(targetPath, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (
      isAuthInitialized &&
      isPersonalizedCharacterChatCatalogScope(requestedScope) &&
      queryState.productCacheIdentity === "guest"
    ) {
      handleScopeChange("all");
    }
  }, [
    handleScopeChange,
    isAuthInitialized,
    queryState.productCacheIdentity,
    requestedScope,
  ]);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch: refetchCatalog,
  } = useGetCharacterChatCatalog(
    adultYn,
    queryState.enabled,
    queryState.productCacheIdentity
  );
  const slotSeedItems =
    queryClient.getQueryData<IGetMainCharacterSlotsResponse>(
      getMainCharacterSlotsQueryKey(
        adultYn,
        queryState.productCacheIdentity
      )
    )?.data ?? EMPTY_SLOT_ITEMS;
  const items = data?.data ?? EMPTY_CATALOG_ITEMS;
  const filteredItems = useMemo(
    () =>
      filterCharacterChatCatalog(items, activeScope, activeRole, activeSort),
    [activeRole, activeScope, activeSort, items]
  );
  const isDefaultCatalogView =
    activeScope === "all" &&
    activeRole === "all" &&
    activeSort === "recommended";
  const canUseHomeSeed =
    isHomeEntry &&
    isDefaultCatalogView &&
    slotSeedItems.length > 0;
  const orderedItems = useMemo(
    () =>
      canUseHomeSeed
        ? pinHomeCharacterSlots(slotSeedItems, filteredItems)
        : filteredItems,
    [canUseHomeSeed, filteredItems, slotSeedItems]
  );
  const visibleItemCount = catalogPaging.batchSize * visibleBatchCount;
  const visibleItems = useMemo(
    () => orderedItems.slice(0, visibleItemCount),
    [orderedItems, visibleItemCount]
  );
  const showLoading =
    (!queryState.enabled || isLoading) && !canUseHomeSeed;
  const showError = isError && !canUseHomeSeed;
  const showGrid = !showLoading && !showError && orderedItems.length > 0;

  return (
    <main className="w-full px-16pxr md:px-24pxr lg:px-32pxr">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="mb-24pxr md:mb-30pxr">
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
          <h1 className="whitespace-nowrap text-20pxr font-bold leading-[28px] text-black-100 md:text-22pxr md:leading-[30px]">
            내가 읽은 시점의 주인공과 대화
          </h1>
          <p className="mt-6pxr text-14pxr leading-[20px] text-dark-gray-500">
            매일 무료로 즐길 수 있어요.
          </p>
          <div className="mt-16pxr flex flex-col gap-8pxr md:flex-row md:items-center">
            <nav
              aria-label="작품 범위"
              className="hidden items-center gap-8pxr md:flex"
            >
              {CATALOG_SCOPE_OPTIONS.map((scope) => (
                <button
                  key={scope.value}
                  type="button"
                  aria-pressed={activeScope === scope.value}
                  onClick={() => handleScopeChange(scope.value)}
                  disabled={
                    isPersonalizedCharacterChatCatalogScope(scope.value) &&
                    !isAuthInitialized
                  }
                  className={`min-h-[36px] shrink-0 rounded-[8px] border px-12pxr py-7pxr text-13pxr font-medium transition-colors disabled:cursor-wait disabled:opacity-50 ${
                    activeScope === scope.value
                      ? "border-black-100 bg-black-100 text-white"
                      : "border-light-gray-400 bg-white text-dark-gray-500 hover:border-dark-gray-300 hover:text-black-100"
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </nav>
            <div className="md:hidden">
              <SelectBox
                ariaLabel="작품 범위 선택"
                options={CATALOG_SCOPE_OPTIONS.map((scope) => ({
                  ...scope,
                  disabled:
                    isPersonalizedCharacterChatCatalogScope(scope.value) &&
                    !isAuthInitialized,
                }))}
                value={activeScope}
                onChange={(event) =>
                  handleScopeChange(
                    event.target.value as CharacterChatCatalogScope
                  )
                }
                className="h-[36px] w-[152px] text-13pxr text-black-100"
              />
            </div>
            <div className="flex items-center justify-end gap-8pxr md:ml-auto">
              <SelectBox
                ariaLabel="캐릭터 역할 선택"
                options={CATALOG_ROLE_OPTIONS}
                value={activeRole}
                onChange={(event) =>
                  handleRoleChange(
                    event.target.value as CharacterChatCatalogRole
                  )
                }
                className="h-[36px] w-[128px] text-13pxr text-black-100"
              />
              <SelectBox
                ariaLabel="정렬 방식 선택"
                options={CATALOG_SORT_OPTIONS}
                value={activeSort}
                onChange={(event) =>
                  handleSortChange(
                    event.target.value as CharacterChatCatalogSort
                  )
                }
                className="h-[36px] w-[104px] text-13pxr text-black-100 md:w-[112px]"
              />
            </div>
          </div>
        </header>

        {showLoading && (
          <div className="flex min-h-[320px] items-center justify-center">
            <Spinner />
          </div>
        )}
        {showError && (
          <div
            role="alert"
            className="flex min-h-[240px] flex-col items-center justify-center gap-12pxr text-14pxr text-dark-gray-500"
          >
            <p>주인공챗 목록을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => void refetchCatalog()}
              disabled={isFetching}
              className="font-medium text-primary-100 underline underline-offset-4 disabled:text-dark-gray-300"
            >
              {isFetching ? "불러오는 중..." : "다시 불러오기"}
            </button>
          </div>
        )}
        {!showLoading &&
          !showError &&
          !canUseHomeSeed &&
          items.length === 0 && (
          <div className="flex min-h-[240px] items-center justify-center text-14pxr text-dark-gray-500">
            지금 대화할 수 있는 캐릭터가 없어요.
          </div>
        )}
        {!showLoading &&
          !showError &&
          items.length > 0 &&
          filteredItems.length === 0 && (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-12pxr text-14pxr text-dark-gray-500">
              <p>이 조건에 맞는 작품이 없어요.</p>
              <button
                type="button"
                onClick={handleFilterReset}
                className="rounded-[8px] border border-light-gray-400 bg-white px-12pxr py-7pxr font-medium text-black-100 hover:border-dark-gray-300"
              >
                필터 초기화
              </button>
            </div>
          )}
        {showGrid && (
          <>
            <CharacterChatCardGrid
              items={visibleItems}
              priorityItemCount={4}
              adultYn={adultYn}
              entrySource="character_catalog"
              imageSizes="(max-width: 767px) 46vw, (max-width: 1023px) 23vw, (max-width: 1279px) 18vw, 170px"
              className="grid grid-cols-2 gap-x-10pxr gap-y-20pxr md:grid-cols-4 md:gap-x-20pxr lg:grid-cols-5 xl:grid-cols-6"
            />
            {canUseHomeSeed && data === undefined && !isError && (
              <p role="status" className="sr-only">
                전체 목록을 불러오는 중입니다.
              </p>
            )}
            {canUseHomeSeed && isError && (
              <div
                role="alert"
                className="mt-24pxr flex items-center justify-center gap-8pxr text-13pxr text-dark-gray-500"
              >
                <span>전체 목록을 불러오지 못했어요.</span>
                <button
                  type="button"
                  onClick={() => void refetchCatalog()}
                  disabled={isFetching}
                  className="font-medium text-primary-100 underline underline-offset-4 disabled:text-dark-gray-300"
                >
                  {isFetching ? "불러오는 중..." : "다시 불러오기"}
                </button>
              </div>
            )}
            {visibleItems.length < orderedItems.length && (
              <div className="mt-28pxr flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleBatchCount(
                      (currentCount) => currentCount + 1
                    )
                  }
                  className="h-[44px] rounded-[8px] border border-light-gray-400 bg-white px-20pxr text-14pxr font-medium text-black-100 hover:border-dark-gray-300"
                >
                  캐릭터 더 보기
                </button>
              </div>
              )}
          </>
        )}
      </div>
    </main>
  );
}

export default function CharacterChatCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <CharacterChatCatalogPageContent />
    </Suspense>
  );
}
