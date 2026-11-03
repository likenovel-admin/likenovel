"use client";

import { useSelectSearchResult } from "@/app/api/query/search";
import Button from "@/components/common/Button";
import { ONBOARDING_SELECTED_TAG_CHIP_CLASS } from "@/components/recommendation/tagChipStyles";
import { resolveProductCoverImage } from "@/constants/common";
import useAuthStore from "@/store/authStore";
import useChatStore from "@/store/chatStore";
import { contentSearchPath, searchTagLabel, type ContentSearchState } from "@/utils/contentSearch";
import { buildListSynopsisPreview } from "@/utils/listSynopsis";
import { buildProductDetailPath, PRODUCT_DETAIL_ENTRY_SOURCE, setPendingProductDetailEntrySource } from "@/utils/productPath";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import OngoingEvent from "./OngoingEvent";
import ArrowDown from "/public/images/arrow-down.svg";
import Close from "/public/images/close.svg";

interface Props {
  initialState: ContentSearchState;
  compact?: boolean;
  onNavigate?: () => void;
  onSearchChange?: () => void;
}

export default function SearchWorkspace({ initialState, compact = false, onNavigate, onSearchChange }: Props) {
  const router = useRouter();
  const inputId = useId();
  const [navigating, startNavigation] = useTransition();
  const { user, authSessionVersion } = useAuthStore();
  const [state, setState] = useState(initialState);
  const [draft, setDraft] = useState(initialState.keyword);
  const [composing, setComposing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, number>>({});
  const [showConditions, setShowConditions] = useState(false);
  const conditionsId = useId();
  const initialKey = JSON.stringify(initialState);

  useEffect(() => {
    const next: ContentSearchState = JSON.parse(initialKey);
    setState(next);
    setDraft(next.keyword);
    setExpandedGroups({});
    setShowConditions(false);
  }, [initialKey]);

  useEffect(() => {
    if (composing) return;
    const timer = window.setTimeout(() => {
      if (state.keyword === draft) return;
      setState((previous) => ({ ...previous, keyword: draft, page: 1 }));
      setExpandedGroups({});
      setShowConditions(false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft, composing, state.keyword]);

  const { data, isPending, isError, refetch } = useSelectSearchResult(
    state, user?.isOnAdult ? "Y" : "N", authSessionVersion, compact ? 6 : 10
  );
  const result = data?.data;
  const waitingForInput = composing || draft !== state.keyword;
  const busy = isPending || waitingForInput;
  const active = Boolean(state.keyword.trim() || state.tags.length);
  const groups = useMemo(() => {
    const grouped = new Map<string, NonNullable<typeof result>["facets"]>();
    for (const facet of result?.facets || []) {
      if (state.tags.includes(facet.id)) continue;
      const group = grouped.get(facet.group);
      if (group) group.push(facet);
      else grouped.set(facet.group, [facet]);
    }
    return Array.from(grouped);
  }, [result?.facets, state.tags]);

  const navigate = (next: ContentSearchState) => {
    onNavigate?.();
    router.push(contentSearchPath(next));
  };
  const changeState = (next: ContentSearchState) => {
    onSearchChange?.();
    setState(next);
    setExpandedGroups({});
    setShowConditions(false);
    if (!compact) startNavigation(() => router.push(contentSearchPath(next), { scroll: false }));
  };
  const toggleTag = (id: string) => changeState({
    ...state, keyword: draft, page: 1,
    tags: state.tags.includes(id) ? state.tags.filter((tag) => tag !== id) : [...state.tags, id].slice(0, 12),
  });

  return (
    <div className="w-full text-black-100 tracking-[-2%] [overflow-wrap:anywhere]">
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!composing) navigate({ ...state, keyword: draft, page: 1 });
      }} className="flex gap-8pxr">
        <label htmlFor={inputId} className="sr-only">작품 검색</label>
        <input id={inputId} type="search" value={draft} maxLength={100}
          placeholder="작품명, 작가명, 이야기 키워드"
          onChange={(event) => setDraft(event.target.value)}
          onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)}
          onKeyDown={(event) => { if (event.key === "Enter" && (event.nativeEvent.isComposing || composing)) event.preventDefault(); }}
          className="min-w-0 flex-1 rounded-[8px] border border-light-gray-600 px-14pxr py-12pxr text-16pxr focus:border-dark-gray-500 focus:outline-none" />
        <button type="submit" disabled={navigating} className="shrink-0 rounded-[8px] bg-primary-100 px-16pxr text-white font-bold hover:bg-primary-200 disabled:opacity-50">검색</button>
      </form>

      <Button type="button" variant="secondary" size="md"
        onClick={() => { onNavigate?.(); useChatStore.getState().setIsOpen(true); }}
        className="mt-12pxr w-full text-dark-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-dark-gray-500">
        AI 사서에게 추천받기
      </Button>

      {state.tags.length > 0 && <div className="mt-12pxr flex flex-wrap gap-8pxr" aria-label="선택한 조건">
        {state.tags.map((id) => <button key={id} type="button" disabled={navigating} onClick={() => toggleTag(id)}
          className={`${ONBOARDING_SELECTED_TAG_CHIP_CLASS} min-h-[36px] max-w-full text-left focus-visible:outline-primary-100 disabled:opacity-50`}
          aria-label={`${result?.selectedTags?.find((tag) => tag.id === id)?.label || searchTagLabel(id)} 조건 해제`}>
          <span className="min-w-0">{result?.selectedTags?.find((tag) => tag.id === id)?.label || searchTagLabel(id)}</span>
          <Close aria-hidden="true" className="h-[10px] w-[10px] shrink-0" />
        </button>)}
        <button type="button" disabled={navigating} onClick={() => changeState({ ...state, keyword: draft, tags: [], page: 1 })} className="text-13pxr underline">조건 초기화</button>
      </div>}

      <div role="status" aria-live="polite" className="mt-20pxr text-14pxr text-dark-gray-500">
        {busy ? "작품을 찾고 있습니다…" : !isError && (active ? `${result?.totalCount ?? 0}개의 작품을 찾았습니다.` : "소재와 분위기를 골라 작품을 찾아보세요.")}
      </div>
      {!waitingForInput && isError && <div role="alert" className="py-16pxr text-14pxr">
        작품을 불러오지 못했습니다.
        <button type="button" onClick={() => void refetch()} className="ml-8pxr text-primary-100 underline">다시 시도</button>
      </div>}

      {!busy && !isError && <>
        {!active && compact && result?.totalCount === 0 && <p className="py-20pxr text-14pxr text-dark-gray-500">아직 검색할 수 있는 작품이 없습니다.</p>}
        {groups.length > 0 && <section aria-label="이야기로 찾아보기" className="mt-16pxr border-b border-light-gray-400 pb-20pxr">
          {active ? <h3><button type="button" aria-expanded={showConditions} aria-controls={conditionsId}
            onClick={() => setShowConditions(!showConditions)}
            className="flex min-h-[40px] w-full items-center justify-between gap-12pxr text-14pxr font-medium focus-visible:outline-primary-100">
            조건 좁히기 <ArrowDown aria-hidden="true" className={`h-[7px] w-[12px] shrink-0 ${showConditions ? "rotate-180" : ""}`} />
          </button></h3> : <h3 className="mb-16pxr text-16pxr font-bold">이야기로 찾아보기</h3>}
          {(!active || showConditions) && <div id={conditionsId} className={`space-y-20pxr ${active ? "mt-16pxr" : ""}`}>
            {groups.map(([group, facets]) => {
              const visibleCount = expandedGroups[group] || 12;
              return <div key={group} role="group" aria-label={group}>
                <p className="mb-8pxr text-13pxr font-medium text-dark-gray-500">{group}</p>
                <div className="flex flex-wrap gap-8pxr">{facets.slice(0, visibleCount).map((facet) =>
                  <button key={facet.id} type="button" disabled={navigating || state.tags.length >= 12} onClick={() => toggleTag(facet.id)}
                    className="min-h-[36px] max-w-full rounded-full border border-light-gray-400 bg-white px-12pxr py-8pxr text-left text-13pxr font-medium text-dark-gray-500 hover:border-primary-100 hover:text-primary-100 focus-visible:outline-primary-100 disabled:cursor-not-allowed disabled:opacity-50">
                    {facet.label}
                  </button>
                )}</div>
                {facets.length > visibleCount && <button type="button" aria-label={`${group} 키워드 더 보기`}
                  onClick={() => setExpandedGroups(previous => ({ ...previous, [group]: visibleCount + 24 }))}
                  className="mt-8pxr inline-flex min-h-[36px] items-center gap-6pxr text-13pxr text-dark-gray-500 hover:text-primary-100 focus-visible:outline-primary-100">
                  더 보기 <ArrowDown aria-hidden="true" className="h-[7px] w-[12px]" />
                </button>}
              </div>;
            })}
          </div>}
        </section>}

        {(active || !compact) && <section aria-label="검색 작품" className="mt-20pxr">
          <div className="mb-12pxr flex items-center justify-between gap-12pxr">
            <h3 className="text-16pxr font-bold">{active ? "검색 결과" : "둘러볼 작품"}</h3>
            <label className="text-13pxr">정렬 <select disabled={navigating} value={state.orderby} onChange={(event) => changeState({ ...state, keyword: draft, orderby: event.target.value === "update" ? "update" : "relevance", page: 1 })}
              className="ml-6pxr rounded border border-light-gray-500 p-1"><option value="relevance">검색 관련순</option><option value="update">최근 업데이트순</option></select></label>
          </div>
          {(result?.products || []).map((product) => <article key={product.productId} className="border-b border-light-gray-400 py-14pxr">
            <button type="button" onClick={() => {
              setPendingProductDetailEntrySource(product.productId, PRODUCT_DETAIL_ENTRY_SOURCE.SEARCH_RESULT);
              onNavigate?.();
              router.push(buildProductDetailPath(product.productId));
            }} className="flex w-full gap-14pxr text-left focus-visible:outline-primary-100">
              <img src={resolveProductCoverImage(product.image?.coverImagePath)} alt="" width={64} height={96} className="h-[96px] w-[64px] shrink-0 rounded-[6px] object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block text-16pxr font-bold">{product.title}</span>
                <span className="mt-4pxr block text-13pxr text-dark-gray-500">{product.authorNickname}</span>
                <span className="mt-6pxr block line-clamp-2 text-14pxr leading-relaxed">{buildListSynopsisPreview(product.synopsis)}</span>
                {product.searchMatchReasons?.length > 0 && <span className="mt-8pxr block text-13pxr text-primary-100">{product.searchMatchReasons.join(" · ")}</span>}
              </span>
            </button>
          </article>)}
          {result && result.totalCount > 0 && result.products.length === 0 && <div className="py-20pxr text-14pxr">
            이 페이지에 표시할 작품이 없습니다.
            <button type="button" disabled={navigating} onClick={() => changeState({ ...state, page: 1 })} className="ml-8pxr text-primary-100 underline">첫 페이지로</button>
          </div>}
          {result?.totalCount === 0 && <p className="py-20pxr text-14pxr text-dark-gray-500">조건에 맞는 작품이 없습니다. 검색어를 줄이거나 선택한 조건을 해제해 보세요.</p>}
          {compact && (result?.totalCount || 0) > 0 && <button type="button" onClick={() => navigate({ ...state, page: 1 })} className="mt-16pxr w-full rounded-[8px] border border-light-gray-600 py-10pxr text-14pxr">전체 {result?.totalCount}개 작품 보기</button>}
          {!compact && (result?.totalCount || 0) > 10 && <nav aria-label="검색 결과 페이지" className="mt-20pxr flex justify-center items-center gap-16pxr">
            <button type="button" disabled={navigating || state.page <= 1} onClick={() => changeState({ ...state, page: state.page - 1 })} className="disabled:opacity-40">이전</button>
            <span>{state.page} / {Math.ceil((result?.totalCount || 0) / 10)}</span>
            <button type="button" disabled={navigating || state.page * 10 >= (result?.totalCount || 0)} onClick={() => changeState({ ...state, page: state.page + 1 })} className="disabled:opacity-40">다음</button>
          </nav>}
        </section>}
        {!compact && (result?.events?.length || 0) > 0 && <div className="mt-28pxr"><OngoingEvent pageType="result" events={result?.events} /></div>}
      </>}
    </div>
  );
}
