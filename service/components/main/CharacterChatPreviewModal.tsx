"use client";

import {
  getEpisodeListQueryOptions,
  useGetCharacterChatPreview,
} from "@/app/api/query/product";
import type {
  ICharacterChatPreview,
  IMainCharacterSlotItem,
} from "@/app/api/query/product/dto";
import BottomSheetContainer from "@/components/common/BottomSheetContainer";
import ModalContainer from "@/components/common/ModalContainer";
import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import useMediaDevice from "@/hooks/useMediaDevice";
import { resolveCharacterChatEpisodeScope } from "@/utils/characterChatEpisodeScope";
import { getWebsochatErrorStatus } from "@/utils/websochatError";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type CharacterChatReadScopeStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error";

export interface CharacterChatPreviewDetail {
  roleLabel?: string;
  aliases?: string[];
  sceneTeaser?: string;
}

interface Props {
  item: IMainCharacterSlotItem | null;
  isLaunching: boolean;
  mockReadEpisodeNo?: number;
  previewDetail?: CharacterChatPreviewDetail;
  onLaunch: (item: IMainCharacterSlotItem, readEpisodeNo: number) => void;
  onGoToProduct: (item: IMainCharacterSlotItem) => void;
  onClose: () => void;
}

const CharacterChatPreviewContent = ({
  item,
  isLaunching,
  readScopeStatus,
  accountReadEpisodeNo,
  entryEpisodeNo,
  initialReadEpisodeNo,
  maxSelectableEpisodeNo,
  selectableEpisodeNos,
  previewDetail,
  onLaunch,
  onGoToProduct,
}: Omit<Props, "item" | "onClose" | "mockReadEpisodeNo"> & {
  item: IMainCharacterSlotItem;
  readScopeStatus: CharacterChatReadScopeStatus;
  accountReadEpisodeNo: number | null;
  entryEpisodeNo: number;
  initialReadEpisodeNo: number;
  maxSelectableEpisodeNo: number;
  selectableEpisodeNos: number[];
}) => {
  const characterImage = resolveProductCoverImage(item.characterImagePath);
  const isDefaultImage = characterImage === DEFAULT_PRODUCT_IMAGE;
  const authorName = String(item.authorNickname || "").trim();
  const [selectedEpisodeNo, setSelectedEpisodeNo] = useState(
    Math.max(initialReadEpisodeNo, entryEpisodeNo)
  );
  const isReadScopeLoading = readScopeStatus === "loading";
  const {
    data: previewResponse,
    error: previewError,
    isError: isPreviewError,
    isFetching: isPreviewFetching,
    isLoading: isPreviewLoading,
    isPlaceholderData,
    refetch: refetchPreview,
  } = useGetCharacterChatPreview(
    item.productId,
    item.characterScopeKey,
    selectedEpisodeNo,
    readScopeStatus === "ready" && !previewDetail
  );
  const lastSuccessfulPreviewRef = useRef<{
    productId: number;
    characterScopeKey: string;
    data: ICharacterChatPreview;
  } | null>(null);
  const currentApiPreview = previewResponse?.data;

  useEffect(() => {
    if (!currentApiPreview || isPlaceholderData || isPreviewError) return;
    lastSuccessfulPreviewRef.current = {
      productId: item.productId,
      characterScopeKey: item.characterScopeKey,
      data: currentApiPreview,
    };
  }, [
    currentApiPreview,
    isPlaceholderData,
    isPreviewError,
    item.characterScopeKey,
    item.productId,
  ]);

  const retainedApiPreview =
    lastSuccessfulPreviewRef.current?.productId === item.productId &&
    lastSuccessfulPreviewRef.current.characterScopeKey === item.characterScopeKey
      ? lastSuccessfulPreviewRef.current.data
      : undefined;
  const apiPreview = currentApiPreview || retainedApiPreview;
  const roleLabel = String(
    apiPreview?.roleLabel || previewDetail?.roleLabel || ""
  ).trim();
  const aliases = (apiPreview?.aliases || previewDetail?.aliases || [])
    .filter(Boolean)
    .slice(0, 2);
  const sceneTeaser = String(previewDetail?.sceneTeaser || "").trim();
  const personalityCore = (
    apiPreview?.personalityCore ||
    item.personalityCore ||
    []
  )
    .filter(Boolean)
    .slice(0, 2);
  const speechStyle = apiPreview?.speechStyle || item.speechStyle || {};
  const speechStyleTags = [
    ...(speechStyle.tone || []),
    speechStyle.formality,
    speechStyle.sentenceLength,
  ].filter((value): value is string => Boolean(value));
  const sceneEpisodeNo = apiPreview?.episodeNo || selectedEpisodeNo;
  const episodeSummary = String(apiPreview?.episodeSummary || "").trim();
  const sceneSummary = String(apiPreview?.sceneSummary || "").trim();
  const sceneExcerpt = String(apiPreview?.sceneExcerpt || "").trim();
  const hasStablePreview = Boolean(apiPreview);
  const isPreviewUnavailable = isPreviewError && !isPreviewFetching;
  const previewErrorStatus = getWebsochatErrorStatus(previewError);
  const isPreviewNotFound =
    isPreviewUnavailable && previewErrorStatus === 404;
  const isSceneRefreshing =
    isPlaceholderData ||
    (isPreviewLoading && hasStablePreview) ||
    (isPreviewError && isPreviewFetching);
  const isSceneStatusVisible = isSceneRefreshing || isPreviewUnavailable;
  const shouldShowInitialLoader = isPreviewLoading && !hasStablePreview;
  const sceneStatusContent = isSceneStatusVisible ? (
    <>
      <p role="status">
        {isPreviewNotFound
          ? "장면 미리보기는 준비 중이지만 대화는 시작할 수 있어요."
          : isPreviewUnavailable
          ? `${selectedEpisodeNo}화 장면을 불러오지 못했어요.`
          : `${selectedEpisodeNo}화 장면을 불러오는 중이에요.`}
      </p>
      {isPreviewUnavailable && !isPreviewNotFound && (
        <button
          type="button"
          onClick={() => void refetchPreview()}
          className="mt-10pxr text-13pxr font-medium text-primary-100 underline underline-offset-4"
        >
          다시 시도
        </button>
      )}
    </>
  ) : null;

  useEffect(() => {
    setSelectedEpisodeNo(Math.max(initialReadEpisodeNo, entryEpisodeNo));
  }, [entryEpisodeNo, initialReadEpisodeNo, item.characterSlotId]);

  const readScopeDescription = (() => {
    if (isReadScopeLoading) return "최근 읽은 회차를 확인하고 있어요.";
    if (readScopeStatus === "error") {
      return `읽은 기록을 불러오지 못해 ${entryEpisodeNo}화 시점으로 설정했어요.`;
    }
    if (!accountReadEpisodeNo) {
      return `읽은 기록이 없어 ${entryEpisodeNo}화 시점으로 시작해요.`;
    }
    if (accountReadEpisodeNo < entryEpisodeNo) {
      return `최근 읽은 기록은 ${accountReadEpisodeNo}화지만 주인공챗은 ${entryEpisodeNo}화부터 시작해요.`;
    }
    if (accountReadEpisodeNo > maxSelectableEpisodeNo) {
      return `최근 읽은 기록은 ${accountReadEpisodeNo}화지만 주인공챗은 ${maxSelectableEpisodeNo}화까지 준비됐어요.`;
    }
    return `최근 읽은 기록 ${accountReadEpisodeNo}화를 기본으로 설정했어요.`;
  })();

  return (
    <div className="flex h-[calc(100dvh-48px)] max-h-[calc(100dvh-48px)] w-full flex-col overflow-hidden md:h-auto md:max-h-[80dvh] md:w-[600px]">
      <div
        className="min-h-0 flex-1 overflow-y-auto touch-pan-y overscroll-y-contain px-20pxr pb-20pxr [-webkit-overflow-scrolling:touch] md:px-30pxr md:pb-30pxr"
        onWheel={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-18pxr md:gap-28pxr">
          <div className="relative aspect-[364/414] w-[clamp(148px,42vw,160px)] shrink-0 overflow-hidden rounded-[10px] bg-light-gray-100 md:w-[220px]">
            <Image
              src={characterImage}
              alt={item.characterName}
              fill
              sizes="(max-width: 767px) 160px, 220px"
              unoptimized={isDefaultImage}
              className="object-cover [object-position:50%_12%]"
            />
            {item.syncedLatestEpisodeNo > 0 && (
              <span className="absolute right-8pxr top-8pxr rounded-full bg-black/70 px-8pxr py-4pxr text-11pxr font-medium leading-[14px] text-white">
                {item.syncedLatestEpisodeNo}화까지 준비
              </span>
            )}
            {isLaunching && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-2pxr md:pt-8pxr">
            <p className="break-words text-19pxr font-bold leading-[26px] text-black-100 md:text-22pxr md:leading-[30px]">
              {item.characterName}
            </p>
            <p className="mt-8pxr break-words text-14pxr font-medium leading-[20px] text-dark-gray-500 md:text-15pxr">
              {item.productTitle}
            </p>
            {authorName && (
              <p className="mt-4pxr text-13pxr leading-[18px] text-dark-gray-400">
                {authorName}
              </p>
            )}
            {(roleLabel || aliases.length > 0) && (
              <div className="mt-12pxr flex flex-wrap items-center gap-x-8pxr gap-y-5pxr">
                {roleLabel && (
                  <span className="rounded-[4px] bg-light-gray-100 px-7pxr py-4pxr text-11pxr font-medium leading-[14px] text-dark-gray-500">
                    {roleLabel}
                  </span>
                )}
                {aliases.length > 0 && (
                  <span className="text-12pxr leading-[17px] text-dark-gray-500">
                    {aliases.join(" · ")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {(personalityCore.length > 0 || speechStyleTags.length > 0) && (
          <div className="mt-16pxr grid gap-8pxr md:grid-cols-2">
            {personalityCore.length > 0 && (
              <div className="rounded-[10px] bg-light-gray-100 px-14pxr py-12pxr">
                <p className="text-12pxr font-medium leading-[17px] text-dark-gray-400">
                  성격
                </p>
                <p className="mt-5pxr break-words text-14pxr leading-[20px] text-black-100">
                  {personalityCore.join(" · ")}
                </p>
              </div>
            )}
            {speechStyleTags.length > 0 && (
              <div className="rounded-[10px] bg-light-gray-100 px-14pxr py-12pxr">
                <p className="text-12pxr font-medium leading-[17px] text-dark-gray-400">
                  대화 스타일
                </p>
                <p className="mt-5pxr break-words text-14pxr leading-[20px] text-black-100">
                  {speechStyleTags.join(" · ")}
                </p>
              </div>
            )}
          </div>
        )}

        {shouldShowInitialLoader && (
          <div className="mt-16pxr border-t border-light-gray-400 pt-16pxr text-center text-13pxr text-dark-gray-400">
            {selectedEpisodeNo}화 장면을 불러오는 중이에요.
          </div>
        )}

        {!shouldShowInitialLoader && (sceneSummary || sceneExcerpt) && (
          <section className="relative mt-16pxr border-t border-light-gray-400 pt-16pxr">
            <div
              className={isSceneStatusVisible ? "invisible" : undefined}
              aria-hidden={isSceneStatusVisible}
            >
              <p className="text-13pxr font-bold leading-[18px] text-primary-100">
                {sceneEpisodeNo}화{apiPreview?.episodeTitle ? ` · ${apiPreview.episodeTitle}` : ""}
              </p>
              {episodeSummary && (
                <div className="mt-12pxr">
                  <p className="text-12pxr font-medium leading-[17px] text-dark-gray-400">
                    이 회차 이야기
                  </p>
                  <p className="mt-5pxr break-words text-14pxr leading-[21px] text-black-100">
                    {episodeSummary}
                  </p>
                </div>
              )}
              {sceneSummary && (
                <div className="mt-12pxr">
                  <p className="text-12pxr font-medium leading-[17px] text-dark-gray-400">
                    장면 요약
                  </p>
                  <p className="mt-5pxr break-words text-15pxr leading-[23px] text-black-100">
                    {sceneSummary}
                  </p>
                </div>
              )}
              {sceneExcerpt && (
                <div className="mt-14pxr rounded-[8px] bg-light-gray-100 px-14pxr py-12pxr">
                  <p className="text-12pxr font-medium leading-[17px] text-dark-gray-400">
                    원문 장면
                  </p>
                  <p className="mt-6pxr whitespace-pre-line break-words text-14pxr leading-[22px] text-dark-gray-600">
                    {sceneExcerpt}
                  </p>
                </div>
              )}
            </div>
            {isSceneStatusVisible && (
              <div className="absolute inset-0 flex flex-col items-center justify-start bg-white pt-16pxr text-13pxr text-dark-gray-400">
                {sceneStatusContent}
              </div>
            )}
          </section>
        )}

        {!shouldShowInitialLoader && !sceneSummary && !sceneExcerpt && sceneTeaser && (
          <section className="relative mt-16pxr border-t border-light-gray-400 pt-16pxr">
            <div
              className={isSceneStatusVisible ? "invisible" : undefined}
              aria-hidden={isSceneStatusVisible}
            >
              <p className="text-13pxr font-bold leading-[18px] text-primary-100">
                {selectedEpisodeNo}화 장면 미리보기
              </p>
              <p className="mt-8pxr break-words text-15pxr leading-[23px] text-black-100">
                {sceneTeaser}
              </p>
            </div>
            {isSceneStatusVisible && (
              <div className="absolute inset-0 flex flex-col items-center justify-start bg-white pt-16pxr text-13pxr text-dark-gray-400">
                {sceneStatusContent}
              </div>
            )}
          </section>
        )}

        {!shouldShowInitialLoader &&
          !sceneSummary &&
          !sceneExcerpt &&
          !sceneTeaser &&
          isSceneStatusVisible && (
            <section className="mt-16pxr border-t border-light-gray-400 pt-16pxr">
              <div className="flex min-h-[96px] flex-col items-center justify-start text-13pxr text-dark-gray-400">
                {sceneStatusContent}
              </div>
            </section>
          )}

      </div>

      <div className="shrink-0 border-t border-light-gray-200 bg-white px-20pxr pb-[calc(14px+env(safe-area-inset-bottom))] pt-12pxr md:px-30pxr md:py-16pxr">
        <div className="mb-12pxr">
          <label
            htmlFor="character-chat-read-episode"
            className="flex min-w-0 items-baseline whitespace-nowrap text-14pxr font-bold leading-[20px] text-black-100"
          >
            <span className="min-w-0 truncate text-primary-100">
              {item.productTitle}
            </span>
            <span className="shrink-0">, 몇 화에서 주인공과 만날까요?</span>
          </label>
          <select
            id="character-chat-read-episode"
            value={selectedEpisodeNo}
            disabled={
              isReadScopeLoading ||
              maxSelectableEpisodeNo === entryEpisodeNo
            }
            onChange={(event) => setSelectedEpisodeNo(Number(event.target.value))}
            className="mt-8pxr h-40pxr w-full rounded-[8px] border border-light-gray-500 bg-white px-12pxr text-14pxr font-medium text-black-100 outline-none focus:border-primary-100 disabled:bg-light-gray-100 disabled:text-deactivate-color"
          >
            {selectableEpisodeNos.map((episodeNo) => {
              const isRecentRead = episodeNo === accountReadEpisodeNo;
              return (
                <option key={episodeNo} value={episodeNo}>
                  {episodeNo}화{isRecentRead ? " · 최근 읽은 회차" : ""}
                </option>
              );
            })}
          </select>
          <p className="mt-5pxr text-11pxr leading-[15px] text-dark-gray-500">
            {readScopeDescription} 선택한 회차 이후의 내용은 대화에 반영하지 않아요.
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] gap-10pxr md:grid-cols-2">
          <button
            type="button"
            disabled={isLaunching}
            onClick={() => onGoToProduct(item)}
            className="h-48pxr w-full rounded-[10px] border border-light-gray-300 bg-white text-14pxr font-medium text-dark-gray-500 disabled:opacity-60 md:text-15pxr"
          >
            작품 보기
          </button>
          <button
            type="button"
            disabled={isLaunching || isReadScopeLoading}
            aria-busy={isLaunching || isReadScopeLoading}
            onClick={() => onLaunch(item, selectedEpisodeNo)}
            className="h-48pxr w-full rounded-[10px] bg-primary-100 text-14pxr font-medium text-white disabled:cursor-wait disabled:opacity-60 md:text-16pxr"
          >
            {isReadScopeLoading
              ? "읽은 회차 확인 중…"
              : `${selectedEpisodeNo}화의 ${item.characterName}에게 말 걸기`}
          </button>
        </div>
      </div>
    </div>
  );
};

const CharacterChatPreviewModal = ({
  item,
  isLaunching,
  mockReadEpisodeNo,
  previewDetail,
  onLaunch,
  onGoToProduct,
  onClose,
}: Props) => {
  const device = useMediaDevice();
  const queryClient = useQueryClient();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const isOpen = Boolean(item);
  const [readScope, setReadScope] = useState({
    characterSlotId: null as number | null,
    status: "idle" as CharacterChatReadScopeStatus,
    accountReadEpisodeNo: null as number | null,
    entryEpisodeNo: 1,
    initialReadEpisodeNo: 1,
    maxSelectableEpisodeNo: 1,
    selectableEpisodeNos: [1],
  });

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const returnFocusElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true"
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (!dialog.contains(activeElement) ||
          activeElement === dialog ||
          activeElement === firstFocusableElement)
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (
        !event.shiftKey &&
        (!dialog.contains(activeElement) ||
          activeElement === lastFocusableElement)
      ) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      if (returnFocusElement && document.contains(returnFocusElement)) {
        returnFocusElement.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!item) {
      setReadScope({
        characterSlotId: null,
        status: "idle",
        accountReadEpisodeNo: null,
        entryEpisodeNo: 1,
        initialReadEpisodeNo: 1,
        maxSelectableEpisodeNo: 1,
        selectableEpisodeNos: [1],
      });
      return;
    }
    let cancelled = false;
    const fallbackEpisodeScope = resolveCharacterChatEpisodeScope({
      entryEpisodeNo: item.entryEpisodeNo,
      preparedEpisodeNo: item.syncedLatestEpisodeNo,
      accountReadEpisodeNo: null,
    });

    const applyReadScope = (rawReadEpisodeNo: number) => {
      if (cancelled) return;
      const accountReadEpisodeNo = Math.max(Number(rawReadEpisodeNo || 0), 0);
      const episodeScope = resolveCharacterChatEpisodeScope({
        entryEpisodeNo: item.entryEpisodeNo,
        preparedEpisodeNo: item.syncedLatestEpisodeNo,
        accountReadEpisodeNo,
      });
      setReadScope({
        characterSlotId: item.characterSlotId,
        status: "ready",
        accountReadEpisodeNo: accountReadEpisodeNo || null,
        ...episodeScope,
      });
    };

    setReadScope({
      characterSlotId: item.characterSlotId,
      status: "loading",
      accountReadEpisodeNo: null,
      ...fallbackEpisodeScope,
    });

    if (mockReadEpisodeNo !== undefined) {
      applyReadScope(mockReadEpisodeNo);
      return () => {
        cancelled = true;
      };
    }

    void queryClient.fetchQuery(
      getEpisodeListQueryOptions(
        {
          product_id: String(item.productId),
          page: 1,
          limit: 1,
          order_by: "episodeNo",
          order_dir: "desc",
        },
        true
      )
    ).then(
      (response) => applyReadScope(response.data.latestEpisodeNo),
      () => {
        if (cancelled) return;
        setReadScope({
          characterSlotId: item.characterSlotId,
          status: "error",
          accountReadEpisodeNo: null,
          ...fallbackEpisodeScope,
        });
      }
    );

    return () => {
      cancelled = true;
    };
  }, [item, mockReadEpisodeNo, queryClient]);

  if (!item || device === null) return null;
  const fallbackEpisodeScope = resolveCharacterChatEpisodeScope({
    entryEpisodeNo: item.entryEpisodeNo,
    preparedEpisodeNo: item.syncedLatestEpisodeNo,
    accountReadEpisodeNo: null,
  });

  const currentReadScope =
    readScope.characterSlotId === item.characterSlotId
      ? readScope
      : {
          characterSlotId: item.characterSlotId,
          status: "loading" as CharacterChatReadScopeStatus,
          accountReadEpisodeNo: null,
          ...fallbackEpisodeScope,
        };
  const content = (
    <CharacterChatPreviewContent
      key={`${item.characterSlotId}:${currentReadScope.status}:${currentReadScope.initialReadEpisodeNo}`}
      item={item}
      isLaunching={isLaunching}
      readScopeStatus={currentReadScope.status}
      accountReadEpisodeNo={currentReadScope.accountReadEpisodeNo}
      entryEpisodeNo={currentReadScope.entryEpisodeNo}
      initialReadEpisodeNo={currentReadScope.initialReadEpisodeNo}
      maxSelectableEpisodeNo={currentReadScope.maxSelectableEpisodeNo}
      selectableEpisodeNos={currentReadScope.selectableEpisodeNos}
      previewDetail={previewDetail}
      onLaunch={onLaunch}
      onGoToProduct={onGoToProduct}
    />
  );

  if (device === "mobile") {
    return (
      <BottomSheetContainer
        isOpen
        onClose={onClose}
        usePortal
        panelRef={dialogRef}
        panelProps={{
          role: "dialog",
          "aria-modal": true,
          "aria-label": `${item.productTitle} ${item.characterName} 주인공챗`,
          tabIndex: -1,
        }}
      >
        {content}
      </BottomSheetContainer>
    );
  }

  return (
    <ModalContainer
      isOpen
      onClose={onClose}
      size="full"
      usePortal
      panelRef={dialogRef}
      panelProps={{
        role: "dialog",
        "aria-modal": true,
        "aria-label": `${item.productTitle} ${item.characterName} 주인공챗`,
        tabIndex: -1,
      }}
    >
      {content}
    </ModalContainer>
  );
};

export default CharacterChatPreviewModal;
