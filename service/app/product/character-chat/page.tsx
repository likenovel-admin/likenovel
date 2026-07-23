"use client";

import { useGetCharacterChatCatalog } from "@/app/api/query/product";
import type { ICharacterChatCatalogItem } from "@/app/api/query/product/dto";
import Spinner from "@/components/common/Spinner";
import SelectBox from "@/components/form/selectbox";
import CharacterChatCardGrid from "@/components/main/CharacterChatCardGrid";
import type { CharacterChatPreviewDetail } from "@/components/main/CharacterChatPreviewModal";
import useAuthStore from "@/store/authStore";
import { getHomeQueryState } from "@/utils/homeQueryState";
import { findPreviousNonMatchingPath } from "@/utils/navigationHistory";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Return from "/public/images/return.svg";
import {
  filterCharacterChatCatalog,
  isPersonalizedCharacterChatCatalogScope,
  parseCharacterChatCatalogScope,
  parseCharacterChatCatalogSort,
  resolveCharacterChatCatalogScope,
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

const LOCAL_MOCK_CHARACTERS: Array<[string, string]> = [
  ["윤서하", "마지막 황녀의 기록"],
  ["강이든", "검은 달의 기사"],
  ["한설", "빙결 마탑의 후계자"],
  ["서주원", "회귀한 공작의 계약"],
  ["차도윤", "폐허 위의 성좌"],
  ["유리아", "악녀는 오늘도 살아남는다"],
  ["백하린", "황궁의 비밀 정원"],
  ["진태오", "북부 대공의 그림자"],
  ["오세린", "나를 기억하는 세계"],
  ["권시우", "시간을 걷는 검사"],
  ["나예린", "봄밤의 마법사"],
  ["류하준", "SS급 헌터의 귀환"],
  ["문채아", "공작가의 가짜 영애"],
  ["신유진", "멸망 이후의 서점"],
  ["정라온", "달빛 아래의 맹세"],
  ["고해준", "회귀자의 두 번째 선택"],
  ["임수아", "별을 삼킨 아이"],
  ["최이안", "엔딩을 바꾸는 독자"],
];

const LOCAL_MOCK_PERSONALITIES = [
  ["신중함", "책임감이 강함"],
  ["직설적", "결단력이 있음"],
  ["차분함", "호기심이 많음"],
  ["냉철함", "자기 사람을 챙김"],
];

const LOCAL_MOCK_SPEECH_STYLES = [
  { tone: ["차분한", "단정한"], formality: "상황에 따라", sentenceLength: "보통" },
  { tone: ["단호한"], formality: "반말", sentenceLength: "짧게 끊는" },
  { tone: ["다정한"], formality: "존댓말", sentenceLength: "보통" },
  { tone: ["냉소적인", "담담한"], formality: "상황에 따라", sentenceLength: "짧게 끊는" },
];

const LOCAL_MOCK_ITEMS: ICharacterChatCatalogItem[] =
  LOCAL_MOCK_CHARACTERS.map(([characterName, productTitle], index) => {
    const hasReadingProgress = index % 3 !== 2;

    return {
      characterSlotId: index + 1,
      productId: 7000 + index,
      characterScopeKey:
        index === 0 ? "character:윤서하" : `local_mock_character_${index + 1}`,
      characterName,
      characterImagePath: `/images/covers/cover_${String(index + 1).padStart(2, "0")}.jpg`,
      cardOrder: index + 1,
      createdDate: `2026-07-${String(22 - index).padStart(2, "0")}T09:00:00+09:00`,
      productTitle,
      authorNickname: `목업작가${index + 1}`,
      syncedLatestEpisodeNo: index === 0 ? 5 : 12 + index * 3,
      entryEpisodeNo: 1,
      chatQuality: index % 4 === 3 ? "normal" : "good",
      fullReady: index % 4 !== 3,
      readinessCoverageRatio: Math.max(0.25, 1 - index * 0.04),
      distinctEpisodeCount: index % 4 === 3 ? 1 : 3,
      exampleCount: index % 4 === 3 ? 2 : 6,
      sceneCount: index % 4 === 3 ? 1 : 3,
      personalityCore:
        LOCAL_MOCK_PERSONALITIES[index % LOCAL_MOCK_PERSONALITIES.length],
      speechStyle:
        LOCAL_MOCK_SPEECH_STYLES[index % LOCAL_MOCK_SPEECH_STYLES.length],
      lastViewedEpisodeNo: hasReadingProgress
        ? index === 0
          ? 5
          : Math.max(1, 9 + index * 2)
        : null,
      lastViewedAt: hasReadingProgress
        ? `2026-07-${String(22 - index).padStart(2, "0")}T12:00:00+09:00`
        : null,
    };
  });

const LOCAL_MOCK_READ_EPISODE_BY_PRODUCT = Object.fromEntries(
  LOCAL_MOCK_ITEMS.map((item) => [
    item.productId,
    item.lastViewedEpisodeNo ?? 0,
  ])
);

const LOCAL_MOCK_SCENE_TEASERS = [
  (name: string) =>
    `봉인된 황궁 기록실 앞에서 마지막 단서를 쥔 ${name}가 낯선 당신을 경계합니다.`,
  (name: string) =>
    `빗속 추격전 끝에 ${name}가 쓰러진 당신에게 검끝을 겨눕니다.`,
  (name: string) =>
    `얼어붙은 마탑 최상층에서 금지된 주문서를 펼치려던 ${name}가 당신을 발견합니다.`,
  (name: string) =>
    `회귀 전에는 없었던 편지 한 장을 받은 ${name}가 발신인인 당신을 찾아옵니다.`,
];

const LOCAL_MOCK_ROLE_LABELS = [
  "마지막 황녀",
  "검은 달의 기사",
  "빙결 마탑 후계자",
  "회귀한 공작",
];

const LOCAL_MOCK_PREVIEW_DETAIL_BY_PRODUCT: Record<
  number,
  CharacterChatPreviewDetail
> = Object.fromEntries(
  LOCAL_MOCK_ITEMS.map((item, index) => [
    item.productId,
    {
      roleLabel: LOCAL_MOCK_ROLE_LABELS[index % LOCAL_MOCK_ROLE_LABELS.length],
      aliases: index === 0 ? ["서하 황녀", "북궁의 주인"] : [],
      sceneTeaser:
        LOCAL_MOCK_SCENE_TEASERS[index % LOCAL_MOCK_SCENE_TEASERS.length](
          item.characterName
        ),
    },
  ])
);

function CharacterChatCatalogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, accessToken, isAuthInitialized } = useAuthStore();
  const [localMockEnabled, setLocalMockEnabled] = useState<boolean | null>(null);
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
  const activeSort = parseCharacterChatCatalogSort(searchParams.get("sort"));
  const canUsePersonalizedScope =
    localMockEnabled === true ||
    (isAuthInitialized && queryState.productCacheIdentity !== "guest");
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
    const isLocalMock =
      window.location.hostname === "localhost" &&
      searchParams.get("mock") === "1";

    setLocalMockEnabled(isLocalMock);
  }, [searchParams]);

  const handleScopeChange = useCallback(
    (scope: CharacterChatCatalogScope) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.delete("filter");
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

  useEffect(() => {
    if (
      isAuthInitialized &&
      localMockEnabled === false &&
      isPersonalizedCharacterChatCatalogScope(requestedScope) &&
      queryState.productCacheIdentity === "guest"
    ) {
      handleScopeChange("all");
    }
  }, [
    handleScopeChange,
    isAuthInitialized,
    localMockEnabled,
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
    queryState.enabled && localMockEnabled === false,
    queryState.productCacheIdentity
  );
  const items = localMockEnabled
    ? LOCAL_MOCK_ITEMS
    : data?.data ?? [];
  const filteredItems = filterCharacterChatCatalog(
    items,
    activeScope,
    activeSort
  );
  const showLoading = localMockEnabled === null || isLoading;
  const showError = localMockEnabled === false && isError;

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
          <div className="mt-16pxr flex items-center justify-between gap-8pxr">
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
                    !isAuthInitialized &&
                    localMockEnabled !== true
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
                    !isAuthInitialized &&
                    localMockEnabled !== true,
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
            <div className="ml-auto">
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
        {!showLoading && !showError && items.length === 0 && (
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
                onClick={() => handleScopeChange("all")}
                className="rounded-[8px] border border-light-gray-400 bg-white px-12pxr py-7pxr font-medium text-black-100 hover:border-dark-gray-300"
              >
                전체 보기
              </button>
            </div>
          )}
        {!showLoading && !showError && filteredItems.length > 0 && (
          <CharacterChatCardGrid
            items={filteredItems}
            adultYn={adultYn}
            entrySource="character_catalog"
            previewReadEpisodeByProduct={
              localMockEnabled ? LOCAL_MOCK_READ_EPISODE_BY_PRODUCT : undefined
            }
            previewDetailByProduct={
              localMockEnabled
                ? LOCAL_MOCK_PREVIEW_DETAIL_BY_PRODUCT
                : undefined
            }
            imageSizes="(max-width: 767px) 46vw, (max-width: 1023px) 23vw, (max-width: 1279px) 18vw, 170px"
            className="grid grid-cols-2 gap-x-10pxr gap-y-20pxr md:grid-cols-4 md:gap-x-20pxr lg:grid-cols-5 xl:grid-cols-6"
          />
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
