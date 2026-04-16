"use client";

import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";
import { getEpisodeListQueryOptions, useGetEpisodeList } from "@/app/api/query/product";
import {
  IWebsochatCtaCardItem,
  IGetWebsochatMessagesResponse,
  IGetWebsochatSessionsResponse,
  IWebsochatMessageItem,
  IWebsochatProductItem,
  IWebsochatReasonCardItem,
  IWebsochatSessionItem,
  IWebsochatStarterItem,
  IWebsochatStarterActionItem,
} from "@/app/api/query/websochat/dto";
import {
  getWebsochatBillingStatusQueryOptions,
  getWebsochatMessagesQueryOptions,
  postWebsochatMessageStream,
  useCreateWebsochatSession,
  useGetWebsochatBillingStatus,
  useDeleteWebsochatSession,
  useGetWebsochatMessages,
  useGetWebsochatProducts,
  useGetWebsochatSessions,
  usePatchWebsochatSessionMode,
  usePatchWebsochatSessionReadScope,
  usePostWebsochatNextEpisodeMessage,
  usePostWebsochatMessage,
} from "@/app/api/query/websochat";
import Button from "@/components/common/Button";
import ModalContainer from "@/components/common/ModalContainer";
import Spinner from "@/components/common/Spinner";
import GlobalNav from "@/components/menu/GlobalNav";
import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import { STORAGE_KEYS } from "@/utils/localStorage";
import { buildProductDetailPath } from "@/utils/productPath";
import { buildViewerPath } from "@/utils/viewerPath";
import {
  consumePendingWebsochatLaunch,
  IWebsochatLaunchPayload,
} from "@/utils/websochatLaunch";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import List from "/public/images/list.svg";

const useBrowserLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const WEBSOCHAT_EPISODE_RANGE_PATTERN = /(\d{1,4})\s*(?:~|-|–|—)\s*(\d{1,4})\s*화/g;
const WEBSOCHAT_EPISODE_SINGLE_PATTERN = /(\d{1,4})\s*화/g;
const extractWebsochatEpisodeRefs = (content: string, latestEpisodeNo: number) => {
  if (!content.trim() || latestEpisodeNo <= 0) return [] as number[];

  const episodeNos = new Set<number>();

  WEBSOCHAT_EPISODE_RANGE_PATTERN.lastIndex = 0;
  WEBSOCHAT_EPISODE_SINGLE_PATTERN.lastIndex = 0;

  let rangeMatch = WEBSOCHAT_EPISODE_RANGE_PATTERN.exec(content);
  while (rangeMatch) {
    const first = Number(rangeMatch[1] || 0);
    const second = Number(rangeMatch[2] || 0);
    if (first && second) {
      const start = Math.max(1, Math.min(first, second));
      const end = Math.min(Math.max(first, second), latestEpisodeNo);

      for (let episodeNo = start; episodeNo <= end; episodeNo += 1) {
        episodeNos.add(episodeNo);
      }
    }

    rangeMatch = WEBSOCHAT_EPISODE_RANGE_PATTERN.exec(content);
  }

  let singleMatch = WEBSOCHAT_EPISODE_SINGLE_PATTERN.exec(content);
  while (singleMatch) {
    const episodeNo = Number(singleMatch[1] || 0);
    if (episodeNo && episodeNo <= latestEpisodeNo) {
      episodeNos.add(episodeNo);
    }

    singleMatch = WEBSOCHAT_EPISODE_SINGLE_PATTERN.exec(content);
  }

  return Array.from(episodeNos).sort((a, b) => a - b);
};

const getWebsochatMessageEpisodeRefs = (
  message: IWebsochatMessageItem,
  latestEpisodeNo: number
) => {
  if (message.role !== "assistant") return [] as number[];
  if (message.referencedEpisodeNos?.length) {
    return message.referencedEpisodeNos;
  }
  return extractWebsochatEpisodeRefs(message.content, latestEpisodeNo);
};

const formatWebsochatReadScope = (
  episodeNo?: number | null,
  episodeTitle?: string | null
) => {
  if (!episodeNo || episodeNo <= 0) return "";
  const normalizedTitle = String(episodeTitle || "").trim();
  return normalizedTitle
    ? `${episodeNo}화(${normalizedTitle})`
    : `${episodeNo}화`;
};

const buildWebsochatStarterGuideMessage = (starter: IWebsochatStarterItem) => {
  const readScopeText = formatWebsochatReadScope(
    starter.readEpisodeNo,
    starter.readEpisodeTitle
  );

  if (starter.scopeState === "known" && readScopeText) {
    return `${starter.productTitle} 이야기, ${readScopeText}까지 읽은 기준으로 편하게 이어가볼게요. 기억에 남은 장면이나 궁금한 인물, 다음 전개 같은 거 아무거나 말해 주세요.`;
  }

  if (starter.scopeState === "none") {
    return `${starter.productTitle}로 같이 시작해볼게요. 아직 읽기 전이어도 괜찮아요. 어디까지 봤는지 알려주면 그 범위에 맞춰서 더 자연스럽게 이야기해드릴게요.`;
  }

  return `${starter.productTitle}로 이야기 시작해볼게요. 몇 화까지 봤는지만 알려주면 그 기준에 맞춰서 스포일러 없이 더 자연스럽게 이어갈게요.`;
};

const buildWebsochatIdleGuideMessage = (
  productTitle?: string | null
) => {
  if (productTitle) {
    return `${productTitle} 이야기로 바로 시작할게요. 마음에 남은 장면, 궁금한 인물, 다음 전개처럼 떠오르는 것부터 편하게 말해 주세요.`;
  }

  return "먼저 작품만 골라주면 바로 같이 이야기 시작할게요. 작품 대화든 인물과 대화든, 원하는 방식으로 편하게 이어가면 돼요.";
};

const buildWebsochatDraftEntryNotice = ({
  canUseAccountReadScope,
  isAuthInitialized,
}: {
  canUseAccountReadScope: boolean;
  isAuthInitialized: boolean;
}) => {
  if (!canUseAccountReadScope) {
    return "로그인하면 해당 작품의 읽은 범위를 자동으로 감지할 수 있습니다. 지금은 읽은 화수를 직접 입력해 주세요.";
  }
  if (!isAuthInitialized) {
    return "해당 작품의 읽은 범위를 자동으로 확인할 준비 중입니다. 작품을 고르면 현재 대화 가능한 기준을 먼저 맞출게요.";
  }
  return "해당 작품의 읽은 범위는 자동으로 감지됩니다. 작품을 고르면 현재 대화 가능한 기준을 먼저 맞출게요.";
};

const buildWebsochatDraftReadScopeNotice = ({
  canUseAccountReadScope,
  isAuthInitialized,
  conversationEpisodeNo,
  conversationEpisodeTitle,
  hasDetectedReadRecord,
  isSyncPending,
}: {
  canUseAccountReadScope: boolean;
  isAuthInitialized: boolean;
  conversationEpisodeNo?: number | null;
  conversationEpisodeTitle?: string | null;
  hasDetectedReadRecord: boolean;
  isSyncPending: boolean;
}) => {
  if (!isAuthInitialized && canUseAccountReadScope) {
    return "해당 작품의 읽은 범위를 자동으로 확인하고 있습니다.";
  }

  if (!canUseAccountReadScope) {
    return "로그인하면 해당 작품의 읽은 범위를 자동으로 감지할 수 있습니다. 지금은 읽은 화수를 직접 입력해 주세요.";
  }

  const conversationScopeText = formatWebsochatReadScope(
    conversationEpisodeNo,
    conversationEpisodeTitle
  );

  if (hasDetectedReadRecord && conversationScopeText) {
    if (isSyncPending) {
      return `최신 공개 회차 컨텍스트는 아직 준비 중입니다. 현재 웹소챗 세션에서 대화 가능한 기준은 ${conversationScopeText}입니다.`;
    }
    return `현재 웹소챗 세션에서 대화 가능한 기준은 ${conversationScopeText}입니다.`;
  }

  if (conversationScopeText) {
    return `해당 작품의 읽은 기록이 없어 현재 웹소챗 세션에서 대화 가능한 기준은 ${conversationScopeText}입니다.`;
  }

  return "해당 작품의 읽은 범위를 자동으로 확인하지 못했습니다. 읽은 화수를 직접 입력하면 그 기준으로 대화를 맞출 수 있습니다.";
};

const buildWebsochatReadScopeAppliedNotice = ({
  episodeNo,
  episodeTitle,
  isSyncPending,
}: {
  episodeNo?: number | null;
  episodeTitle?: string | null;
  isSyncPending: boolean;
}) => {
  const scopeText = formatWebsochatReadScope(episodeNo, episodeTitle);
  if (!scopeText) return "";
  if (isSyncPending) {
    return `읽은 범위가 반영되었습니다. 최신 공개 회차 컨텍스트는 아직 준비 중입니다. 현재 웹소챗 세션에서 대화 가능한 기준은 ${scopeText}입니다.`;
  }
  return `읽은 범위가 반영되었습니다. 현재 웹소챗 세션에서 대화 가능한 기준은 ${scopeText}입니다.`;
};

const extractWebsochatReadScopeEpisodeNo = (content: string) => {
  const normalized = String(content || "").trim();
  const match = normalized.match(/^(\d+)\s*화(?:까지)?(?:\s*(?:읽었어|읽음|봤어|기준|까지만?)?)?$/);
  if (!match) return null;
  const parsed = Number(match[1] || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const buildWebsochatLaunchStarter = (
  payload: IWebsochatLaunchPayload
): IWebsochatStarterItem => {
  const publishedLatestEpisodeNo = payload.publishedLatestEpisodeNo ?? payload.latestEpisodeNo ?? 0;
  return {
    productTitle: payload.title,
    scopeState: "unknown",
    latestEpisodeNo: payload.latestEpisodeNo || 0,
    publishedLatestEpisodeNo,
    syncedLatestEpisodeNo: resolveWebsochatSyncedLatestEpisodeNo(
      publishedLatestEpisodeNo,
      payload.syncedLatestEpisodeNo
    ),
    reasonCards: [],
    ctaCards: [],
    actions: DEFAULT_WEBSOCHAT_SHORTCUT_ACTIONS,
  };
};

const buildWebsochatModeStartNotice = (
  action: IWebsochatStarterActionItem,
  readScopeText?: string | null
) => {
  const suffix = readScopeText ? ` · ${readScopeText} 기준` : "";
  if (action.modeKey === "qa" && !action.qaActionKey) {
    return `작품 대화를 시작합니다${suffix}.`;
  }

  return `${addKoreanPostposition(action.label, "을", "를")} 시작합니다${suffix}.`;
};

const buildWebsochatQaToRpModeNotice = (readScopeText?: string | null) => {
  const suffix = readScopeText ? ` · ${readScopeText} 기준` : "";
  return `작품 대화를 종료하고 인물과 대화를 시작합니다${suffix}.`;
};

const buildWebsochatRpToQaModeNotice = (readScopeText?: string | null) => {
  const suffix = readScopeText ? ` · ${readScopeText} 기준` : "";
  return `인물과 대화를 종료하고 작품 대화를 시작합니다${suffix}.`;
};

const buildWebsochatModeSwitchNotice = ({
  fromAction,
  toAction,
  activeCharacterLabel,
  readScopeText,
}: {
  fromAction?: IWebsochatStarterActionItem | null;
  toAction: IWebsochatStarterActionItem;
  activeCharacterLabel?: string | null;
  readScopeText?: string | null;
}) => {
  const suffix = readScopeText ? ` · ${readScopeText} 기준` : "";
  if ((fromAction?.modeKey === "qa" && !fromAction?.qaActionKey) && toAction.modeKey === "rp") {
    return `작품 대화를 종료하고 인물과 대화를 시작합니다${suffix}.`;
  }
  if (toAction.modeKey === "qa" && !toAction.qaActionKey && fromAction?.qaActionKey) {
    return `${addKoreanPostposition(fromAction.label, "을", "를")} 종료하고 작품 대화를 시작합니다${suffix}.`;
  }
  if (fromAction?.modeKey === "rp") {
    if (toAction.modeKey === "qa" && !toAction.qaActionKey) {
      if (activeCharacterLabel) {
        return `${addKoreanPostposition(activeCharacterLabel, "과", "와")}의 대화를 종료하고 작품 대화를 시작합니다${suffix}.`;
      }
      return `인물과 대화를 종료하고 작품 대화를 시작합니다${suffix}.`;
    }
    if (activeCharacterLabel) {
      return `${addKoreanPostposition(activeCharacterLabel, "과", "와")}의 대화를 종료하고 ${toAction.label}으로 전환합니다${suffix}.`;
    }
    return `인물과 대화를 종료하고 ${toAction.label}으로 전환합니다${suffix}.`;
  }

  return buildWebsochatModeStartNotice(toAction, readScopeText);
};

const buildWebsochatErrorNotice = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return "지금은 접속이 원활하지 않아요. 잠시 후 다시 시도해 주세요.";
  }

  const status = error.response?.status;
  const message = String(error.response?.data?.message || "").trim();

  if (message && message !== "캐시 잔액이 부족합니다.") {
    return message;
  }

  switch (status) {
    case 400:
      return "지금은 요청을 바로 처리하지 못했어요. 한 번만 다시 시도해 주세요. (400)";
    case 401:
      return "지금은 로그인 상태를 다시 확인해야 해요. 로그인 후 다시 시도해 주세요. (401)";
    case 403:
      return "지금은 이 요청을 진행할 수 없어요. 잠시 후 다시 시도해 주세요. (403)";
    case 404:
      return "지금 필요한 정보를 찾지 못했어요. 잠시 후 다시 시도해 주세요. (404)";
    case 409:
      return "방금 요청과 겹쳤어요. 잠시만 기다렸다가 다시 시도해 주세요. (409)";
    case 429:
      return "요청이 잠깐 몰렸어요. 조금만 쉬었다가 다시 시도해 주세요. (429)";
    case 500:
    case 502:
    case 503:
    case 504:
      return `지금은 접속이 원활하지 않아요. 잠시 후 다시 시도해 주세요. (${status})`;
    default:
      return status
        ? `지금은 접속이 원활하지 않아요. 잠시 후 다시 시도해 주세요. (${status})`
        : "지금은 접속이 원활하지 않아요. 잠시 후 다시 시도해 주세요.";
  }
};

const formatWebsochatCitationLabel = (
  episodeNo?: number | null,
  episodeTitle?: string | null
) => {
  if (!episodeNo || episodeNo <= 0) {
    return {
      episodeNoText: "",
      episodeTitleText: null,
    };
  }
  const normalizedTitle = String(episodeTitle || "").trim();
  return {
    episodeNoText: `${episodeNo}화`,
    episodeTitleText: normalizedTitle || null,
  };
};

const formatWebsochatRelativeUpdatedAt = (value?: string | null) => {
  if (!value) return "";
  const target = dayjs(value);
  if (!target.isValid()) return "";

  const minuteDiff = Math.max(dayjs().diff(target, "minute"), 0);
  if (minuteDiff < 1) return "방금 전";
  if (minuteDiff < 60) return `${minuteDiff}분 전`;

  const hourDiff = Math.max(dayjs().diff(target, "hour"), 0);
  if (hourDiff < 24) return `${hourDiff}시간 전`;

  const dayDiff = Math.max(dayjs().diff(target, "day"), 0);
  return `${Math.max(dayDiff, 1)}일 전`;
};

const WEBSOCHAT_ACTIVE_SESSION_STORAGE_KEY = "websochat_active_session_id";
const WEBSOCHAT_MODE_NOTICES_STORAGE_KEY = "websochat_mode_notices";
const WEBSOCHAT_SESSION_SHORTCUT_PROMPTS_STORAGE_KEY = "websochat_session_shortcut_prompts";
const WEBSOCHAT_STICKY_GUIDES_STORAGE_KEY = "websochat_sticky_guides";
const WEBSOCHAT_DEBUG_LOG_STORAGE_KEY = "websochat_debug_log";

const buildWebsochatSessionEpisodeLabel = (
  readEpisodeNo?: number | null,
  readEpisodeTitle?: string | null
) => {
  return formatWebsochatReadScope(readEpisodeNo, readEpisodeTitle);
};

const addKoreanPostposition = (
  text: string,
  withBatchim: string,
  withoutBatchim: string
) => {
  const trimmedText = String(text || "").trim();
  if (!trimmedText) return "";

  const lastChar = trimmedText[trimmedText.length - 1] || "";
  const lastCharCode = lastChar.charCodeAt(0);
  const isHangulSyllable = lastCharCode >= 0xac00 && lastCharCode <= 0xd7a3;

  if (!isHangulSyllable) {
    return `${trimmedText}${withoutBatchim}`;
  }

  const hasFinalConsonant = (lastCharCode - 0xac00) % 28 !== 0;
  return hasFinalConsonant
    ? `${trimmedText}${withBatchim}`
    : `${trimmedText}${withoutBatchim}`;
};

const buildWebsochatSessionReadScopeText = (
  scopeState?: "unknown" | "none" | "known" | null,
  readEpisodeNo?: number | null,
  readEpisodeTitle?: string | null
) => {
  if (scopeState === "known" && readEpisodeNo) {
    return buildWebsochatSessionEpisodeLabel(readEpisodeNo, readEpisodeTitle);
  }
  if (scopeState === "none") {
    return "아직 읽기 전";
  }
  if (scopeState === "unknown") {
    return "읽은 범위 미설정";
  }
  return "";
};

const resolveWebsochatSyncedLatestEpisodeNo = (
  publishedLatestEpisodeNo?: number | null,
  syncedLatestEpisodeNo?: number | null
) => {
  const resolvedLatestEpisodeNo = Math.max(Number(publishedLatestEpisodeNo || 0), 0);
  const resolvedSyncedLatestEpisodeNo = Math.max(Number(syncedLatestEpisodeNo || 0), 0);
  if (resolvedLatestEpisodeNo <= 0) return 0;
  return Math.min(resolvedLatestEpisodeNo, resolvedSyncedLatestEpisodeNo);
};

const resolveWebsochatPublishedLatestEpisodeNo = (
  publishedLatestEpisodeNo?: number | null,
  latestEpisodeNo?: number | null
) => {
  return Math.max(Number(publishedLatestEpisodeNo ?? latestEpisodeNo ?? 0), 0);
};

const resolveWebsochatConversationCeilingEpisodeNo = (
  userReadEpisodeNo?: number | null,
  syncedLatestEpisodeNo?: number | null,
  publishedLatestEpisodeNo?: number | null
) => {
  const resolvedPublishedLatestEpisodeNo = Math.max(Number(publishedLatestEpisodeNo || 0), 0);
  const resolvedSyncedLatestEpisodeNo = Math.max(Number(syncedLatestEpisodeNo || 0), 0);
  const resolvedUserReadEpisodeNo = Math.max(Number(userReadEpisodeNo || 0), 0);
  const upperBound = resolvedSyncedLatestEpisodeNo > 0
    ? resolvedSyncedLatestEpisodeNo
    : resolvedPublishedLatestEpisodeNo;

  if (upperBound <= 0) return 0;
  if (resolvedUserReadEpisodeNo <= 0) return upperBound;
  return Math.min(resolvedUserReadEpisodeNo, upperBound);
};

const buildWebsochatNextEpisodeBlockedNotice = (
  syncedLatestEpisodeNo?: number | null
) => {
  const resolvedSyncedLatestEpisodeNo = Math.max(Number(syncedLatestEpisodeNo || 0), 0);
  if (resolvedSyncedLatestEpisodeNo > 0) {
    return `다음회차 생성은 아직 사용할 수 없습니다. 현재 웹소챗 세션에서 대화 가능한 기준은 ${resolvedSyncedLatestEpisodeNo}화입니다.`;
  }
  return "다음회차 생성은 아직 사용할 수 없습니다. 최신 공개 회차 컨텍스트 준비가 끝나면 다시 사용할 수 있습니다.";
};

const buildWebsochatSyncPendingNotice = (
  publishedLatestEpisodeNo?: number | null,
  syncedLatestEpisodeNo?: number | null
) => {
  const resolvedPublishedLatestEpisodeNo = Math.max(Number(publishedLatestEpisodeNo || 0), 0);
  const resolvedSyncedLatestEpisodeNo = Math.max(Number(syncedLatestEpisodeNo || 0), 0);
  if (resolvedPublishedLatestEpisodeNo > 0 && resolvedSyncedLatestEpisodeNo > 0) {
    return `최신 공개 회차 컨텍스트는 아직 준비 중입니다. 현재 웹소챗 세션에서 대화 가능한 기준은 ${resolvedSyncedLatestEpisodeNo}화입니다.`;
  }
  if (resolvedSyncedLatestEpisodeNo > 0) {
    return `최신 공개 회차 컨텍스트는 아직 준비 중입니다. 현재 웹소챗 세션에서 대화 가능한 기준은 ${resolvedSyncedLatestEpisodeNo}화입니다.`;
  }
  return "최신 공개 회차 컨텍스트는 아직 준비 중입니다. 준비된 범위 안에서만 대화할 수 있습니다.";
};

const buildWebsochatProductSnapshot = ({
  productId,
  title,
  authorNickname,
  coverImagePath,
  latestEpisodeNo,
  publishedLatestEpisodeNo,
  syncedLatestEpisodeNo,
  contextStatus,
}: {
  productId: number;
  title: string;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  latestEpisodeNo?: number | null;
  publishedLatestEpisodeNo?: number | null;
  syncedLatestEpisodeNo?: number | null;
  contextStatus?: string | null;
}): IWebsochatProductItem => ({
  productId,
  title,
  authorNickname: authorNickname || null,
  coverImagePath: coverImagePath || null,
  latestEpisodeNo: latestEpisodeNo || 0,
  publishedLatestEpisodeNo: resolveWebsochatPublishedLatestEpisodeNo(
    publishedLatestEpisodeNo,
    latestEpisodeNo
  ),
  syncedLatestEpisodeNo:
    syncedLatestEpisodeNo == null
      ? undefined
      : resolveWebsochatSyncedLatestEpisodeNo(
        resolveWebsochatPublishedLatestEpisodeNo(publishedLatestEpisodeNo, latestEpisodeNo),
        syncedLatestEpisodeNo
      ),
  contextStatus: contextStatus || "ready",
});

type WebsochatModeNoticeItem = {
  noticeId: string;
  sessionId: number | null;
  productId: number | null;
  content: string;
  createdAt: number;
  kind: "mode" | "action" | "sync_pending";
};

type WebsochatStickyGuideItem = {
  guideId: string;
  sessionId: number | null;
  productId: number | null;
  originNoticeId: string | null;
  createdAt: number;
  message: IWebsochatMessageItem;
};

type WebsochatLocalStarterItem = {
  starterId: string;
  sessionId: number | null;
  productId: number | null;
  createdAt: number;
  starter: IWebsochatStarterItem;
  cardSnapshot?: {
    productId: number;
    productTitle: string;
    authorNickname?: string | null;
    coverImagePath?: string | null;
    publishedLatestEpisodeNo?: number | null;
    readScopeLabel?: string | null;
  } | null;
};

const appendWebsochatDebugLog = (
  event: string,
  payload: Record<string, unknown> = {}
) => {
  const entry = {
    at: new Date().toISOString(),
    event,
    payload,
  };
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(WEBSOCHAT_DEBUG_LOG_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(parsed) ? [...parsed, entry].slice(-300) : [entry];
      window.sessionStorage.setItem(
        WEBSOCHAT_DEBUG_LOG_STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch {
      // ignore debug persistence failures
    }
  }
  console.info("[websochat-debug]", entry);
};

type WebsochatTransientMessageItem = IWebsochatMessageItem & {
  isStreaming?: boolean;
};

type WebsochatStreamingKind = "qa" | "rp" | "ideal_worldcup";
type WebsochatComposerMode = "qa" | "rp" | "ideal_worldcup";
type WebsochatRpStage = "idle" | "awaiting_character" | "chatting";
type WebsochatShortcutStateKey =
  | "qa_default"
  | "qa_predict"
  | "qa_next_episode_write"
  | "rp"
  | "ideal_worldcup";

const resolveWebsochatShortcutStateKey = (
  action?: Pick<IWebsochatStarterActionItem, "modeKey" | "qaActionKey"> | null
): WebsochatShortcutStateKey => {
  if (!action) return "qa_default";
  if (action.modeKey === "rp") return "rp";
  if (action.modeKey === "ideal_worldcup") return "ideal_worldcup";
  if (action.qaActionKey === "predict") return "qa_predict";
  if (action.qaActionKey === "next_episode_write") return "qa_next_episode_write";
  return "qa_default";
};

const DEFAULT_WEBSOCHAT_SHORTCUT_ACTIONS: IWebsochatStarterActionItem[] = [
  {
    label: "작품 대화",
    prompt: "이 작품에 대해 뭐든 편하게 이야기해줘",
    modeKey: "qa",
    qaActionKey: null,
    cashCost: null,
  },
  {
    label: "다음 전개 예상",
    prompt: "다음 전개 예상해줘",
    modeKey: "qa",
    qaActionKey: "predict",
    cashCost: null,
  },
  {
    label: "다음회차 생성",
    prompt: "다음회차 써줘",
    modeKey: "qa",
    qaActionKey: "next_episode_write",
    cashCost: 30,
  },
  {
    label: "인물과 대화",
    prompt: "누구랑 대화하고 싶어? 인물 이름만 말해주면 바로 그 인물과 대화를 시작할게.",
    modeKey: "rp",
    qaActionKey: null,
    cashCost: null,
  },
  {
    label: "이상형월드컵",
    prompt: "이 작품으로 이상형월드컵을 시작해줘",
    modeKey: "ideal_worldcup",
    qaActionKey: null,
    cashCost: null,
  },
];

const parseWebsochatCreatedAt = (value?: string | null) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const renderWebsochatReasonCards = (
  reasonCards: IWebsochatReasonCardItem[] | null | undefined
) => {
  if (!reasonCards?.length) return null;
  return (
    <div className="mt-8pxr grid grid-cols-1 md:grid-cols-2 gap-6pxr">
      {reasonCards.map((card) => (
        <div
          key={`${card.title}-${card.description}`}
          className="rounded-[10px] border border-light-gray-300 bg-white px-10pxr py-8pxr"
        >
          <div className="text-12pxr font-semibold text-dark-gray-500">{card.title}</div>
          <div className="mt-4pxr text-12pxr text-dark-gray-400 whitespace-pre-wrap">
            {card.description}
          </div>
        </div>
      ))}
    </div>
  );
};

const renderWebsochatActionCards = ({
  actionCards,
  onClick,
  disabled,
  activeStateKey,
}: {
  actionCards: IWebsochatStarterActionItem[] | null | undefined;
  onClick: (action: IWebsochatStarterActionItem) => void;
  disabled?: boolean;
  activeStateKey?: WebsochatShortcutStateKey | null;
}) => {
  if (!actionCards?.length) return null;
  return (
    <div className="mt-8pxr flex flex-wrap gap-6pxr">
      {actionCards.map((action) => (
        (() => {
          const isActive = activeStateKey === resolveWebsochatShortcutStateKey(action);
          return (
        <button
          key={action.label}
          type="button"
          onClick={() => onClick(action)}
          disabled={disabled}
          className={`rounded-[10px] border px-10pxr py-8pxr text-12pxr font-medium ${
            isActive
              ? "border-primary-100 bg-primary-100 text-white"
              : "border-light-gray-400 bg-white text-dark-gray-500"
          } ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : isActive
                ? ""
                : "hover:border-primary-100 hover:text-primary-100"
          }`}
        >
          {isActive ? `${action.label}(클릭)` : action.label}
        </button>
          );
        })()
      ))}
    </div>
  );
};

const renderWebsochatCtaCards = ({
  ctaCards,
  onClick,
}: {
  ctaCards: IWebsochatCtaCardItem[] | null | undefined;
  onClick: (card: IWebsochatCtaCardItem) => void;
}) => {
  if (!ctaCards?.length) return null;
  return (
    <div className="mt-8pxr flex flex-wrap gap-6pxr">
      {ctaCards.map((card) => (
        <button
          key={`${card.type}-${card.productId || 0}-${card.label}`}
          type="button"
          onClick={() => onClick(card)}
          className="rounded-[10px] border border-light-gray-400 bg-white px-10pxr py-8pxr text-12pxr font-medium text-dark-gray-500 hover:border-primary-100 hover:text-primary-100"
        >
          {card.label}
        </button>
      ))}
    </div>
  );
};

export default function WebsochatPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, accessToken, isAuthInitialized } = useAuthStore();
  const { setConfirm } = useConfirmStore();
  const adultYn: "Y" | "N" = user?.isOnAdult ? "Y" : "N";
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isPreparingNewSession, setIsPreparingNewSession] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const [selectedProductSnapshot, setSelectedProductSnapshot] =
    useState<IWebsochatProductItem | null>(null);
  const [stickyStarter, setStickyStarter] = useState<IWebsochatStarterItem | null>(null);
  const [composerMode, setComposerMode] = useState<WebsochatComposerMode>("qa");
  const [rpStage, setRpStage] = useState<WebsochatRpStage>("idle");
  const [activeCharacterLabel, setActiveCharacterLabel] = useState<string | null>(null);
  const [activeShortcutPrompt, setActiveShortcutPrompt] = useState("");
  const [modeNotices, setModeNotices] = useState<WebsochatModeNoticeItem[]>([]);
  const [stickyGuides, setStickyGuides] = useState<WebsochatStickyGuideItem[]>([]);
  const [localStarters, setLocalStarters] = useState<WebsochatLocalStarterItem[]>([]);
  const [transientMessages, setTransientMessages] = useState<WebsochatTransientMessageItem[]>([]);
  const [pendingSessionPreview, setPendingSessionPreview] =
    useState<IWebsochatSessionItem | null>(null);
  const [isStreamingMessage, setIsStreamingMessage] = useState(false);
  const [isAssistantTurnPending, setIsAssistantTurnPending] = useState(false);
  const [streamingStatusMessage, setStreamingStatusMessage] = useState("");
  const [streamingKind, setStreamingKind] = useState<WebsochatStreamingKind>("qa");
  const [streamingQaActionKey, setStreamingQaActionKey] =
    useState<"predict" | "next_episode_write" | null>(null);
  const [hasStreamingContentStarted, setHasStreamingContentStarted] = useState(false);
  const [streamingStartedAt, setStreamingStartedAt] = useState<number | null>(null);
  const [streamingProgressPercent, setStreamingProgressPercent] = useState(0);
  const [isNextEpisodeCompletionHolding, setIsNextEpisodeCompletionHolding] = useState(false);
  const [guestKey, setGuestKey] = useState("");
  const [draft, setDraft] = useState("");
  const [hasStoredAuthToken, setHasStoredAuthToken] = useState(false);
  const [pendingLaunchPayload, setPendingLaunchPayload] =
    useState<IWebsochatLaunchPayload | null>(null);
  const [pendingModeSyncKey, setPendingModeSyncKey] =
    useState<WebsochatComposerMode | null>(null);
  const syncPendingNoticeKeyRef = useRef<string | null>(null);
  const mergedReadScopeSyncNoticeKeyRef = useRef<string | null>(null);
  const modeSyncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const modeSyncRequestSeqRef = useRef(0);
  const assistantTurnOwnerSeqRef = useRef(0);
  const hydratedShortcutPromptSessionIdRef = useRef<number | null>(null);
  const productSelectionNoticeSeqRef = useRef(0);

  const readStoredActiveSessionId = useCallback(() => {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(WEBSOCHAT_ACTIVE_SESSION_STORAGE_KEY);
    const parsed = Number(raw || 0);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, []);

  const writeStoredActiveSessionId = useCallback((sessionId: number | null) => {
    if (typeof window === "undefined") return;
    if (sessionId && sessionId > 0) {
      window.sessionStorage.setItem(
        WEBSOCHAT_ACTIVE_SESSION_STORAGE_KEY,
        String(sessionId)
      );
      return;
    }
    window.sessionStorage.removeItem(WEBSOCHAT_ACTIVE_SESSION_STORAGE_KEY);
  }, []);

  const readStoredSessionShortcutPrompts = useCallback((): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const raw = window.sessionStorage.getItem(WEBSOCHAT_SESSION_SHORTCUT_PROMPTS_STORAGE_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
        const normalizedKey = String(key || "").trim();
        const normalizedValue = String(value || "").trim();
        if (normalizedKey) {
          acc[normalizedKey] = normalizedValue;
        }
        return acc;
      }, {});
    } catch {
      window.sessionStorage.removeItem(WEBSOCHAT_SESSION_SHORTCUT_PROMPTS_STORAGE_KEY);
      return {};
    }
  }, []);

  const writeStoredSessionShortcutPrompts = useCallback((items: Record<string, string>) => {
    if (typeof window === "undefined") return;
    const nextEntries = Object.entries(items).filter(([key]) => String(key || "").trim());
    if (!nextEntries.length) {
      window.sessionStorage.removeItem(WEBSOCHAT_SESSION_SHORTCUT_PROMPTS_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(
      WEBSOCHAT_SESSION_SHORTCUT_PROMPTS_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(nextEntries))
    );
  }, []);

  const readStoredSessionShortcutPrompt = useCallback((sessionId: number | null) => {
    if (!sessionId) return "";
    const stored = readStoredSessionShortcutPrompts();
    return stored[String(sessionId)] || "";
  }, [readStoredSessionShortcutPrompts]);

  const writeStoredSessionShortcutPrompt = useCallback((sessionId: number | null, prompt: string) => {
    if (!sessionId) return;
    const nextPrompt = String(prompt || "").trim();
    const stored = readStoredSessionShortcutPrompts();
    if (!nextPrompt) {
      if (!(String(sessionId) in stored)) return;
      delete stored[String(sessionId)];
      writeStoredSessionShortcutPrompts(stored);
      return;
    }
    if (stored[String(sessionId)] === nextPrompt) return;
    stored[String(sessionId)] = nextPrompt;
    writeStoredSessionShortcutPrompts(stored);
  }, [readStoredSessionShortcutPrompts, writeStoredSessionShortcutPrompts]);

  const removeStoredSessionShortcutPrompt = useCallback((sessionId: number | null) => {
    if (!sessionId) return;
    const stored = readStoredSessionShortcutPrompts();
    if (!(String(sessionId) in stored)) return;
    delete stored[String(sessionId)];
    writeStoredSessionShortcutPrompts(stored);
  }, [readStoredSessionShortcutPrompts, writeStoredSessionShortcutPrompts]);

  const readStoredModeNotices = useCallback((): WebsochatModeNoticeItem[] => {
    if (typeof window === "undefined") return [] as WebsochatModeNoticeItem[];
    const raw = window.sessionStorage.getItem(WEBSOCHAT_MODE_NOTICES_STORAGE_KEY);
    if (!raw) return [] as WebsochatModeNoticeItem[];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [] as WebsochatModeNoticeItem[];
      return parsed
        .map((item): WebsochatModeNoticeItem => ({
          noticeId: String(item?.noticeId || ""),
          sessionId:
            Number.isInteger(Number(item?.sessionId)) && Number(item?.sessionId) > 0
              ? Number(item.sessionId)
              : null,
          productId:
            Number.isInteger(Number(item?.productId)) && Number(item?.productId) > 0
              ? Number(item.productId)
              : null,
          content: String(item?.content || "").trim(),
          createdAt: Number(item?.createdAt || 0),
          kind:
            item?.kind === "sync_pending"
              ? "sync_pending"
              : item?.kind === "action"
                ? "action"
              : "mode",
        }))
        .filter((item) => item.noticeId && item.content && item.createdAt > 0)
        .slice(-200);
    } catch {
      window.sessionStorage.removeItem(WEBSOCHAT_MODE_NOTICES_STORAGE_KEY);
      return [] as WebsochatModeNoticeItem[];
    }
  }, []);

  const writeStoredModeNotices = useCallback((items: WebsochatModeNoticeItem[]) => {
    if (typeof window === "undefined") return;
    if (!items.length) {
      window.sessionStorage.removeItem(WEBSOCHAT_MODE_NOTICES_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(
      WEBSOCHAT_MODE_NOTICES_STORAGE_KEY,
      JSON.stringify(items.slice(-200))
    );
  }, []);

  const readStoredStickyGuides = useCallback((): WebsochatStickyGuideItem[] => {
    if (typeof window === "undefined") return [] as WebsochatStickyGuideItem[];
    const raw = window.sessionStorage.getItem(WEBSOCHAT_STICKY_GUIDES_STORAGE_KEY);
    if (!raw) return [] as WebsochatStickyGuideItem[];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [] as WebsochatStickyGuideItem[];
      return parsed
        .map((item): WebsochatStickyGuideItem => ({
          guideId: String(item?.guideId || ""),
          sessionId:
            Number.isInteger(Number(item?.sessionId)) && Number(item?.sessionId) > 0
              ? Number(item.sessionId)
              : null,
          productId:
            Number.isInteger(Number(item?.productId)) && Number(item?.productId) > 0
              ? Number(item.productId)
              : null,
          originNoticeId: item?.originNoticeId ? String(item.originNoticeId) : null,
          createdAt: Number(item?.createdAt || 0),
          message: {
            messageId: Number(item?.message?.messageId || 0),
            role: item?.message?.role === "user" ? "user" : "assistant",
            content: String(item?.message?.content || "").trim(),
            createdDate: item?.message?.createdDate ? String(item.message.createdDate) : undefined,
            referencedEpisodeNos: Array.isArray(item?.message?.referencedEpisodeNos)
              ? item.message.referencedEpisodeNos
              : null,
            reasonCards: Array.isArray(item?.message?.reasonCards)
              ? item.message.reasonCards
              : null,
            actionCards: Array.isArray(item?.message?.actionCards)
              ? item.message.actionCards
              : null,
            ctaCards: Array.isArray(item?.message?.ctaCards)
              ? item.message.ctaCards
              : null,
          },
        }))
        .filter((item) => item.guideId && item.createdAt > 0 && item.message.content)
        .slice(-200);
    } catch {
      window.sessionStorage.removeItem(WEBSOCHAT_STICKY_GUIDES_STORAGE_KEY);
      return [] as WebsochatStickyGuideItem[];
    }
  }, []);

  const writeStoredStickyGuides = useCallback((items: WebsochatStickyGuideItem[]) => {
    if (typeof window === "undefined") return;
    if (!items.length) {
      window.sessionStorage.removeItem(WEBSOCHAT_STICKY_GUIDES_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(
      WEBSOCHAT_STICKY_GUIDES_STORAGE_KEY,
      JSON.stringify(items.slice(-200))
    );
  }, []);

  const waitForPendingModeSync = useCallback(async () => {
    await modeSyncQueueRef.current;
  }, []);

  const enqueueModeSync = useCallback(
    async (
      modeKey: WebsochatComposerMode,
      task: () => Promise<number | null | void>
    ) => {
      const requestSeq = modeSyncRequestSeqRef.current + 1;
      modeSyncRequestSeqRef.current = requestSeq;
      setPendingModeSyncKey(modeKey);
      const previousQueue = modeSyncQueueRef.current.catch(() => undefined);
      const nextTask = previousQueue.then(task);
      modeSyncQueueRef.current = nextTask.then(() => undefined, () => undefined);
      try {
        return await nextTask;
      } finally {
        if (modeSyncRequestSeqRef.current === requestSeq) {
          setPendingModeSyncKey(null);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing =
      localStorage.getItem(STORAGE_KEYS.WEBSOCHAT_GUEST_KEY)
      || localStorage.getItem(STORAGE_KEYS.WEBSOCHAT_GUEST_KEY_LEGACY);
    if (existing) {
      setGuestKey(existing);
      return;
    }
    const nextKey = window.crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.WEBSOCHAT_GUEST_KEY, nextKey);
    setGuestKey(nextKey);
  }, []);

  useBrowserLayoutEffect(() => {
    setModeNotices(readStoredModeNotices());
  }, [readStoredModeNotices]);

  useBrowserLayoutEffect(() => {
    setStickyGuides(readStoredStickyGuides());
  }, [readStoredStickyGuides]);

  useBrowserLayoutEffect(() => {
    const storedSessionId = readStoredActiveSessionId();
    if (!storedSessionId) return;
    setActiveSessionId((current) => current || storedSessionId);
  }, [readStoredActiveSessionId]);

  useEffect(() => {
    writeStoredModeNotices(modeNotices);
  }, [modeNotices, writeStoredModeNotices]);

  useEffect(() => {
    writeStoredStickyGuides(stickyGuides);
  }, [stickyGuides, writeStoredStickyGuides]);

  useEffect(() => {
    if (!activeSessionId) {
      hydratedShortcutPromptSessionIdRef.current = null;
      return;
    }
    const storedPrompt = readStoredSessionShortcutPrompt(activeSessionId);
    hydratedShortcutPromptSessionIdRef.current = activeSessionId;
    setActiveShortcutPrompt(storedPrompt);
  }, [activeSessionId, readStoredSessionShortcutPrompt]);

  useEffect(() => {
    if (!activeSessionId) return;
    if (hydratedShortcutPromptSessionIdRef.current !== activeSessionId) return;
    writeStoredSessionShortcutPrompt(activeSessionId, activeShortcutPrompt);
  }, [activeSessionId, activeShortcutPrompt, writeStoredSessionShortcutPrompt]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasStoredAuthToken(
      Boolean(
        localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      )
    );
  }, [accessToken, isAuthenticated, user?.userId]);

  const canUseAccountScope =
    !!accessToken || isAuthenticated || !!user?.userId || hasStoredAuthToken;
  const websochatGuestKey = canUseAccountScope ? null : guestKey;
  const websochatActorKey = canUseAccountScope
    ? user?.userId
      ? `user:${user.userId}`
      : hasStoredAuthToken
        ? "auth"
        : ""
    : guestKey;
  const selectedProductEpisodeListParams = useMemo(
    () => ({
      product_id: String(selectedProductId || ""),
      page: 1,
      limit: 1,
      order_by: "episodeNo" as const,
      order_dir: "asc" as const,
    }),
    [selectedProductId]
  );

  const {
    data: productsData,
    isFetching: isProductsFetching,
    refetch: refetchProducts,
  } = useGetWebsochatProducts(
    submittedKeyword,
    adultYn
  );
  const { data: billingStatusData } = useGetWebsochatBillingStatus(
    websochatActorKey,
    websochatGuestKey,
    null
  );
  const { data: selectedProductEpisodesData } = useGetEpisodeList(
    selectedProductEpisodeListParams,
    isAuthInitialized && !!selectedProductId && canUseAccountScope
  );
  const {
    data: sessionsData,
    isFetching: isSessionsFetching,
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
  } = useGetWebsochatSessions(
    null,
    websochatActorKey,
    websochatGuestKey,
    adultYn
  );
  const {
    data: messagesData,
    isFetching: isMessagesFetching,
    refetch: refetchMessages,
  } = useGetWebsochatMessages(
    activeSessionId,
    websochatActorKey,
    websochatGuestKey
  );
  const { mutateAsync: createSession, isPending: isCreatingSession } = useCreateWebsochatSession();
  const { mutateAsync: deleteSession, isPending: isDeletingSession } = useDeleteWebsochatSession();
  const { mutateAsync: patchSessionMode } = usePatchWebsochatSessionMode();
  const { mutateAsync: patchSessionReadScope } = usePatchWebsochatSessionReadScope();
  const { mutateAsync: postMessage, isPending: isPostingMessage } = usePostWebsochatMessage();
  const { mutateAsync: postNextEpisodeMessage } = usePostWebsochatNextEpisodeMessage();

  const activeSession = useMemo(
    () => sessionsData?.data?.find((item) => item.sessionId === activeSessionId) ?? null,
    [sessionsData, activeSessionId]
  );
  const activeSessionMeta = messagesData?.data?.session ?? null;
  const visibleSessionItems = useMemo(() => {
    const currentSessionItems = sessionsData?.data ?? [];
    if (!pendingSessionPreview) return currentSessionItems;
    const alreadyExists = currentSessionItems.some(
      (item) => item.sessionId === pendingSessionPreview.sessionId
    );
    if (alreadyExists) return currentSessionItems;
    return [pendingSessionPreview, ...currentSessionItems];
  }, [pendingSessionPreview, sessionsData]);
  const hasSessionItems = visibleSessionItems.length > 0;

  const selectedProduct = useMemo(() => {
    const matchedProduct = productsData?.data?.find((item) => item.productId === selectedProductId) ?? null;
    if (matchedProduct) return matchedProduct;
    if (selectedProductSnapshot?.productId === selectedProductId) return selectedProductSnapshot;
    return null;
  }, [productsData, selectedProductId, selectedProductSnapshot]);
  const visibleSearchProducts = useMemo(
    () => (productsData?.data || [])
      .filter((item) => (
        item.contextStatus === "ready"
        && resolveWebsochatPublishedLatestEpisodeNo(item.publishedLatestEpisodeNo, item.latestEpisodeNo) > 0
        && resolveWebsochatSyncedLatestEpisodeNo(
          resolveWebsochatPublishedLatestEpisodeNo(item.publishedLatestEpisodeNo, item.latestEpisodeNo),
          item.syncedLatestEpisodeNo
        ) > 0
      ))
      .sort((a, b) => {
        const aPublishedLatest = resolveWebsochatPublishedLatestEpisodeNo(
          a.publishedLatestEpisodeNo,
          a.latestEpisodeNo
        );
        const bPublishedLatest = resolveWebsochatPublishedLatestEpisodeNo(
          b.publishedLatestEpisodeNo,
          b.latestEpisodeNo
        );
        const aSyncedLatest = resolveWebsochatSyncedLatestEpisodeNo(
          aPublishedLatest,
          a.syncedLatestEpisodeNo
        );
        const bSyncedLatest = resolveWebsochatSyncedLatestEpisodeNo(
          bPublishedLatest,
          b.syncedLatestEpisodeNo
        );

        if (bSyncedLatest !== aSyncedLatest) {
          return bSyncedLatest - aSyncedLatest;
        }
        if (bPublishedLatest !== aPublishedLatest) {
          return bPublishedLatest - aPublishedLatest;
        }
        return b.productId - a.productId;
      }),
    [productsData]
  );
  const detectedReadEpisodeNo = selectedProductEpisodesData?.data?.latestEpisodeNo ?? 0;
  const detectedReadEpisodeTitle = selectedProductEpisodesData?.data?.latestEpisodeTitle ?? "";
  const effectiveReadEpisodeNo = detectedReadEpisodeNo > 0 ? detectedReadEpisodeNo : null;
  const effectiveProductId =
    selectedProductId
    || activeSession?.productId
    || activeSessionMeta?.productId
    || selectedProductSnapshot?.productId
    || null;
  const publishedLatestEpisodeNo = resolveWebsochatPublishedLatestEpisodeNo(
    activeSession?.publishedLatestEpisodeNo
      ?? activeSessionMeta?.publishedLatestEpisodeNo
      ?? selectedProduct?.publishedLatestEpisodeNo
      ?? selectedProductSnapshot?.publishedLatestEpisodeNo,
    activeSession?.latestEpisodeNo
      ?? activeSessionMeta?.latestEpisodeNo
      ?? selectedProduct?.latestEpisodeNo
      ?? selectedProductSnapshot?.latestEpisodeNo
  );
  const syncedLatestEpisodeNo = activeSession?.syncedLatestEpisodeNo
    ?? activeSessionMeta?.syncedLatestEpisodeNo
    ?? selectedProduct?.syncedLatestEpisodeNo
    ?? selectedProductSnapshot?.syncedLatestEpisodeNo
    ?? null;
  const effectiveStarter = messagesData?.data?.starter || stickyStarter;
  const activeSessionReadScopeState = activeSessionMeta?.readScopeState
    ?? activeSession?.readScopeState
    ?? (pendingSessionPreview?.sessionId === activeSessionId
      ? pendingSessionPreview.readScopeState
      : null)
    ?? null;
  const availableShortcutActions =
    effectiveStarter?.actions || DEFAULT_WEBSOCHAT_SHORTCUT_ACTIONS;
  const userReadEpisodeNo = activeSessionId
    ? activeSessionMeta?.readEpisodeNo
      ?? activeSession?.readEpisodeNo
      ?? (pendingSessionPreview?.sessionId === activeSessionId
        ? pendingSessionPreview.readEpisodeNo
        : null)
      ?? null
    : effectiveReadEpisodeNo ?? effectiveStarter?.readEpisodeNo ?? null;
  const userReadEpisodeTitle = activeSessionId
    ? activeSessionMeta?.readEpisodeTitle
      ?? activeSession?.readEpisodeTitle
      ?? (pendingSessionPreview?.sessionId === activeSessionId
        ? pendingSessionPreview.readEpisodeTitle
        : "")
      ?? ""
    : effectiveStarter?.readEpisodeTitle
      ?? (userReadEpisodeNo === effectiveReadEpisodeNo ? detectedReadEpisodeTitle : "")
      ?? "";
  const currentModeReadScopeText = formatWebsochatReadScope(
    userReadEpisodeNo,
    userReadEpisodeTitle
  ) || null;
  const conversationCeilingEpisodeNo = resolveWebsochatConversationCeilingEpisodeNo(
    userReadEpisodeNo,
    syncedLatestEpisodeNo,
    publishedLatestEpisodeNo
  );
  const isNextEpisodeWriteBlocked =
    syncedLatestEpisodeNo != null
    && publishedLatestEpisodeNo > 0
    && publishedLatestEpisodeNo > syncedLatestEpisodeNo;
  const nextEpisodeWriteBlockedNotice = buildWebsochatNextEpisodeBlockedNotice(
    syncedLatestEpisodeNo
  );
  const activeSessionMessageCount = messagesData?.data?.messages?.length ?? 0;
  const citedEpisodeNos = useMemo(() => {
    const messages = messagesData?.data?.messages || [];
    const episodeNos = new Set<number>();

    messages.forEach((message) => {
      getWebsochatMessageEpisodeRefs(message, conversationCeilingEpisodeNo).forEach((episodeNo) => {
        episodeNos.add(episodeNo);
      });
    });

    return Array.from(episodeNos).sort((a, b) => a - b);
  }, [conversationCeilingEpisodeNo, messagesData]);
  const citationEpisodeFetchLimit = citedEpisodeNos[citedEpisodeNos.length - 1] || 0;
  const { data: citationEpisodesData } = useGetEpisodeList(
    {
      product_id: String(selectedProductId || activeSessionMeta?.productId || ""),
      page: 1,
      limit: citationEpisodeFetchLimit,
      order_by: "episodeNo",
      order_dir: "asc",
    },
    !!(selectedProductId || activeSessionMeta?.productId) && citationEpisodeFetchLimit > 0
  );
  const citationEpisodeMap = useMemo(() => {
    const episodes = citationEpisodesData?.data?.episodes || [];
    return new Map(episodes.map((episode) => [episode.episodeNo, episode]));
  }, [citationEpisodesData]);
  const isRpAwaitingCharacter =
    composerMode === "rp" && rpStage === "awaiting_character";
  const isRpChatting = composerMode === "rp" && rpStage === "chatting";
  const serverSessionRpStage =
    messagesData?.data?.session?.rpStage
    ?? activeSession?.rpStage
    ?? activeSessionMeta?.rpStage
    ?? "idle";
  const serverSessionRpActiveCharacterLabel =
    messagesData?.data?.session?.rpActiveCharacterLabel
    ?? activeSession?.rpActiveCharacterLabel
    ?? activeSessionMeta?.rpActiveCharacterLabel
    ?? null;
  const effectiveMode: WebsochatComposerMode = pendingModeSyncKey
    ? pendingModeSyncKey
    : activeSessionId
      ? (
        serverSessionRpStage === "awaiting_character" || serverSessionRpStage === "chatting"
          ? "rp"
          : composerMode === "ideal_worldcup"
            ? "ideal_worldcup"
            : "qa"
      )
      : composerMode;
  const isEffectiveRpMode = effectiveMode === "rp";
  const promptedShortcutAction = useMemo(
    () => (
      availableShortcutActions.find((action) => action.prompt.trim() === activeShortcutPrompt.trim())
      || DEFAULT_WEBSOCHAT_SHORTCUT_ACTIONS.find((action) => action.prompt.trim() === activeShortcutPrompt.trim())
      || null
    ),
    [activeShortcutPrompt, availableShortcutActions]
  );
  const effectiveShortcutState: WebsochatShortcutStateKey = useMemo(() => {
    if (pendingModeSyncKey === "rp" || effectiveMode === "rp") return "rp";
    if (pendingModeSyncKey === "ideal_worldcup" || effectiveMode === "ideal_worldcup") {
      return "ideal_worldcup";
    }
    return resolveWebsochatShortcutStateKey(promptedShortcutAction);
  }, [effectiveMode, pendingModeSyncKey, promptedShortcutAction]);
  const scopedModeNotices = useMemo(
    () => modeNotices
      .filter((notice) => {
        if (activeSessionId) {
          return notice.sessionId === activeSessionId;
        }
        return notice.sessionId == null
          && (notice.productId == null || notice.productId === effectiveProductId);
      })
      .sort((left, right) => left.createdAt - right.createdAt),
    [activeSessionId, effectiveProductId, modeNotices]
  );
  const visibleModeNotices = useMemo(() => {
    return scopedModeNotices;
  }, [scopedModeNotices]);
  const latestScopedModeNotice = scopedModeNotices[scopedModeNotices.length - 1] ?? null;
  const shouldSuppressServerGuideMessage =
    effectiveShortcutState === "qa_predict"
    || effectiveShortcutState === "qa_next_episode_write"
    || effectiveShortcutState === "ideal_worldcup";
  const serverGuideMessage =
    activeSessionId
    && !shouldSuppressServerGuideMessage
      ? messagesData?.data?.guideMessage ?? null
      : null;
  const visibleStickyGuides = useMemo(
    () => stickyGuides
      .filter((guide) => {
        if (activeSessionId) {
          return guide.sessionId === activeSessionId;
        }
        return guide.sessionId == null
          && (guide.productId == null || guide.productId === effectiveProductId);
      })
      .sort((left, right) => left.createdAt - right.createdAt),
    [activeSessionId, effectiveProductId, stickyGuides]
  );
  const visibleLocalStarters = useMemo(
    () => localStarters
      .filter((starter) => {
        if (activeSessionId) {
          return starter.sessionId === activeSessionId;
        }
        return starter.sessionId == null
          && starter.productId != null
          && starter.productId === effectiveProductId;
      })
      .sort((left, right) => left.createdAt - right.createdAt),
    [activeSessionId, effectiveProductId, localStarters]
  );
  const hasCurrentServerGuideInHistory = useMemo(() => {
    if (!activeSessionId || !serverGuideMessage?.content) return false;
    return visibleStickyGuides.some((guide) => (
      guide.sessionId === activeSessionId
      && guide.originNoticeId === (latestScopedModeNotice?.noticeId ?? null)
      && guide.message.content.trim() === serverGuideMessage.content.trim()
    ));
  }, [activeSessionId, latestScopedModeNotice?.noticeId, serverGuideMessage, visibleStickyGuides]);
  const composerPlaceholder = isRpAwaitingCharacter
    ? "대화하고 싶은 인물 이름을 적어줘. 예: 레이너"
    : isRpChatting
      ? `${addKoreanPostposition(activeCharacterLabel || "인물", "에게", "에게")} 말 걸어봐. 예: 왜 그래?`
      : "이 작품 이야기 편하게 해줘. 예: 주인공 성격 분석해줘";
  const composerPlaceholderWithShortcutHint = `${composerPlaceholder}\nShift+Enter로 줄바꿈`;
  const composerModeDetail = isRpAwaitingCharacter
    ? "인물 선택 중"
    : isRpChatting
      ? `${addKoreanPostposition(activeCharacterLabel || "인물", "과", "와")} 대화 중`
      : null;
  const messageFeedItems = useMemo(() => {
    const orderedPersistedMessages = (messagesData?.data?.messages || [])
      .map((message, index) => ({
        message,
        index,
        createdAt: parseWebsochatCreatedAt(message.createdDate) || index + 1,
      }))
      .sort((left, right) => {
        if (left.createdAt === right.createdAt) {
          return left.index - right.index;
        }
        return left.createdAt - right.createdAt;
      })
      .map(({ message }) => message);
    const sortedLocalStarterItems = visibleLocalStarters.map((item) => ({
      sortAt: item.createdAt,
      order: 2,
      item: {
        type: "starter" as const,
        key: `local-starter-${item.starterId}`,
        starter: item.starter,
        cardSnapshot: item.cardSnapshot ?? null,
      },
    }));
    const fallbackStarterItems = !visibleLocalStarters.length && effectiveStarter
      ? [{
          type: "starter" as const,
          key: `starter-${activeSessionId || effectiveProductId || "draft"}`,
          starter: effectiveStarter,
          cardSnapshot: null,
        }]
      : [];
    const persistedMessageItems = orderedPersistedMessages.map((message) => ({
      type: "message" as const,
      key: `message-${message.messageId}`,
      message,
    }));
    const noticeItems = visibleModeNotices.map((notice) => ({
      type: "notice" as const,
      key: `notice-${notice.noticeId}`,
      notice,
    }));
    const guideItems = serverGuideMessage && !hasCurrentServerGuideInHistory ? [{
      type: "message" as const,
      key: `guide-${activeSessionId || "draft"}`,
      message: serverGuideMessage,
    }] : [];
    const transientMessageItems = transientMessages.map((message) => ({
      type: "message" as const,
      key: `message-${message.messageId}`,
      message,
    }));

    return [
      ...fallbackStarterItems,
      ...[
        ...sortedLocalStarterItems,
        ...persistedMessageItems.map((item, index) => ({
          sortAt: parseWebsochatCreatedAt(item.message.createdDate) || index + 1,
          order: 3,
          item,
        })),
        ...noticeItems.map((item) => ({
          sortAt: item.notice.createdAt,
          order: 4,
          item,
        })),
        ...visibleStickyGuides.map((item) => ({
          sortAt: item.createdAt,
          order: 1,
          item: {
            type: "message" as const,
            key: `sticky-guide-${item.guideId}`,
            message: item.message,
          },
        })),
        ...transientMessageItems.map((item, index) => ({
          sortAt: parseWebsochatCreatedAt(item.message.createdDate) || Date.now() + index,
          order: 4,
          item,
        })),
        ...guideItems.map((item) => ({
          sortAt: Date.now(),
          order: 5,
          item,
        })),
      ]
        .sort((left, right) => {
          if (left.sortAt === right.sortAt) {
            return left.order - right.order;
          }
          return left.sortAt - right.sortAt;
        })
        .map(({ item }) => item),
    ];
  }, [
    activeSessionId,
    effectiveProductId,
    effectiveStarter,
    visibleLocalStarters,
    messagesData,
    serverGuideMessage,
    hasCurrentServerGuideInHistory,
    transientMessages,
    visibleStickyGuides,
    visibleModeNotices,
  ]);
  const shouldShowIdleGuideMessage =
    !activeSessionId
    && !effectiveStarter
    && visibleLocalStarters.length === 0
    && (messagesData?.data?.messages?.length ?? 0) === 0
    && !serverGuideMessage
    && visibleStickyGuides.length === 0
    && transientMessages.length === 0;
  useEffect(() => {
    if (!activeSessionId || !serverGuideMessage?.content || hasCurrentServerGuideInHistory) return;
    const nextCreatedAt = Date.now();
    setStickyGuides((current) => {
      const alreadyExists = current.some((guide) => (
        guide.sessionId === activeSessionId
        && guide.originNoticeId === (latestScopedModeNotice?.noticeId ?? null)
        && guide.message.content.trim() === serverGuideMessage.content.trim()
      ));
      if (alreadyExists) return current;
      return [
        ...current.slice(-199),
        {
          guideId: window.crypto.randomUUID(),
          sessionId: activeSessionId,
          productId: effectiveProductId,
          originNoticeId: latestScopedModeNotice?.noticeId ?? null,
          createdAt: nextCreatedAt,
          message: {
            ...serverGuideMessage,
            messageId: Number(serverGuideMessage.messageId || nextCreatedAt),
            createdDate: serverGuideMessage.createdDate || new Date(nextCreatedAt).toISOString(),
          },
        },
      ];
    });
  }, [
    activeSessionId,
    effectiveProductId,
    hasCurrentServerGuideInHistory,
    latestScopedModeNotice?.noticeId,
    serverGuideMessage,
  ]);
  const hasDraftComposerContext =
    isPreparingNewSession
    || !!selectedProductId
    || !!selectedProductSnapshot
    || !!stickyStarter
    || !!pendingLaunchPayload;

  useEffect(() => {
    if (isPreparingNewSession) return;
    if (isSessionsLoading || (!sessionsData && isSessionsFetching)) return;
    if (!sessionsData?.data?.length) {
      if (pendingSessionPreview?.sessionId) {
        return;
      }
      setActiveSessionId(null);
      return;
    }
    if (!activeSessionId) {
      if (hasDraftComposerContext) {
        return;
      }
      const storedSessionId = readStoredActiveSessionId();
      const nextActiveSessionId = storedSessionId
        && sessionsData.data.some((item) => item.sessionId === storedSessionId)
        ? storedSessionId
        : sessionsData.data[0].sessionId;
      setActiveSessionId(nextActiveSessionId);
      return;
    }
    const stillExists = sessionsData.data.some((item) => item.sessionId === activeSessionId);
    const isPendingActiveSession = pendingSessionPreview?.sessionId === activeSessionId;
    if (!stillExists && !isPendingActiveSession) {
      const fallbackSessionId = sessionsData.data[0].sessionId;
      setActiveSessionId(fallbackSessionId);
      writeStoredActiveSessionId(fallbackSessionId);
    }
  }, [
    sessionsData,
    activeSessionId,
    hasDraftComposerContext,
    isPreparingNewSession,
    pendingSessionPreview,
    isSessionsLoading,
    isSessionsFetching,
    readStoredActiveSessionId,
    writeStoredActiveSessionId,
  ]);

  useEffect(() => {
    if (!pendingSessionPreview?.sessionId) return;
    const hasCommittedSession = sessionsData?.data?.some(
      (item) => item.sessionId === pendingSessionPreview.sessionId
    );
    if (hasCommittedSession) {
      setPendingSessionPreview(null);
    }
  }, [pendingSessionPreview, sessionsData]);

  useEffect(() => {
    if (!activeSession?.productId) return;
    if (selectedProductId === activeSession.productId) return;
    setSelectedProductId(activeSession.productId);
  }, [activeSession, selectedProductId]);

  useEffect(() => {
    if (messagesData?.data?.starter) {
      setStickyStarter(messagesData.data.starter);
    }
  }, [messagesData]);

  useEffect(() => {
    if (!activeSessionId) return;
    if (pendingModeSyncKey) return;
    appendWebsochatDebugLog("server_rp_state_sync", {
      activeSessionId,
      serverSessionRpStage,
      serverSessionRpActiveCharacterLabel,
      composerMode,
      rpStage,
      activeCharacterLabel,
      activeShortcutPrompt,
    });
    if (serverSessionRpStage === "awaiting_character") {
      setComposerMode("rp");
      setRpStage("awaiting_character");
      setActiveCharacterLabel(null);
      setActiveShortcutPrompt("");
      return;
    }
    if (serverSessionRpStage === "chatting") {
      setComposerMode("rp");
      setRpStage("chatting");
      setActiveCharacterLabel(serverSessionRpActiveCharacterLabel || "인물");
      setActiveShortcutPrompt("");
      return;
    }
    setRpStage("idle");
    setActiveCharacterLabel(null);
    setComposerMode((current) => (current === "rp" ? "qa" : current));
    setActiveShortcutPrompt((current) => (
      current.trim() === "인물과 대화" ? "" : current
    ));
  }, [
    activeCharacterLabel,
    activeSessionId,
    activeShortcutPrompt,
    composerMode,
    pendingModeSyncKey,
    rpStage,
    serverSessionRpActiveCharacterLabel,
    serverSessionRpStage,
  ]);

  useEffect(() => {
    if (!activeSessionId) {
      setStickyStarter(null);
      setActiveShortcutPrompt("");
      setTransientMessages([]);
      setStreamingStatusMessage("");
      setPendingSessionPreview(null);
      setComposerMode("qa");
      setRpStage("idle");
      setActiveCharacterLabel(null);
      return;
    }
    writeStoredActiveSessionId(activeSessionId);
  }, [activeSessionId, writeStoredActiveSessionId]);

  useEffect(() => {
    const shouldShowStreamingStatus =
      (
        isStreamingMessage
        || (
          isAssistantTurnPending
          && streamingKind === "qa"
          && streamingQaActionKey === "next_episode_write"
        )
      )
      && !hasStreamingContentStarted;

    if (!shouldShowStreamingStatus) {
      setStreamingStatusMessage("");
      return;
    }

    const timer1 = window.setTimeout(() => {
      setStreamingStatusMessage(
        streamingKind === "ideal_worldcup"
          ? "대진을 바로 잡아보는 중이에요."
          : streamingKind === "rp"
            ? "말투랑 분위기 맞춰보는 중이에요."
            : streamingQaActionKey === "next_episode_write"
              ? "다음회차 흐름을 붙여서 쓰는 중이에요."
            : "읽은 데까지 먼저 맞춰보는 중이에요."
      );
    }, 1200);

    const timer2 = window.setTimeout(() => {
      setStreamingStatusMessage(
        streamingKind === "ideal_worldcup"
          ? "밸런스 한 번 보고 있어요."
          : streamingKind === "rp"
            ? "지금 이 인물 톤으로 자연스럽게 이어가는 중이에요."
            : streamingQaActionKey === "next_episode_write"
              ? "장면이랑 감정선을 엮어서 이어 쓰고 있어요."
            : "관련 장면이랑 감정선 같이 보고 있어요."
      );
    }, 3500);

    const timer3 = window.setTimeout(() => {
      setStreamingStatusMessage(
        streamingKind === "ideal_worldcup"
          ? "거의 정리됐어요. 바로 보여드릴게요."
          : streamingKind === "rp"
            ? "조금만 더, 답을 다듬고 있어요."
            : streamingQaActionKey === "next_episode_write"
              ? "거의 붙었어요. 첫 문장부터 바로 보여드릴게요."
            : "조금만 더, 답을 다듬고 있어요."
      );
    }, 7000);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    };
  }, [
    hasStreamingContentStarted,
    isAssistantTurnPending,
    isStreamingMessage,
    streamingKind,
    streamingQaActionKey,
  ]);

  useEffect(() => {
    const shouldTrackNextEpisodeProgress =
      isAssistantTurnPending
      && !hasStreamingContentStarted
      && !isNextEpisodeCompletionHolding
      && streamingKind === "qa"
      && streamingQaActionKey === "next_episode_write"
      && !!streamingStartedAt;

    if (!shouldTrackNextEpisodeProgress) {
      if (!isNextEpisodeCompletionHolding) {
        setStreamingProgressPercent(0);
      }
      return;
    }

    const expectedFirstDeltaMs = 58000;
    const updateProgress = () => {
      const elapsed = Date.now() - Number(streamingStartedAt);
      const rawProgress = (elapsed / expectedFirstDeltaMs) * 95;
      const nextProgress = Math.max(3, Math.min(95, rawProgress));
      setStreamingProgressPercent((current) => (current >= 100 ? current : nextProgress));
    };

    updateProgress();
    const timer = window.setInterval(updateProgress, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    hasStreamingContentStarted,
    isAssistantTurnPending,
    isNextEpisodeCompletionHolding,
    streamingKind,
    streamingQaActionKey,
    streamingStartedAt,
  ]);

  const appendScopedModeNotice = useCallback(
    ({
      content,
      kind = "mode",
      sessionId = activeSessionId,
      productId = effectiveProductId,
      createdAt = Date.now(),
    }: {
      content: string;
      kind?: WebsochatModeNoticeItem["kind"];
      sessionId?: number | null;
      productId?: number | null;
      createdAt?: number;
    }) => {
      const noticeId = window.crypto.randomUUID();
      setModeNotices((current) => [
        ...current.slice(-199),
        {
          noticeId,
          sessionId: sessionId ?? null,
          productId: productId ?? null,
          content,
          createdAt,
          kind,
        },
      ]);
      return noticeId;
    },
    [activeSessionId, effectiveProductId]
  );

  const appendStickyGuideMessage = useCallback(
    ({
      content,
      sessionId = activeSessionId,
      productId = effectiveProductId,
    }: {
      content: string;
      sessionId?: number | null;
      productId?: number | null;
    }) => {
      const createdAt = Date.now();
      const guideId = window.crypto.randomUUID();
      setStickyGuides((current) => [
        ...current.slice(-199),
        {
          guideId,
          sessionId: sessionId ?? null,
          productId: productId ?? null,
          originNoticeId: null,
          createdAt,
          message: {
            messageId: createdAt,
            role: "assistant",
            content,
            createdDate: new Date(createdAt).toISOString(),
          },
        },
      ]);
      return guideId;
    },
    [activeSessionId, effectiveProductId]
  );

  const appendLocalStarter = useCallback(
    ({
      starter,
      cardSnapshot,
      sessionId = activeSessionId,
      productId = effectiveProductId,
      createdAt = Date.now(),
    }: {
      starter: IWebsochatStarterItem;
      cardSnapshot?: WebsochatLocalStarterItem["cardSnapshot"];
      sessionId?: number | null;
      productId?: number | null;
      createdAt?: number;
    }) => {
      const starterId = window.crypto.randomUUID();
      setLocalStarters((current) => [
        ...current.slice(-199),
        {
          starterId,
          sessionId: sessionId ?? null,
          productId: productId ?? null,
          createdAt,
          starter,
          cardSnapshot: cardSnapshot ?? null,
        },
      ]);
      return starterId;
    },
    [activeSessionId, effectiveProductId]
  );

  const bindDraftPreludeToSession = useCallback((sessionId: number, productId: number | null) => {
    setModeNotices((current) =>
      current.map((notice) =>
        notice.sessionId == null && (notice.productId == null || notice.productId === productId)
          ? { ...notice, sessionId, productId: productId ?? notice.productId ?? null }
          : notice
      )
    );
    setStickyGuides((current) =>
      current.map((guide) =>
        guide.sessionId == null && (guide.productId == null || guide.productId === productId)
          ? { ...guide, sessionId, productId: productId ?? guide.productId ?? null }
          : guide
      )
    );
    setLocalStarters((current) =>
      current.map((starter) =>
        starter.sessionId == null && (starter.productId == null || starter.productId === productId)
          ? { ...starter, sessionId, productId: productId ?? starter.productId ?? null }
          : starter
      )
    );
  }, []);

  const ensureDraftPreludeSeeded = useCallback((baseCreatedAt?: number) => {
    const introContent = buildWebsochatIdleGuideMessage();

    setStickyGuides((current) => {
      const exists = current.some((guide) => (
        guide.sessionId == null
        && guide.productId == null
        && guide.message.content.trim() === introContent
      ));
      if (exists) return current;
      const createdAt = baseCreatedAt ?? Date.now();
      return [
        ...current.slice(-199),
        {
          guideId: window.crypto.randomUUID(),
          sessionId: null,
          productId: null,
          originNoticeId: null,
          createdAt,
          message: {
            messageId: createdAt,
            role: "assistant",
            content: introContent,
            createdDate: new Date(createdAt).toISOString(),
          },
        },
      ];
    });
  }, []);

  const appendModeNotice = useCallback(
    (
      content: string,
      kind: WebsochatModeNoticeItem["kind"] = "mode"
    ) => {
      appendWebsochatDebugLog("append_mode_notice", {
        kind,
        sessionId: activeSessionId,
        productId: effectiveProductId,
        content,
      });
      return appendScopedModeNotice({ content, kind });
    },
    [activeSessionId, appendScopedModeNotice, effectiveProductId]
  );

  const resetComposerUiState = useCallback(() => {
    setComposerMode("qa");
    setRpStage("idle");
    setActiveCharacterLabel(null);
  }, []);

  const enterRpAwaitingCharacterState = useCallback(() => {
    setComposerMode("rp");
    setRpStage("awaiting_character");
    setActiveCharacterLabel(null);
  }, []);

  const enterRpChattingState = useCallback((characterLabel?: string | null) => {
    setComposerMode("rp");
    setRpStage("chatting");
    setActiveCharacterLabel(String(characterLabel || "").trim() || "인물");
  }, []);

  const resetAssistantTurnVisualState = useCallback(() => {
    setTransientMessages([]);
    setIsStreamingMessage(false);
    setStreamingStatusMessage("");
    setStreamingQaActionKey(null);
    setHasStreamingContentStarted(false);
    setStreamingStartedAt(null);
    setStreamingProgressPercent(0);
    setIsNextEpisodeCompletionHolding(false);
  }, []);

  const resetAssistantTurnUiState = useCallback(() => {
    resetAssistantTurnVisualState();
    setIsAssistantTurnPending(false);
  }, [resetAssistantTurnVisualState]);

  const clearSessionScopedComposerState = useCallback(() => {
    appendWebsochatDebugLog("clear_session_scoped_composer_state", {
      activeSessionId,
      selectedProductId,
      pendingModeSyncKey,
      transientCount: transientMessages.length,
      draftLength: draft.length,
    });
    modeSyncRequestSeqRef.current += 1;
    assistantTurnOwnerSeqRef.current += 1;
    setPendingModeSyncKey(null);
    setActiveShortcutPrompt("");
    resetComposerUiState();
    resetAssistantTurnUiState();
    setDraft("");
  }, [
    activeSessionId,
    resetAssistantTurnUiState,
    draft.length,
    pendingModeSyncKey,
    resetComposerUiState,
    selectedProductId,
    transientMessages.length,
  ]);

  useEffect(() => {
    const hasSyncGap =
      !!effectiveProductId
      && syncedLatestEpisodeNo != null
      && syncedLatestEpisodeNo > 0
      && publishedLatestEpisodeNo > syncedLatestEpisodeNo;

    if (!hasSyncGap) {
      syncPendingNoticeKeyRef.current = null;
      mergedReadScopeSyncNoticeKeyRef.current = null;
      return;
    }
    if (!activeSessionId) {
      return;
    }

    const noticeKey = `${effectiveProductId}:${publishedLatestEpisodeNo}:${syncedLatestEpisodeNo}`;
    if (syncPendingNoticeKeyRef.current === noticeKey) {
      return;
    }
    if (mergedReadScopeSyncNoticeKeyRef.current === noticeKey) {
      syncPendingNoticeKeyRef.current = noticeKey;
      return;
    }

    const scopedReadScopeSyncNotice = userReadEpisodeNo
      ? buildWebsochatReadScopeAppliedNotice({
          episodeNo: userReadEpisodeNo,
          episodeTitle: userReadEpisodeTitle || null,
          isSyncPending: true,
        })
      : "";
    if (
      scopedReadScopeSyncNotice
      && scopedModeNotices.some((notice) => notice.content.trim() === scopedReadScopeSyncNotice)
    ) {
      syncPendingNoticeKeyRef.current = noticeKey;
      return;
    }

    appendModeNotice(
      buildWebsochatSyncPendingNotice(
        publishedLatestEpisodeNo,
        syncedLatestEpisodeNo
      ),
      "sync_pending"
    );
    syncPendingNoticeKeyRef.current = noticeKey;
  }, [
    activeSessionId,
    appendModeNotice,
    effectiveProductId,
    publishedLatestEpisodeNo,
    scopedModeNotices,
    syncedLatestEpisodeNo,
    userReadEpisodeNo,
    userReadEpisodeTitle,
  ]);

  const bindModeNoticeToSession = useCallback((noticeId: string, sessionId: number) => {
    setModeNotices((current) =>
      current.map((notice) =>
        notice.noticeId === noticeId
          ? {
              ...notice,
              sessionId,
            }
          : notice
        )
    );
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    setSelectedProductSnapshot(selectedProduct);
  }, [selectedProduct]);

  useEffect(() => {
    if (!activeSessionId || !activeSession || !websochatActorKey) return;

    const activePublishedLatestEpisodeNo = resolveWebsochatPublishedLatestEpisodeNo(
      activeSession.publishedLatestEpisodeNo,
      activeSession.latestEpisodeNo
    );
    const activeMetaPublishedLatestEpisodeNo = resolveWebsochatPublishedLatestEpisodeNo(
      activeSessionMeta?.publishedLatestEpisodeNo,
      activeSessionMeta?.latestEpisodeNo
    );
    const hasSessionStateMismatch =
      !activeSessionMeta
      || activePublishedLatestEpisodeNo !== activeMetaPublishedLatestEpisodeNo
      || Number(activeSession.syncedLatestEpisodeNo || 0)
        !== Number(activeSessionMeta?.syncedLatestEpisodeNo || 0)
      || String(activeSession.contextStatus || "")
        !== String(activeSessionMeta?.contextStatus || "")
      || Boolean(activeSession.canSendMessage ?? true)
        !== Boolean(activeSessionMeta?.canSendMessage ?? true)
      || String(activeSession.rpStage || "idle")
        !== String(activeSessionMeta?.rpStage || "idle")
      || String(activeSession.rpActiveCharacterLabel || "")
        !== String(activeSessionMeta?.rpActiveCharacterLabel || "");

    if (!hasSessionStateMismatch) return;
    void refetchMessages();
  }, [
    activeSession,
    activeSessionId,
    activeSessionMeta,
    refetchMessages,
    websochatActorKey,
  ]);

  useEffect(() => {
    if (selectedProduct) return;
    const snapshotProductId = activeSession?.productId ?? activeSessionMeta?.productId;
    const snapshotTitle = activeSession?.productTitle ?? activeSessionMeta?.productTitle;
    if (!snapshotProductId || !snapshotTitle) return;
    setSelectedProductSnapshot((current) => {
      if (current?.productId === snapshotProductId) return current;
      return buildWebsochatProductSnapshot({
        productId: snapshotProductId,
        title: snapshotTitle,
        authorNickname: activeSession?.productAuthorNickname ?? activeSessionMeta?.productAuthorNickname,
        coverImagePath: activeSession?.coverImagePath ?? activeSessionMeta?.coverImagePath,
        latestEpisodeNo: activeSession?.latestEpisodeNo ?? activeSessionMeta?.latestEpisodeNo,
        publishedLatestEpisodeNo:
          activeSession?.publishedLatestEpisodeNo ?? activeSessionMeta?.publishedLatestEpisodeNo,
        syncedLatestEpisodeNo:
          activeSession?.syncedLatestEpisodeNo ?? activeSessionMeta?.syncedLatestEpisodeNo,
        contextStatus: activeSession?.contextStatus ?? activeSessionMeta?.contextStatus,
      });
    });
  }, [selectedProduct, activeSession, activeSessionMeta]);

  const sessionProductSummary = useMemo(() => {
    const productId = effectiveProductId;
    const title =
      selectedProduct?.title
      || selectedProductSnapshot?.title
      || activeSessionMeta?.productTitle
      || null;
    if (!productId || !title) return null;

    return {
      productId,
      title,
      authorNickname:
        selectedProduct?.authorNickname
        || selectedProductSnapshot?.authorNickname
        || activeSession?.productAuthorNickname
        || activeSessionMeta?.productAuthorNickname
        || "작가명 없음",
      coverImagePath:
        selectedProduct?.coverImagePath
        || selectedProductSnapshot?.coverImagePath
        || activeSession?.coverImagePath
        || activeSessionMeta?.coverImagePath
        || DEFAULT_PRODUCT_IMAGE,
      latestEpisodeNo:
        selectedProduct?.latestEpisodeNo
        || selectedProductSnapshot?.latestEpisodeNo
        || activeSession?.latestEpisodeNo
        || activeSessionMeta?.latestEpisodeNo
        || 0,
      publishedLatestEpisodeNo: resolveWebsochatPublishedLatestEpisodeNo(
        selectedProduct?.publishedLatestEpisodeNo
          || selectedProductSnapshot?.publishedLatestEpisodeNo
          || activeSession?.publishedLatestEpisodeNo
          || activeSessionMeta?.publishedLatestEpisodeNo,
        selectedProduct?.latestEpisodeNo
          || selectedProductSnapshot?.latestEpisodeNo
          || activeSession?.latestEpisodeNo
          || activeSessionMeta?.latestEpisodeNo
      ),
      syncedLatestEpisodeNo:
        selectedProduct?.syncedLatestEpisodeNo
        || selectedProductSnapshot?.syncedLatestEpisodeNo
        || activeSession?.syncedLatestEpisodeNo
        || activeSessionMeta?.syncedLatestEpisodeNo
        || 0,
    };
  }, [activeSession, activeSessionMeta, effectiveProductId, selectedProduct, selectedProductSnapshot]);
  const hasStartedConversation = !!activeSessionId && activeSessionMessageCount > 0;
  const canSwitchProductBeforeConversation =
    !!activeSessionId && !isMessagesFetching && activeSessionMessageCount === 0;
  const isProductSelectionLocked =
    !!activeSessionId && !isPreparingNewSession && !canSwitchProductBeforeConversation;
  const canUseAccountReadScope = canUseAccountScope;
  const normalizedKeyword = keyword.trim();
  const normalizedSubmittedKeyword = submittedKeyword.trim();
  const isSearchDirty = normalizedKeyword !== normalizedSubmittedKeyword;
  useEffect(() => {
    if (!isProductPickerOpen) return;
    if (normalizedSubmittedKeyword.length === 0) return;
    void refetchProducts();
  }, [isProductPickerOpen, normalizedSubmittedKeyword, refetchProducts]);
  const detectedReadScope = formatWebsochatReadScope(
    effectiveReadEpisodeNo,
    detectedReadEpisodeTitle
  );
  const detectedReadScopeLabel = !isAuthInitialized
    ? "읽은 범위 자동 감지: 확인하고 있어요"
    : effectiveReadEpisodeNo
      ? `읽은 범위 자동 감지: ${detectedReadScope}`
      : canUseAccountReadScope
        ? "읽은 범위 자동 감지: 아직 읽은 기록이 없어요"
        : "읽은 범위 자동 감지: 로그인하면 자동으로 맞춰드릴게요.";
  const pendingSessionReadScopeLabel =
    pendingSessionPreview?.sessionId === activeSessionId
      ? buildWebsochatSessionReadScopeText(
          pendingSessionPreview.readScopeState,
          pendingSessionPreview.readEpisodeNo,
          pendingSessionPreview.readEpisodeTitle
        )
      : "";
  const sessionProductSummaryReadLabel = !isAuthInitialized && canUseAccountReadScope
    ? "확인 중"
    : activeSessionId
      ? (
        pendingSessionReadScopeLabel
        || buildWebsochatSessionReadScopeText(
          activeSessionReadScopeState,
          userReadEpisodeNo,
          userReadEpisodeTitle
        ) || "읽은 범위 미설정"
      )
      : userReadEpisodeNo
        ? formatWebsochatReadScope(userReadEpisodeNo, userReadEpisodeTitle)
        : canUseAccountReadScope
          ? "아직 읽기 전"
          : "로그인 후 자동 감지";
  const isReadScopeGuardPending = !isAuthInitialized && canUseAccountReadScope;
  const canSendMessage = activeSession?.canSendMessage ?? activeSessionMeta?.canSendMessage ?? true;
  const isDraftSession = isPreparingNewSession || !activeSessionId;
  const isWaitingForInitialStarter =
    !!activeSessionId
    && activeSessionMessageCount === 0
    && !effectiveStarter;
  const shouldShowMessagesLoadingSpinner =
    isMessagesFetching
    && !messageFeedItems.length
    && !effectiveStarter;
  const areShortcutActionsDisabled =
    !effectiveProductId
    || !canSendMessage
    || isStreamingMessage
    || isAssistantTurnPending
    || isCreatingSession
    || isDeletingSession
    || isReadScopeGuardPending
    || !!pendingModeSyncKey
    || isWaitingForInitialStarter;
  const isSelectedProductReady = selectedProduct
    ? selectedProduct.contextStatus === "ready"
    : (selectedProductId ? (activeSessionMeta?.canSendMessage ?? false) : false);
  const isSearchButtonDisabled =
    isProductSelectionLocked
    || (!normalizedKeyword.length && !normalizedSubmittedKeyword.length);
  const unavailableMessage =
    activeSession?.unavailableMessage
    || activeSessionMeta?.unavailableMessage
    || "비공개된 작품과는 더이상 이야기하실 수 없습니다.";
  const getBlockedQaActionNotice = useCallback(
    (qaActionKey?: "predict" | "next_episode_write" | null) => {
      if (qaActionKey !== "next_episode_write") return null;
      if (!isNextEpisodeWriteBlocked) return null;
      return nextEpisodeWriteBlockedNotice;
    },
    [isNextEpisodeWriteBlocked, nextEpisodeWriteBlockedNotice]
  );

  const enterDraftSession = useCallback((openProductPicker?: boolean) => {
    writeStoredActiveSessionId(null);
    setIsPreparingNewSession(true);
    setActiveSessionId(null);
    setSelectedProductId(null);
    setSelectedProductSnapshot(null);
    setPendingSessionPreview(null);
    setStickyStarter(null);
    clearSessionScopedComposerState();
    setModeNotices((current) => current.filter((notice) => notice.sessionId !== null));
    setStickyGuides((current) => current.filter((guide) => guide.sessionId !== null));
    setLocalStarters((current) => current.filter((starter) => starter.sessionId !== null));
    ensureDraftPreludeSeeded();
    if (openProductPicker) {
      setIsProductPickerOpen(true);
    }
  }, [clearSessionScopedComposerState, ensureDraftPreludeSeeded, writeStoredActiveSessionId]);

  useEffect(() => {
    const pendingLaunch = consumePendingWebsochatLaunch();
    if (!pendingLaunch) return;

    enterDraftSession(false);
    const launchStarter = buildWebsochatLaunchStarter(pendingLaunch);
    setStickyStarter(launchStarter);
    setSelectedProductSnapshot(
      buildWebsochatProductSnapshot({
        productId: pendingLaunch.productId,
        title: pendingLaunch.title,
        authorNickname: pendingLaunch.authorNickname,
        coverImagePath: pendingLaunch.coverImagePath,
        latestEpisodeNo: pendingLaunch.latestEpisodeNo,
        publishedLatestEpisodeNo: pendingLaunch.publishedLatestEpisodeNo,
        syncedLatestEpisodeNo: pendingLaunch.syncedLatestEpisodeNo,
        contextStatus: pendingLaunch.contextStatus,
      })
    );
    setSelectedProductId(pendingLaunch.productId);
    appendLocalStarter({
      starter: launchStarter,
      sessionId: null,
      productId: pendingLaunch.productId,
      cardSnapshot: {
        productId: pendingLaunch.productId,
        productTitle: pendingLaunch.title,
        authorNickname: pendingLaunch.authorNickname || null,
        coverImagePath: pendingLaunch.coverImagePath || null,
        publishedLatestEpisodeNo: resolveWebsochatPublishedLatestEpisodeNo(
          pendingLaunch.publishedLatestEpisodeNo,
          pendingLaunch.latestEpisodeNo
        ),
        readScopeLabel: canUseAccountScope
          ? "읽은 범위 자동 감지: 작품 선택 후 맞춰드릴게요."
          : "읽은 범위 자동 감지: 로그인하면 자동으로 맞춰드릴게요.",
      },
    });
    setPendingLaunchPayload(pendingLaunch);
  }, [appendLocalStarter, canUseAccountScope, enterDraftSession]);
  const fetchLatestAccountReadEpisodeNo = useCallback(
    async (
      productId: number | null,
      runtimeCanUseAccountReadScope: boolean = canUseAccountReadScope
    ) => {
      if (!productId || !runtimeCanUseAccountReadScope) {
        return null;
      }
      const response = await queryClient.fetchQuery(
        getEpisodeListQueryOptions(
          {
            product_id: String(productId),
            page: 1,
            limit: 1,
            order_by: "episodeNo",
            order_dir: "asc",
          },
          true
        )
      );
      const latestReadEpisodeNo = response.data.latestEpisodeNo ?? 0;
      return latestReadEpisodeNo > 0 ? latestReadEpisodeNo : null;
    },
    [canUseAccountReadScope, queryClient]
  );

  const resolveRuntimeWebsochatActorScope = useCallback(() => {
    const storedAccessToken =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem("access_token")
          || window.sessionStorage.getItem("access_token");
    const runtimeCanUseAccountScope =
      !!accessToken || isAuthenticated || !!user?.userId || !!storedAccessToken;
    const runtimeGuestKey = runtimeCanUseAccountScope ? null : guestKey;
    const runtimeActorKey = runtimeCanUseAccountScope
      ? user?.userId
        ? `user:${user.userId}`
        : storedAccessToken
          ? "auth"
          : ""
      : guestKey;

    return {
      canUseAccountScope: runtimeCanUseAccountScope,
      guestKey: runtimeGuestKey,
      actorKey: runtimeActorKey,
    };
  }, [accessToken, guestKey, isAuthenticated, user?.userId]);

  const openLoginConfirm = () => {
    const currentUrl = encodeURIComponent(pathname || "/websochat");
    setConfirm({
      content: "웹소챗은 하루 2번까지 무료예요. 이어서 이야기하려면 로그인해 주세요.",
      confirmText: "로그인하기",
      onConfirm: () => {
        window.location.href = `/login?redirect=${currentUrl}`;
      },
      buttonCount: 2,
    });
  };

  const moveToCashChargePage = () => {
    router.push("/product/mypage/cash");
  };

  const ensureActiveSessionForComposerMode = useCallback(async () => {
    if (activeSessionId) return activeSessionId;
    if (!effectiveProductId || isReadScopeGuardPending) return null;

    const runtimeActorScope = resolveRuntimeWebsochatActorScope();
    const latestAccountReadEpisodeNo = await fetchLatestAccountReadEpisodeNo(
      effectiveProductId,
      runtimeActorScope.canUseAccountScope
    );
    const createdDate = new Date().toISOString();
    const created = await createSession({
      product_id: effectiveProductId,
      guest_key: runtimeActorScope.guestKey || undefined,
      adult_yn: adultYn,
      account_read_episode_to: latestAccountReadEpisodeNo,
    });
    const sessionId = created.data.sessionId;
    const resolvedReadEpisodeNo = resolveWebsochatConversationCeilingEpisodeNo(
      latestAccountReadEpisodeNo || effectiveReadEpisodeNo || null,
      created.data.product.syncedLatestEpisodeNo,
      resolveWebsochatPublishedLatestEpisodeNo(
        created.data.product.publishedLatestEpisodeNo,
        created.data.product.latestEpisodeNo
      )
    ) || null;

    setIsPreparingNewSession(false);
    setActiveSessionId(sessionId);
    writeStoredActiveSessionId(sessionId);
    bindDraftPreludeToSession(sessionId, effectiveProductId);
    setSelectedProductSnapshot(created.data.product);
    setPendingSessionPreview({
      sessionId,
      productId: effectiveProductId,
      title: "새 대화",
      createdDate,
      updatedDate: createdDate,
      productTitle: created.data.product.title || selectedProduct?.title || selectedProductSnapshot?.title || null,
      productAuthorNickname:
        created.data.product.authorNickname
        || selectedProduct?.authorNickname
        || selectedProductSnapshot?.authorNickname
        || null,
      coverImagePath:
        created.data.product.coverImagePath
        || selectedProduct?.coverImagePath
        || selectedProductSnapshot?.coverImagePath
        || null,
      readScopeState:
        (latestAccountReadEpisodeNo || effectiveReadEpisodeNo) ? "known" : "unknown",
      readEpisodeNo: resolvedReadEpisodeNo,
      readEpisodeTitle:
        resolvedReadEpisodeNo === (latestAccountReadEpisodeNo || effectiveReadEpisodeNo || null)
          ? detectedReadEpisodeTitle || null
          : null,
      latestEpisodeNo: created.data.product.latestEpisodeNo || 0,
      publishedLatestEpisodeNo: resolveWebsochatPublishedLatestEpisodeNo(
        created.data.product.publishedLatestEpisodeNo,
        created.data.product.latestEpisodeNo
      ),
      syncedLatestEpisodeNo: created.data.product.syncedLatestEpisodeNo || 0,
      contextStatus: created.data.product.contextStatus || "ready",
      canSendMessage: true,
      unavailableMessage: null,
    });
    await queryClient.invalidateQueries({ queryKey: ["websochatSessions"] });
    return sessionId;
  }, [
    activeSessionId,
    adultYn,
    bindDraftPreludeToSession,
    createSession,
    detectedReadEpisodeTitle,
    effectiveProductId,
    effectiveReadEpisodeNo,
    fetchLatestAccountReadEpisodeNo,
    isReadScopeGuardPending,
    queryClient,
    resolveRuntimeWebsochatActorScope,
    selectedProduct,
    selectedProductSnapshot,
    writeStoredActiveSessionId,
  ]);

  const syncSessionModeGuide = useCallback(async (
    sessionId: number,
    modeKey: "qa" | "rp" | "ideal_worldcup",
    forceEntryGuide = false
  ) => {
    const runtimeActorScope = resolveRuntimeWebsochatActorScope();
    await patchSessionMode({
      sessionId,
      guest_key: runtimeActorScope.guestKey || undefined,
      mode_key: modeKey,
      rp_mode: modeKey === "rp" ? "free" : null,
      force_entry_guide: forceEntryGuide,
    });
    await queryClient.invalidateQueries({ queryKey: ["websochatSessions"] });
    await queryClient.fetchQuery(
      getWebsochatMessagesQueryOptions(sessionId, runtimeActorScope.actorKey || websochatActorKey, runtimeActorScope.guestKey)
    );
  }, [patchSessionMode, queryClient, resolveRuntimeWebsochatActorScope, websochatActorKey]);

  const activateRpCharacterSelectionMode = useCallback(async () => {
    appendWebsochatDebugLog("activate_rp_character_selection_mode:start", {
      activeSessionId,
      effectiveProductId,
      effectiveMode,
      currentModeReadScopeText,
    });
    setActiveShortcutPrompt("인물과 대화");
    enterRpAwaitingCharacterState();
    try {
      return await enqueueModeSync("rp", async () => {
        const sessionId = await ensureActiveSessionForComposerMode();
        if (!sessionId) return null;
        await syncSessionModeGuide(sessionId, "rp");
        appendWebsochatDebugLog("activate_rp_character_selection_mode:done", {
          sessionId,
        });
        return sessionId;
      });
    } catch (error) {
      appendWebsochatDebugLog("activate_rp_character_selection_mode:error", {
        error: error instanceof Error ? error.message : String(error),
      });
      setActiveShortcutPrompt("");
      resetComposerUiState();
      throw error;
    }
  }, [
    enqueueModeSync,
    ensureActiveSessionForComposerMode,
    enterRpAwaitingCharacterState,
    resetComposerUiState,
    activeSessionId,
    currentModeReadScopeText,
    effectiveMode,
    effectiveProductId,
    syncSessionModeGuide,
  ]);

  const clearRpCharacterSelectionMode = useCallback(async () => {
    appendWebsochatDebugLog("clear_rp_character_selection_mode:start", {
      activeSessionId,
      effectiveMode,
      currentModeReadScopeText,
    });
    if (!activeSessionId) return null;
    return enqueueModeSync("qa", async () => {
      await syncSessionModeGuide(activeSessionId, "qa");
      appendWebsochatDebugLog("clear_rp_character_selection_mode:done", {
        sessionId: activeSessionId,
      });
      return activeSessionId;
    });
  }, [activeSessionId, currentModeReadScopeText, effectiveMode, enqueueModeSync, syncSessionModeGuide]);

  const forceQaEntryGuideMode = useCallback(async (sessionId: number) => {
    const requestSeq = modeSyncRequestSeqRef.current + 1;
    modeSyncRequestSeqRef.current = requestSeq;
    setPendingModeSyncKey("qa");
    try {
      await syncSessionModeGuide(sessionId, "qa", true);
      return sessionId;
    } finally {
      if (modeSyncRequestSeqRef.current === requestSeq) {
        setPendingModeSyncKey(null);
      }
    }
  }, [syncSessionModeGuide]);

  const handleForegroundSync = useCallback(async () => {
    if (!websochatActorKey) return;
    await queryClient.invalidateQueries({ queryKey: ["websochatBillingStatus", websochatActorKey] });
    await queryClient.invalidateQueries({ queryKey: ["websochatSessions"] });
    await refetchSessions();
    if (activeSessionId) {
      await queryClient.invalidateQueries({
        queryKey: ["websochatMessages", activeSessionId, websochatActorKey],
      });
      await queryClient.fetchQuery(
        getWebsochatMessagesQueryOptions(activeSessionId, websochatActorKey, websochatGuestKey)
      );
    }
    if (selectedProductId && canUseAccountReadScope) {
      await queryClient.invalidateQueries({
        queryKey: getEpisodeListQueryOptions(selectedProductEpisodeListParams, true).queryKey,
      });
    }
  }, [
    activeSessionId,
    canUseAccountReadScope,
    queryClient,
    refetchSessions,
    selectedProductEpisodeListParams,
    selectedProductId,
    websochatActorKey,
    websochatGuestKey,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocus = () => {
      void handleForegroundSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void handleForegroundSync();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleForegroundSync]);

  const handleDeleteSession = (sessionId: number) => {
    setConfirm({
      content: "이 세션은 지울게요.",
      confirmText: "삭제",
      onConfirm: async () => {
        await deleteSession({
          sessionId,
          guest_key: websochatGuestKey || undefined,
        });
        removeStoredSessionShortcutPrompt(sessionId);
        if (activeSessionId === sessionId) {
          if (sessionsData?.data?.length === 1) {
            enterDraftSession(false);
          } else {
            clearSessionScopedComposerState();
            setIsPreparingNewSession(false);
            setModeNotices((current) =>
              current.filter((notice) => notice.sessionId !== sessionId)
            );
            setStickyGuides((current) =>
              current.filter((guide) => guide.sessionId !== sessionId)
            );
            setLocalStarters((current) =>
              current.filter((starter) => starter.sessionId !== sessionId)
            );
            setPendingSessionPreview(null);
          }
        }
        if (activeSessionId !== sessionId) {
          setModeNotices((current) =>
            current.filter((notice) => notice.sessionId !== sessionId)
          );
          setStickyGuides((current) =>
            current.filter((guide) => guide.sessionId !== sessionId)
          );
          setLocalStarters((current) =>
            current.filter((starter) => starter.sessionId !== sessionId)
          );
        }
        await queryClient.invalidateQueries({ queryKey: ["websochatSessions"] });
        await queryClient.invalidateQueries({ queryKey: ["websochatMessages"] });
      },
      buttonCount: 2,
    });
  };

  const handleCreateSession = async () => {
    if (isReadScopeGuardPending) return;
    setIsSessionDrawerOpen(false);
    enterDraftSession(false);
  };

  const handleSelectSession = (sessionId: number, productId: number | null) => {
    clearSessionScopedComposerState();
    setIsSessionDrawerOpen(false);
    setIsPreparingNewSession(false);
    setSelectedProductSnapshot(null);
    setPendingSessionPreview(null);
    setSelectedProductId(productId);
    setActiveSessionId(sessionId);
    writeStoredActiveSessionId(sessionId);
  };

  const handleClickSessionProduct = () => {
    if (sessionProductSummary?.productId && sessionProductSummary?.title) {
      const productDetailPath = buildProductDetailPath(sessionProductSummary.productId);
      const productDetailUrl = typeof window === "undefined"
        ? productDetailPath
        : new URL(productDetailPath, window.location.origin).toString();
      window.open(productDetailUrl, "_blank");
      return;
    }

    if (!isProductSelectionLocked) {
      setIsProductPickerOpen(true);
    }
  };

  const handleOpenProductPicker = () => {
    if (isProductSelectionLocked) return;
    setIsProductPickerOpen(true);
  };

  const handleSend = async (
    nextContent?: string,
    options?: {
      starterModeKey?: "qa" | "rp" | "ideal_worldcup" | null;
      qaActionKey?: "predict" | "next_episode_write" | null;
      rpMode?: "free" | "scene" | null;
      activeCharacter?: string | null;
      gameMode?: "ideal_worldcup" | "vs_game" | null;
    }
  ) => {
    const content = (nextContent ?? draft).trim();
    if (
      !content
      || !effectiveProductId
      || !canSendMessage
      || isReadScopeGuardPending
      || isAssistantTurnPending
    ) return null;
    appendWebsochatDebugLog("handle_send:start", {
      activeSessionId,
      effectiveProductId,
      contentPreview: content.slice(0, 80),
      composerMode,
      rpStage,
      effectiveMode,
      activeCharacterLabel,
      activeShortcutPrompt,
      pendingModeSyncKey,
      transientCount: transientMessages.length,
      isPostingMessage,
      isStreamingMessage,
      isAssistantTurnPending,
      starterModeKey: options?.starterModeKey ?? null,
      qaActionKey: options?.qaActionKey ?? null,
      rpMode: options?.rpMode ?? null,
      activeCharacterOption: options?.activeCharacter ?? null,
    });
    const assistantTurnOwnerSeq = assistantTurnOwnerSeqRef.current + 1;
    assistantTurnOwnerSeqRef.current = assistantTurnOwnerSeq;
    const isCurrentAssistantTurnOwner = () =>
      assistantTurnOwnerSeqRef.current === assistantTurnOwnerSeq;
    setIsAssistantTurnPending(true);
    let requestCanUseAccountScope = canUseAccountScope;

    try {
      await waitForPendingModeSync();
      if (!isCurrentAssistantTurnOwner()) return null;
      const runtimeActorScope = resolveRuntimeWebsochatActorScope();
      requestCanUseAccountScope = runtimeActorScope.canUseAccountScope;
      const requestGuestKey = runtimeActorScope.guestKey;
      const requestActorKey = runtimeActorScope.actorKey || websochatActorKey;
      const blockedNotice = getBlockedQaActionNotice(options?.qaActionKey ?? null);
      if (blockedNotice) {
        setActiveShortcutPrompt("");
        resetComposerUiState();
        appendModeNotice(blockedNotice);
        return null;
      }
      const latestAccountReadEpisodeNo = await fetchLatestAccountReadEpisodeNo(
        effectiveProductId,
        requestCanUseAccountScope
      );
      const latestBillingStatusResponse = await queryClient.fetchQuery(
        getWebsochatBillingStatusQueryOptions(
          requestActorKey,
          requestGuestKey,
          options?.qaActionKey ?? null
        )
      );
      const billingStatus = latestBillingStatusResponse.data;
      if (billingStatus.requiresLoginForNextMessage && !requestCanUseAccountScope) {
        openLoginConfirm();
        return null;
      }
      if (
        billingStatus.requiresCashForNextMessage
        && requestCanUseAccountScope
        && (billingStatus.cashBalance ?? 0) < billingStatus.cashCostPerMessage
      ) {
        moveToCashChargePage();
        return null;
      }
      const isPendingRpSelectionReply =
        isRpAwaitingCharacter
        && !options?.starterModeKey
        && !options?.rpMode
        && !options?.activeCharacter;
      const resolvedStarterModeKey =
        options?.starterModeKey ?? (isPendingRpSelectionReply ? "rp" : null);
      const resolvedRpMode =
        options?.rpMode ?? (isPendingRpSelectionReply ? "free" : null);
      const resolvedActiveCharacter =
        options?.activeCharacter ?? (isPendingRpSelectionReply ? content : null);
      const resolvedStreamingKind: WebsochatStreamingKind =
        options?.gameMode === "ideal_worldcup" || resolvedStarterModeKey === "ideal_worldcup"
          ? "ideal_worldcup"
          : resolvedStarterModeKey === "rp" || resolvedRpMode === "free" || !!resolvedActiveCharacter
            ? "rp"
            : "qa";
      const isPredictAction = options?.qaActionKey === "predict";
      const isNextEpisodeAction = options?.qaActionKey === "next_episode_write";
      const shouldUseStreaming = !isPredictAction && !isNextEpisodeAction;
      const clientMessageId = window.crypto.randomUUID();
      const sendModeSyncRequestSeq = modeSyncRequestSeqRef.current;
      appendWebsochatDebugLog("handle_send:resolved", {
        activeSessionId,
        clientMessageId,
        resolvedStarterModeKey,
        resolvedRpMode,
        resolvedActiveCharacter,
        resolvedStreamingKind,
        isPendingRpSelectionReply,
        sendModeSyncRequestSeq,
        assistantTurnOwnerSeq,
      });

      let sessionId = activeSessionId;
      const tempSeed = Date.now();
      const createdDate = new Date(tempSeed).toISOString();
      const assistantCreatedDate = new Date(tempSeed + 2).toISOString();
      const userTempId = -tempSeed;
      const assistantTempId = -(tempSeed + 1);
      const applyCompletedResponse = async (
        completedData: {
          sessionId: number;
          messages: IWebsochatMessageItem[];
        }
      ) => {
        if (!isCurrentAssistantTurnOwner()) return;
        appendWebsochatDebugLog("handle_send:apply_completed_response:start", {
          sessionId: completedData.sessionId,
          messageCount: completedData.messages.length,
        });
        const previousMessagesPayload = queryClient.getQueryData<IGetWebsochatMessagesResponse>([
          "websochatMessages",
          sessionId,
          requestActorKey,
        ]);
        let refreshedMessagesPayload: IGetWebsochatMessagesResponse | null = null;
        try {
          refreshedMessagesPayload = await queryClient.fetchQuery(
            getWebsochatMessagesQueryOptions(
              completedData.sessionId,
              requestActorKey,
              requestGuestKey
            )
          );
        } catch {
          refreshedMessagesPayload = null;
        }
        const resolvedSession =
          refreshedMessagesPayload?.data?.session
          ?? previousMessagesPayload?.data?.session
          ?? messagesData?.data?.session
          ?? null;
        const resolvedMessages =
          refreshedMessagesPayload?.data?.messages
          ?? completedData.messages;
        const resolvedStarter =
          refreshedMessagesPayload?.data?.starter
          ?? previousMessagesPayload?.data?.starter
          ?? messagesData?.data?.starter
          ?? stickyStarter
          ?? null;
        const nextMessagesPayload: IGetWebsochatMessagesResponse = {
          data: {
            session: resolvedSession || {
              sessionId: completedData.sessionId,
              productId: effectiveProductId,
              title: activeSession?.title || content.slice(0, 40) || "새 대화",
              createdDate: activeSession?.createdDate || "",
              updatedDate: activeSession?.updatedDate || "",
              productTitle: selectedProduct?.title || activeSessionMeta?.productTitle || null,
              productAuthorNickname:
                selectedProduct?.authorNickname || activeSessionMeta?.productAuthorNickname || null,
              coverImagePath:
                selectedProduct?.coverImagePath || activeSessionMeta?.coverImagePath || null,
              readScopeState:
                activeSessionMeta?.readScopeState ?? activeSession?.readScopeState ?? "unknown",
              readEpisodeNo:
                activeSessionMeta?.readEpisodeNo ?? activeSession?.readEpisodeNo ?? null,
              readEpisodeTitle:
                activeSessionMeta?.readEpisodeTitle ?? activeSession?.readEpisodeTitle ?? null,
              latestEpisodeNo:
                selectedProduct?.latestEpisodeNo || activeSessionMeta?.latestEpisodeNo || 0,
              publishedLatestEpisodeNo: resolveWebsochatPublishedLatestEpisodeNo(
                selectedProduct?.publishedLatestEpisodeNo || activeSessionMeta?.publishedLatestEpisodeNo,
                selectedProduct?.latestEpisodeNo || activeSessionMeta?.latestEpisodeNo
              ),
              syncedLatestEpisodeNo:
                selectedProduct?.syncedLatestEpisodeNo || activeSessionMeta?.syncedLatestEpisodeNo || 0,
              contextStatus: selectedProduct?.contextStatus || activeSessionMeta?.contextStatus || null,
              canSendMessage: activeSessionMeta?.canSendMessage ?? true,
              unavailableMessage: activeSessionMeta?.unavailableMessage || null,
              rpStage: activeSessionMeta?.rpStage ?? activeSession?.rpStage ?? "idle",
              rpActiveCharacterLabel:
                activeSessionMeta?.rpActiveCharacterLabel
                ?? activeSession?.rpActiveCharacterLabel
                ?? null,
            },
            messages: resolvedMessages,
            starter: resolvedStarter,
          },
        };
        queryClient.setQueryData(["websochatMessages", sessionId, requestActorKey], nextMessagesPayload);
        appendWebsochatDebugLog("handle_send:apply_completed_response:done", {
          sessionId: completedData.sessionId,
          resolvedMessageCount: resolvedMessages.length,
          resolvedStarter: Boolean(resolvedStarter),
          resolvedRpStage: resolvedSession?.rpStage ?? null,
          resolvedRpActiveCharacterLabel: resolvedSession?.rpActiveCharacterLabel ?? null,
        });
        if (resolvedSession) {
          queryClient.setQueriesData(
            { queryKey: ["websochatSessions"] },
            (current: IGetWebsochatSessionsResponse | undefined) => {
              if (!current?.data?.length) return current;
              return {
                data: current.data.map((item) =>
                  item.sessionId === completedData.sessionId
                    ? {
                        ...item,
                        title: resolvedSession.title || item.title,
                        productId: resolvedSession.productId || item.productId,
                        productTitle: resolvedSession.productTitle || item.productTitle,
                        productAuthorNickname:
                          resolvedSession.productAuthorNickname || item.productAuthorNickname,
                        coverImagePath: resolvedSession.coverImagePath || item.coverImagePath,
                        readScopeState:
                          resolvedSession.readScopeState ?? item.readScopeState ?? "unknown",
                        readEpisodeNo:
                          resolvedSession.readEpisodeNo ?? item.readEpisodeNo ?? null,
                        readEpisodeTitle:
                          resolvedSession.readEpisodeTitle ?? item.readEpisodeTitle ?? null,
                        latestEpisodeNo:
                          resolvedSession.latestEpisodeNo ?? item.latestEpisodeNo ?? 0,
                        publishedLatestEpisodeNo:
                          resolvedSession.publishedLatestEpisodeNo ?? item.publishedLatestEpisodeNo ?? 0,
                        syncedLatestEpisodeNo:
                          resolvedSession.syncedLatestEpisodeNo ?? item.syncedLatestEpisodeNo ?? 0,
                        contextStatus: resolvedSession.contextStatus || item.contextStatus,
                        canSendMessage:
                          resolvedSession.canSendMessage ?? item.canSendMessage ?? true,
                        unavailableMessage:
                          resolvedSession.unavailableMessage ?? item.unavailableMessage ?? null,
                        rpStage: resolvedSession.rpStage ?? item.rpStage ?? "idle",
                        rpActiveCharacterLabel:
                          resolvedSession.rpActiveCharacterLabel ?? item.rpActiveCharacterLabel ?? null,
                        updatedDate: resolvedSession.updatedDate || item.updatedDate,
                      }
                    : item
                ),
              };
            }
          );
        }
      };

      if (!isCurrentAssistantTurnOwner()) return null;
      setTransientMessages(
        shouldUseStreaming
          ? [
              {
                messageId: userTempId,
                role: "user",
                content,
                createdDate,
              },
              {
                messageId: assistantTempId,
                role: "assistant",
                content: "",
                createdDate: assistantCreatedDate,
                isStreaming: true,
              },
            ]
          : [
              {
                messageId: userTempId,
                role: "user",
                content,
                createdDate,
              },
            ]
      );
      const requestedReadScopeEpisodeNo = extractWebsochatReadScopeEpisodeNo(content);
      if (requestedReadScopeEpisodeNo) {
        const requestedReadScopeNotice = buildWebsochatReadScopeAppliedNotice({
          episodeNo: requestedReadScopeEpisodeNo,
          episodeTitle:
            requestedReadScopeEpisodeNo === effectiveReadEpisodeNo
              ? detectedReadEpisodeTitle || null
              : null,
          isSyncPending:
            publishedLatestEpisodeNo > Number(syncedLatestEpisodeNo || 0)
            && Number(syncedLatestEpisodeNo || 0) > 0,
        });
      if (requestedReadScopeNotice) {
        if (
          publishedLatestEpisodeNo > Number(syncedLatestEpisodeNo || 0)
          && Number(syncedLatestEpisodeNo || 0) > 0
        ) {
          mergedReadScopeSyncNoticeKeyRef.current = `${effectiveProductId}:${publishedLatestEpisodeNo}:${syncedLatestEpisodeNo}`;
          syncPendingNoticeKeyRef.current = mergedReadScopeSyncNoticeKeyRef.current;
        }
        appendScopedModeNotice({
          content: requestedReadScopeNotice,
          kind: "mode",
            sessionId: activeSessionId ?? null,
            productId: effectiveProductId,
            createdAt: tempSeed + 1,
          });
        }
      }
      appendWebsochatDebugLog("handle_send:transient_set", {
        activeSessionId,
        userTempId,
        assistantTempId,
        isNextEpisodeAction,
      });
      setDraft("");
      setStreamingKind(resolvedStreamingKind);
      setStreamingQaActionKey(options?.qaActionKey ?? null);
      setHasStreamingContentStarted(false);
      setStreamingStartedAt(Date.now());
      if (shouldUseStreaming) {
        setIsStreamingMessage(true);
      }

      if (!sessionId) {
        const created = await createSession({
          product_id: effectiveProductId,
          guest_key: requestGuestKey || undefined,
          adult_yn: adultYn,
          account_read_episode_to: latestAccountReadEpisodeNo,
        });
        if (!isCurrentAssistantTurnOwner()) return null;
        sessionId = created.data.sessionId;
        setIsPreparingNewSession(false);
        setActiveSessionId(sessionId);
        bindDraftPreludeToSession(sessionId, effectiveProductId);
        setSelectedProductSnapshot(created.data.product);
        setPendingSessionPreview({
          sessionId,
          productId: effectiveProductId,
          title: "새 대화",
          createdDate,
          updatedDate: createdDate,
          productTitle: created.data.product.title || selectedProduct?.title || selectedProductSnapshot?.title || null,
          productAuthorNickname:
            created.data.product.authorNickname
            || selectedProduct?.authorNickname
            || selectedProductSnapshot?.authorNickname
            || null,
          coverImagePath:
            created.data.product.coverImagePath
            || selectedProduct?.coverImagePath
            || selectedProductSnapshot?.coverImagePath
            || null,
          readScopeState:
            (latestAccountReadEpisodeNo || effectiveReadEpisodeNo) ? "known" : "unknown",
          readEpisodeNo:
            resolveWebsochatConversationCeilingEpisodeNo(
              latestAccountReadEpisodeNo || effectiveReadEpisodeNo || null,
              created.data.product.syncedLatestEpisodeNo,
              resolveWebsochatPublishedLatestEpisodeNo(
                created.data.product.publishedLatestEpisodeNo,
                created.data.product.latestEpisodeNo
              )
            ) || null,
          readEpisodeTitle:
            resolveWebsochatConversationCeilingEpisodeNo(
              latestAccountReadEpisodeNo || effectiveReadEpisodeNo || null,
              created.data.product.syncedLatestEpisodeNo,
              resolveWebsochatPublishedLatestEpisodeNo(
                created.data.product.publishedLatestEpisodeNo,
                created.data.product.latestEpisodeNo
              )
            ) === (latestAccountReadEpisodeNo || effectiveReadEpisodeNo || null)
              ? detectedReadEpisodeTitle || null
              : null,
          latestEpisodeNo: created.data.product.latestEpisodeNo || 0,
          publishedLatestEpisodeNo: resolveWebsochatPublishedLatestEpisodeNo(
            created.data.product.publishedLatestEpisodeNo,
            created.data.product.latestEpisodeNo
          ),
          syncedLatestEpisodeNo: created.data.product.syncedLatestEpisodeNo || 0,
          contextStatus: created.data.product.contextStatus || "ready",
          canSendMessage: true,
          unavailableMessage: null,
        });
      }
      if (requestedReadScopeEpisodeNo) {
        applyCitationReadScopeToSessionCaches(sessionId, requestedReadScopeEpisodeNo, null);
      }

      let completedData: { sessionId: number; messages: IWebsochatMessageItem[] } | null = null;
      let streamTerminalError: string | null = null;
      let sawStreamDoneWithoutCompleted = false;
      try {
        if (!shouldUseStreaming) {
          const response = isNextEpisodeAction
            ? await postNextEpisodeMessage({
                sessionId,
                content,
                client_message_id: clientMessageId,
                guest_key: requestGuestKey || undefined,
                starter_mode_key: resolvedStarterModeKey,
                qa_action_key: options?.qaActionKey ?? null,
                rp_mode: resolvedRpMode,
                active_character: resolvedActiveCharacter,
                game_mode: options?.gameMode,
                game_read_episode_to: resolvedStreamingKind === "ideal_worldcup" ? latestAccountReadEpisodeNo : null,
                account_read_episode_to: latestAccountReadEpisodeNo,
              })
            : await postMessage({
                sessionId,
                content,
                client_message_id: clientMessageId,
                guest_key: requestGuestKey || undefined,
                starter_mode_key: resolvedStarterModeKey,
                qa_action_key: options?.qaActionKey ?? null,
                rp_mode: resolvedRpMode,
                active_character: resolvedActiveCharacter,
                game_mode: options?.gameMode,
                game_read_episode_to: resolvedStreamingKind === "ideal_worldcup" ? latestAccountReadEpisodeNo : null,
                account_read_episode_to: latestAccountReadEpisodeNo,
              });
          if (isNextEpisodeAction && isCurrentAssistantTurnOwner()) {
            setIsNextEpisodeCompletionHolding(true);
            setStreamingProgressPercent(100);
            setStreamingStatusMessage("완성본 정리 중이에요.");
            await new Promise((resolve) => window.setTimeout(resolve, 1500));
          }
          await applyCompletedResponse(response.data);
          if (isCurrentAssistantTurnOwner()) {
            setTransientMessages([]);
            setStreamingStatusMessage("");
            setStreamingQaActionKey(null);
            setHasStreamingContentStarted(false);
            setStreamingStartedAt(null);
            setStreamingProgressPercent(0);
            setIsNextEpisodeCompletionHolding(false);
          }
        } else {
          try {
            await postWebsochatMessageStream(
              {
                sessionId,
                content,
                client_message_id: clientMessageId,
                guest_key: requestGuestKey || undefined,
                starter_mode_key: resolvedStarterModeKey,
                qa_action_key: options?.qaActionKey ?? null,
                rp_mode: resolvedRpMode,
                active_character: resolvedActiveCharacter,
                game_mode: options?.gameMode,
                game_read_episode_to: resolvedStreamingKind === "ideal_worldcup" ? latestAccountReadEpisodeNo : null,
                account_read_episode_to: latestAccountReadEpisodeNo,
              },
              (event) => {
                if (!isCurrentAssistantTurnOwner()) return;
                if (event.event === "assistant_delta") {
                  if (event.data.delta) {
                    if (!hasStreamingContentStarted) {
                      appendWebsochatDebugLog("handle_send:assistant_delta_started", {
                        sessionId,
                        assistantTempId,
                      });
                    }
                    setHasStreamingContentStarted(true);
                  }
                  setStreamingStatusMessage("");
                  setTransientMessages((current) =>
                    current.map((message) =>
                      message.messageId === assistantTempId
                        ? {
                            ...message,
                            content: `${message.content || ""}${event.data.delta || ""}`,
                            isStreaming: true,
                          }
                        : message
                    )
                  );
                  return;
                }
                if (event.event === "assistant_completed") {
                  completedData = event.data;
                  return;
                }
                if (event.event === "assistant_error") {
                  streamTerminalError =
                    typeof event.data?.detail === "string" && event.data.detail.trim()
                      ? event.data.detail.trim()
                      : "websochat stream failed";
                  return;
                }
                if (event.event === "done" && !completedData && !streamTerminalError) {
                  sawStreamDoneWithoutCompleted = true;
                }
              }
            );
            if (completedData) {
              await applyCompletedResponse(completedData);
            } else if (streamTerminalError) {
              throw new Error(streamTerminalError);
            } else if (sawStreamDoneWithoutCompleted) {
              throw new Error("websochat stream done event arrived without assistant_completed");
            } else {
              throw new Error("websochat stream completed event missing");
            }
          } catch (streamError) {
            setStreamingStatusMessage("");
            const response = await postMessage({
              sessionId,
              content,
              client_message_id: clientMessageId,
              guest_key: requestGuestKey || undefined,
              starter_mode_key: resolvedStarterModeKey,
              qa_action_key: options?.qaActionKey ?? null,
              rp_mode: resolvedRpMode,
              active_character: resolvedActiveCharacter,
              game_mode: options?.gameMode,
              game_read_episode_to: resolvedStreamingKind === "ideal_worldcup" ? latestAccountReadEpisodeNo : null,
              account_read_episode_to: latestAccountReadEpisodeNo,
            });
            await applyCompletedResponse(response.data);
          }
        }
      } finally {
        appendWebsochatDebugLog("handle_send:finally_cleanup", {
          sessionId,
          resolvedStarterModeKey,
          resolvedStreamingKind,
          assistantTurnOwnerSeq,
          isCurrentAssistantTurnOwner: isCurrentAssistantTurnOwner(),
        });
        if (isCurrentAssistantTurnOwner()) {
          resetAssistantTurnVisualState();
        }
      }

      const shouldApplyPostSendModeState =
        isCurrentAssistantTurnOwner()
        && modeSyncRequestSeqRef.current === sendModeSyncRequestSeq;
      appendWebsochatDebugLog("handle_send:post_mode_guard", {
        sessionId,
        resolvedStarterModeKey,
        sendModeSyncRequestSeq,
        latestModeSyncRequestSeq: modeSyncRequestSeqRef.current,
        shouldApplyPostSendModeState,
      });

      if (shouldApplyPostSendModeState) {
        if (resolvedStarterModeKey === "qa") {
          setComposerMode("qa");
          setRpStage("idle");
          setActiveCharacterLabel(null);
        } else if (resolvedStarterModeKey === "ideal_worldcup") {
          setComposerMode("ideal_worldcup");
          setRpStage("idle");
          setActiveCharacterLabel(null);
        } else if (resolvedStarterModeKey === "rp" && resolvedActiveCharacter && resolvedRpMode === "free") {
          enterRpChattingState(resolvedActiveCharacter);
        }
      }
      await queryClient.invalidateQueries({
        queryKey: ["websochatBillingStatus", requestActorKey],
      });
      await queryClient.invalidateQueries({
        queryKey: ["websochatMessages", sessionId, requestActorKey],
      });
      await queryClient.invalidateQueries({
        queryKey: ["websochatSessions"],
      });
      appendWebsochatDebugLog("handle_send:completed", {
        sessionId,
        resolvedStarterModeKey,
        composerModeAfter:
          resolvedStarterModeKey === "qa"
            ? "qa"
            : resolvedStarterModeKey === "ideal_worldcup"
              ? "ideal_worldcup"
              : "rp",
      });
      return sessionId;
    } catch (error) {
      appendWebsochatDebugLog("handle_send:error", {
        activeSessionId,
        error: error instanceof Error ? error.message : String(error),
        assistantTurnOwnerSeq,
        isCurrentAssistantTurnOwner: isCurrentAssistantTurnOwner(),
      });
      if (!isCurrentAssistantTurnOwner()) {
        return null;
      }
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 && !requestCanUseAccountScope) {
          openLoginConfirm();
          return null;
        }

        const message = error.response?.data?.message;
        if (message === "캐시 잔액이 부족합니다.") {
          moveToCashChargePage();
          return null;
        }
      }

      appendModeNotice(buildWebsochatErrorNotice(error));
      return null;
    } finally {
      appendWebsochatDebugLog("handle_send:outer_finally_unlock", {
        activeSessionId,
        assistantTurnOwnerSeq,
        isCurrentAssistantTurnOwner: isCurrentAssistantTurnOwner(),
      });
      if (isCurrentAssistantTurnOwner()) {
        setIsAssistantTurnPending(false);
      }
    }
  };

  const applyCitationReadScopeToSessionCaches = useCallback(
    (
      sessionId: number,
      episodeNo: number,
      episodeTitle?: string | null,
    ) => {
      queryClient.setQueriesData(
        { queryKey: ["websochatSessions"] },
        (current: IGetWebsochatSessionsResponse | undefined) => {
          if (!current?.data?.length) return current;
          return {
            data: current.data.map((item) =>
              item.sessionId === sessionId
                ? {
                    ...item,
                    readScopeState: "known",
                    readEpisodeNo: episodeNo,
                    readEpisodeTitle: episodeTitle ?? null,
                  }
                : item
            ),
          };
        }
      );
      queryClient.setQueriesData(
        { queryKey: ["websochatMessages", sessionId] },
        (current: IGetWebsochatMessagesResponse | undefined) => {
          if (!current?.data?.session) return current;
          return {
            data: {
              ...current.data,
              session: {
                ...current.data.session,
                readScopeState: "known",
                readEpisodeNo: episodeNo,
                readEpisodeTitle: episodeTitle ?? null,
              },
            },
          };
        }
      );
      setPendingSessionPreview((current) =>
        current?.sessionId === sessionId
          ? {
              ...current,
              readScopeState: "known",
              readEpisodeNo: episodeNo,
              readEpisodeTitle: episodeTitle ?? null,
            }
          : current
      );
    },
    [queryClient]
  );

  const handleClickEpisodeCitation = (episodeNo: number) => {
    const episode = citationEpisodeMap.get(episodeNo);
    const productId = episode?.productId || selectedProductId || activeSessionMeta?.productId;
    if (!episode || !productId) return;
    const viewerPath = buildViewerPath(episode.episodeId, { productId });
    const viewerUrl = typeof window === "undefined"
      ? viewerPath
      : new URL(viewerPath, window.location.origin).toString();
    // Same-origin 새 탭에서 sessionStorage 인증을 이어받아 viewer 진입이 깨지지 않게 한다.
    window.open(viewerUrl, "_blank");

    const runtimeActorScope = resolveRuntimeWebsochatActorScope();
    if (!runtimeActorScope.canUseAccountScope || !activeSessionId) return;
    if (episodeNo <= Math.max(Number(userReadEpisodeNo || 0), 0)) return;

    void patchSessionReadScope({
      sessionId: activeSessionId,
      guest_key: runtimeActorScope.guestKey || undefined,
      read_episode_to: episodeNo,
    })
      .then((response) => {
        applyCitationReadScopeToSessionCaches(
          activeSessionId,
          response.data.readEpisodeNo,
          response.data.readEpisodeTitle ?? episode.episodeTitle ?? null
        );
      })
      .catch(() => {
        applyCitationReadScopeToSessionCaches(
          activeSessionId,
          episodeNo,
          episode.episodeTitle ?? null
        );
      });
  };

  const handleSelectProduct = (product: IWebsochatProductItem) => {
    if (product.contextStatus !== "ready") return;
    if (isProductSelectionLocked) return;
    const runtimeActorScope = resolveRuntimeWebsochatActorScope();
    const selectionNoticeSeq = productSelectionNoticeSeqRef.current + 1;
    productSelectionNoticeSeqRef.current = selectionNoticeSeq;

    if (canSwitchProductBeforeConversation) {
      setActiveSessionId(null);
      setStickyStarter(null);
      setActiveShortcutPrompt("");
      resetComposerUiState();
      setDraft("");
      setModeNotices((current) => current.filter((notice) => notice.sessionId !== null));
      setStickyGuides((current) => current.filter((guide) => guide.sessionId !== null));
      setLocalStarters((current) => current.filter((starter) => starter.sessionId !== null));
    }

    const baseCreatedAt = Date.now();
    ensureDraftPreludeSeeded(baseCreatedAt);

    const selectedStarter: IWebsochatStarterItem = {
      productTitle: product.title,
      scopeState: "unknown",
      readEpisodeNo: null,
      readEpisodeTitle: null,
      latestEpisodeNo: product.latestEpisodeNo || 0,
      publishedLatestEpisodeNo: resolveWebsochatPublishedLatestEpisodeNo(
        product.publishedLatestEpisodeNo,
        product.latestEpisodeNo
      ),
      syncedLatestEpisodeNo: resolveWebsochatSyncedLatestEpisodeNo(
        resolveWebsochatPublishedLatestEpisodeNo(
          product.publishedLatestEpisodeNo,
          product.latestEpisodeNo
        ),
        product.syncedLatestEpisodeNo
      ),
      reasonCards: [],
      ctaCards: [],
      actions: DEFAULT_WEBSOCHAT_SHORTCUT_ACTIONS,
    };

    setIsPreparingNewSession(true);
    setStickyStarter(selectedStarter);
    setSelectedProductSnapshot(product);
    setSelectedProductId(product.productId);
    setIsProductPickerOpen(false);
    appendLocalStarter({
      starter: selectedStarter,
      sessionId: null,
      productId: product.productId,
      createdAt: baseCreatedAt + 1,
      cardSnapshot: {
        productId: product.productId,
        productTitle: product.title,
        authorNickname: product.authorNickname || null,
        coverImagePath: product.coverImagePath || null,
        publishedLatestEpisodeNo: resolveWebsochatPublishedLatestEpisodeNo(
          product.publishedLatestEpisodeNo,
          product.latestEpisodeNo
        ),
        readScopeLabel: runtimeActorScope.canUseAccountScope
          ? "읽은 범위 자동 감지: 작품 선택 후 맞춰드릴게요."
          : "읽은 범위 자동 감지: 로그인하면 자동으로 맞춰드릴게요.",
      },
    });
    const appendSelectionNotice = (
      content: string,
      createdAt: number = baseCreatedAt + 2
    ) => {
      appendScopedModeNotice({
        content,
        kind: "mode",
        sessionId: null,
        productId: product.productId,
        createdAt,
      });
    };

    if (!runtimeActorScope.canUseAccountScope) {
      appendSelectionNotice(
        buildWebsochatDraftReadScopeNotice({
          canUseAccountReadScope: false,
          isAuthInitialized,
          conversationEpisodeNo: null,
          conversationEpisodeTitle: null,
          hasDetectedReadRecord: false,
          isSyncPending: false,
        })
      );
      return;
    }

    void (async () => {
      const latestAccountReadEpisodeNo = await fetchLatestAccountReadEpisodeNo(
        product.productId,
        true
      ).catch(() => null);

      if (productSelectionNoticeSeqRef.current !== selectionNoticeSeq) return;

      const publishedLatestEpisodeNo = resolveWebsochatPublishedLatestEpisodeNo(
        product.publishedLatestEpisodeNo,
        product.latestEpisodeNo
      );
      const syncedLatestEpisodeNo = resolveWebsochatSyncedLatestEpisodeNo(
        publishedLatestEpisodeNo,
        product.syncedLatestEpisodeNo
      );
      const conversationEpisodeNo =
        resolveWebsochatConversationCeilingEpisodeNo(
          latestAccountReadEpisodeNo,
          syncedLatestEpisodeNo,
          publishedLatestEpisodeNo
        ) || null;

      appendSelectionNotice(
        buildWebsochatDraftReadScopeNotice({
          canUseAccountReadScope: true,
          isAuthInitialized: true,
          conversationEpisodeNo,
          conversationEpisodeTitle: null,
          hasDetectedReadRecord: !!latestAccountReadEpisodeNo,
          isSyncPending:
            publishedLatestEpisodeNo > Number(syncedLatestEpisodeNo || 0)
            && Number(syncedLatestEpisodeNo || 0) > 0,
        }),
        baseCreatedAt + 2
      );
    })();
  };

  const handleSearchProducts = () => {
    if (isProductSelectionLocked) return;
    setSubmittedKeyword(normalizedKeyword);
  };

  const triggerStarterAction = (action: IWebsochatStarterActionItem) => {
    if (!action.prompt.trim()) return;
    if (pendingModeSyncKey || isAssistantTurnPending || isStreamingMessage) return;
    appendWebsochatDebugLog("trigger_starter_action", {
      label: action.label,
      modeKey: action.modeKey || null,
      qaActionKey: action.qaActionKey || null,
      activeSessionId,
      effectiveMode,
      composerMode,
      rpStage,
      activeShortcutPrompt,
      pendingModeSyncKey,
      transientCount: transientMessages.length,
      isStreamingMessage,
      isAssistantTurnPending,
    });
    const resolvedModeKey = action.modeKey || null;
    const resolvedQaActionKey = action.qaActionKey || null;
    const rpModeAction = {
      label: "인물과 대화",
      prompt: "인물과 대화",
      modeKey: "rp",
      qaActionKey: null,
    } satisfies IWebsochatStarterActionItem;
    const qaModeAction =
      effectiveStarter?.actions?.find(
        (starterAction) => starterAction.modeKey === "qa" && !starterAction.qaActionKey
      )
      || DEFAULT_WEBSOCHAT_SHORTCUT_ACTIONS[0];
    const currentModeAction = promptedShortcutAction
      || (isEffectiveRpMode ? rpModeAction : qaModeAction);
    const blockedNotice = getBlockedQaActionNotice(resolvedQaActionKey);
    if (blockedNotice) {
      setActiveShortcutPrompt("");
      resetComposerUiState();
      appendModeNotice(blockedNotice);
      return;
    }
    if (resolvedModeKey === "rp") {
      if (effectiveMode === "rp") return;
      const noticeId = appendModeNotice(buildWebsochatQaToRpModeNotice(currentModeReadScopeText));
      setActiveShortcutPrompt("");
      void activateRpCharacterSelectionMode()
        .then((sessionId) => {
          if (sessionId) {
            bindModeNoticeToSession(noticeId, sessionId);
          }
        })
        .catch((error) => {
          appendModeNotice(buildWebsochatErrorNotice(error));
        });
      return;
    }

    if (resolvedModeKey === "qa" && !resolvedQaActionKey) {
      if (effectiveShortcutState === "qa_default" && effectiveMode === "qa") return;
      const noticeId = appendModeNotice(
        isEffectiveRpMode
          ? buildWebsochatRpToQaModeNotice(currentModeReadScopeText)
          : buildWebsochatModeSwitchNotice({
              fromAction: currentModeAction,
              toAction: qaModeAction,
              activeCharacterLabel,
              readScopeText: currentModeReadScopeText,
            })
      );
      setActiveShortcutPrompt("");
      resetComposerUiState();
      if (!activeSessionId) {
        return;
      }
      const syncBackToQa = isEffectiveRpMode
        ? clearRpCharacterSelectionMode()
        : forceQaEntryGuideMode(activeSessionId);
      void syncBackToQa
        .then((sessionId) => {
          if (sessionId) {
            bindModeNoticeToSession(noticeId, sessionId);
          }
        })
        .catch((error) => {
          appendModeNotice(buildWebsochatErrorNotice(error));
        });
      return;
    }

    setActiveShortcutPrompt(action.prompt.trim());
    const noticeId = appendModeNotice(
      buildWebsochatModeSwitchNotice({
        fromAction: currentModeAction,
        toAction: action,
        activeCharacterLabel,
        readScopeText: currentModeReadScopeText,
      }),
      "action"
    );
    setComposerMode(resolvedModeKey === "ideal_worldcup" ? "ideal_worldcup" : "qa");
    setRpStage("idle");
    setActiveCharacterLabel(null);
    void handleSend(action.prompt, {
      starterModeKey: resolvedModeKey,
      qaActionKey: resolvedQaActionKey,
      gameMode: resolvedModeKey === "ideal_worldcup" ? "ideal_worldcup" : null,
    }).then((sessionId) => {
      if (sessionId) {
        bindModeNoticeToSession(noticeId, sessionId);
      }
    });
  };

  const handleClickStarterAction = (action: IWebsochatStarterActionItem) => {
    triggerStarterAction(action);
  };

  useEffect(() => {
    if (!pendingLaunchPayload) return;
    if (!selectedProductId || selectedProductId !== pendingLaunchPayload.productId) return;
    if (
      activeSessionId
      || isStreamingMessage
      || isAssistantTurnPending
      || isCreatingSession
      || isReadScopeGuardPending
    ) {
      return;
    }

    const launchActionModeKey = pendingLaunchPayload.action.modeKey || "qa";
    const launchQaActionKey = pendingLaunchPayload.action.qaActionKey || null;
    const blockedNotice = getBlockedQaActionNotice(launchQaActionKey);
    if (blockedNotice) {
      setPendingLaunchPayload(null);
      setActiveShortcutPrompt("");
      resetComposerUiState();
      appendModeNotice(blockedNotice);
      return;
    }
    setPendingLaunchPayload(null);
    setActiveShortcutPrompt(
      launchActionModeKey === "rp" || (launchActionModeKey === "qa" && !launchQaActionKey)
        ? ""
        : pendingLaunchPayload.action.prompt.trim()
    );
    if (launchActionModeKey === "rp") {
      const noticeId = appendModeNotice(
        buildWebsochatModeStartNotice(
          {
            label: "인물과 대화",
            prompt: "인물과 대화",
            modeKey: "rp",
            qaActionKey: null,
          },
          currentModeReadScopeText
        )
      );
      void activateRpCharacterSelectionMode()
        .then((sessionId) => {
          if (sessionId) {
            bindModeNoticeToSession(noticeId, sessionId);
          }
        })
        .catch((error) => {
          appendModeNotice(buildWebsochatErrorNotice(error));
        });
      return;
    }
    if (launchActionModeKey === "qa" && !launchQaActionKey) {
      setComposerMode("qa");
      setRpStage("idle");
      setActiveCharacterLabel(null);
      return;
    }
    const noticeId = appendModeNotice(
      buildWebsochatModeSwitchNotice({
        fromAction: composerMode === "rp"
          ? ({
              label: "인물과 대화",
              prompt: "인물과 대화",
              modeKey: "rp",
              qaActionKey: null,
            } satisfies IWebsochatStarterActionItem)
          : null,
        toAction: pendingLaunchPayload.action,
        activeCharacterLabel,
        readScopeText: currentModeReadScopeText,
      }),
      "action"
    );
    setComposerMode(launchActionModeKey === "ideal_worldcup" ? "ideal_worldcup" : "qa");
    setRpStage("idle");
    setActiveCharacterLabel(null);
    void handleSend(pendingLaunchPayload.action.prompt, {
      starterModeKey: launchActionModeKey,
      qaActionKey: launchQaActionKey,
      gameMode: launchActionModeKey === "ideal_worldcup" ? "ideal_worldcup" : null,
    }).then((sessionId) => {
      if (sessionId) {
        bindModeNoticeToSession(noticeId, sessionId);
      }
    });
  }, [
    activeSessionId,
    activeCharacterLabel,
    activateRpCharacterSelectionMode,
    appendModeNotice,
    bindModeNoticeToSession,
    composerMode,
    currentModeReadScopeText,
    getBlockedQaActionNotice,
    handleSend,
    isAssistantTurnPending,
    isCreatingSession,
    isReadScopeGuardPending,
    isStreamingMessage,
    pendingLaunchPayload,
    resetComposerUiState,
    selectedProductId,
  ]);

  const handleClickWebsochatCtaCard = (card: IWebsochatCtaCardItem) => {
    if (card.type === "product_detail" && card.productId) {
      const productDetailPath = buildProductDetailPath(card.productId);
      const productDetailUrl = typeof window === "undefined"
        ? productDetailPath
        : new URL(productDetailPath, window.location.origin).toString();
      window.open(productDetailUrl, "_blank");
    }
  };

  const handleClickSend = () => {
    if (isAssistantTurnPending || isStreamingMessage) return;
    setActiveShortcutPrompt("");
    void handleSend();
  };

  const composerShortcutActions = useMemo(
    () => (effectiveStarter?.actions || DEFAULT_WEBSOCHAT_SHORTCUT_ACTIONS).filter((action) => (
      canUseAccountScope || action.qaActionKey !== "next_episode_write"
    )),
    [canUseAccountScope, effectiveStarter?.actions]
  );

  const renderSessionListContent = () => {
    if (isSessionsLoading && !hasSessionItems) {
      return <Spinner size={24} />;
    }

    if (!hasSessionItems) {
      return (
        <div className="rounded-[12px] border border-primary-100 bg-light-gray-100 px-12pxr py-10pxr">
          <button
            type="button"
            onClick={() => {
              setIsSessionDrawerOpen(false);
              enterDraftSession(false);
            }}
            className="w-full text-left"
          >
            <div className="text-14pxr font-medium line-clamp-1">새 대화</div>
            <div className="mt-4pxr text-12pxr text-dark-gray-300">방금 전</div>
          </button>
        </div>
      );
    }

    return (
      <>
        {isDraftSession ? (
          <div className="rounded-[12px] border border-primary-100 bg-light-gray-100 px-12pxr py-10pxr">
            <button
              type="button"
              onClick={() => {
                setIsSessionDrawerOpen(false);
                enterDraftSession(false);
              }}
            className="w-full text-left"
          >
            <div className="text-14pxr font-medium line-clamp-1">새 대화</div>
            <div className="mt-4pxr text-12pxr text-dark-gray-300">방금 전</div>
            </button>
          </div>
        ) : null}
        {visibleSessionItems.map((session) => (
          <div
            key={session.sessionId}
            className={`rounded-[12px] border px-12pxr py-10pxr ${
              activeSessionId === session.sessionId
                ? "border-primary-100 bg-light-gray-100"
                : "border-light-gray-300"
            }`}
          >
            <div className="flex min-w-0 items-start justify-between gap-8pxr">
              <button
                type="button"
                onClick={() => handleSelectSession(session.sessionId, session.productId)}
                className="min-w-0 flex-1 overflow-hidden text-left"
              >
                <div className="text-14pxr font-medium line-clamp-1">{session.title}</div>
                {session.productTitle ? (
                  <div className="mt-4pxr flex min-w-0 items-center gap-4pxr overflow-hidden text-12pxr text-dark-gray-300">
                    <span className="min-w-0 max-w-full truncate">{session.productTitle}</span>
                    <span className="shrink-0">·</span>
                    <span className="shrink-0">
                      {buildWebsochatSessionReadScopeText(
                        session.readScopeState,
                        session.readEpisodeNo,
                        session.readEpisodeTitle
                      ) || "\u00A0"}
                    </span>
                  </div>
                ) : null}
                <div className="mt-4pxr text-12pxr text-dark-gray-300">
                  {formatWebsochatRelativeUpdatedAt(session.updatedDate)}
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSession(session.sessionId)}
                disabled={isDeletingSession}
                className="shrink-0 text-12pxr text-dark-gray-300 hover:text-dark-gray-500 disabled:opacity-40"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="bg-gray-100 md:bg-white">
      <GlobalNav />
      <div className="min-h-screen bg-gray-100 md:bg-white pt-[130px] md:pt-[115px] pb-[94px]">
        <div className="w-full max-w-[1600px] mx-auto px-16pxr md:px-40pxr">
          <div className="flex flex-col gap-12pxr">
            <div className="md:hidden flex items-center justify-between rounded-[16px] border border-light-gray-400 bg-white px-12pxr py-10pxr">
              <button
                type="button"
                onClick={() => setIsSessionDrawerOpen(true)}
                className="inline-flex items-center gap-8pxr text-14pxr font-medium text-dark-gray-500"
              >
                <List className="w-[18px] h-[18px]" />
                <span>세션</span>
              </button>
              <Button
                size="sm"
                variant="secondary"
                disabled={isCreatingSession || isDeletingSession || isReadScopeGuardPending}
                onClick={handleCreateSession}
              >
                새 대화
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12pxr md:gap-16pxr h-[calc(100vh-220px)] md:h-[calc(100vh-180px)]">
              <div className="hidden md:flex rounded-[16px] border border-light-gray-400 bg-white p-16pxr flex-col gap-12pxr h-full min-h-0 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="text-16pxr font-semibold">세션</div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isCreatingSession || isDeletingSession || isReadScopeGuardPending}
                    onClick={handleCreateSession}
                  >
                    새 대화
                  </Button>
                </div>
                <div className="flex-1 min-h-0 flex flex-col gap-8pxr overflow-y-auto pr-4pxr">
                  {renderSessionListContent()}
                </div>
              </div>

              <div className="rounded-[16px] border border-light-gray-400 bg-white p-16pxr flex flex-col gap-12pxr h-full min-h-0 overflow-hidden">

            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-16pxr h-[calc(100vh-200px)]">
              {shouldShowMessagesLoadingSpinner ? (
                <Spinner size={24} />
              ) : (
                <>
                  {shouldShowIdleGuideMessage ? (
                    <div className="self-start max-w-[92%] md:max-w-[90%]">
                      <div className="rounded-[16px] bg-white px-16pxr py-12pxr text-16pxr leading-[1.6] whitespace-pre-wrap text-dark-gray-500 shadow-sm">
                        {buildWebsochatIdleGuideMessage()}
                      </div>
                    </div>
                  ) : null}
                  {messageFeedItems.map((item) => {
                  if (item.type === "starter") {
                    return (
                      <div key={item.key} className="self-start max-w-[92%] md:max-w-[90%]">
                        <div className="rounded-[16px] bg-white px-16pxr py-12pxr text-16pxr leading-[1.6] whitespace-pre-wrap text-dark-gray-500 shadow-sm">
                          {buildWebsochatStarterGuideMessage(item.starter)}
                        </div>
                        {renderWebsochatReasonCards(item.starter.reasonCards)}
                        {renderWebsochatCtaCards({
                          ctaCards: item.starter.ctaCards,
                          onClick: handleClickWebsochatCtaCard,
                        })}
                      </div>
                    );
                  }
                  if (item.type === "notice") {
                    return (
                      <div
                        key={item.key}
                        className="self-center max-w-[80%] rounded-full border border-light-gray-300 bg-white px-14pxr py-8pxr text-center text-13pxr text-dark-gray-300"
                      >
                        {item.notice.content}
                      </div>
                    );
                  }

                  const message = item.message;
                  const isStreamingAssistantMessage = message.role === "assistant"
                    && "isStreaming" in message
                    && Boolean(message.isStreaming);
                  const referencedEpisodeNos = getWebsochatMessageEpisodeRefs(
                    message,
                    conversationCeilingEpisodeNo
                  );
                  const hasStructuredAssistantContent =
                    (message.reasonCards?.length ?? 0) > 0
                    || (message.actionCards?.length ?? 0) > 0
                    || (message.ctaCards?.length ?? 0) > 0
                    || referencedEpisodeNos.length > 0;
                  const shouldHideEmptyAssistantMessage =
                    message.role === "assistant"
                    && !isStreamingAssistantMessage
                    && !(message.content || "").trim()
                    && !hasStructuredAssistantContent;
                  const shouldShowNextEpisodeProgress =
                    isStreamingAssistantMessage
                    && streamingKind === "qa"
                    && streamingQaActionKey === "next_episode_write"
                    && !hasStreamingContentStarted;

                  if (shouldHideEmptyAssistantMessage) {
                    return null;
                  }

                  return (
                    <div
                      key={message.messageId}
                      className={`${message.role === "user" ? "max-w-[85%] self-end" : "max-w-[92%] md:max-w-[90%] self-start"}`}
                    >
                      <div
                        className={`rounded-[16px] px-16pxr py-12pxr text-16pxr leading-[1.6] whitespace-pre-wrap shadow-sm ${
                          message.role === "user"
                            ? "bg-primary-100 text-white"
                            : "bg-white text-dark-gray-500"
                        }`}
                      >
                        {isStreamingAssistantMessage && !(message.content || "").trim()
                          ? "..."
                          : message.content}
                      </div>
                      {isStreamingAssistantMessage && streamingStatusMessage ? (
                        <div className="mt-6pxr px-4pxr text-12pxr text-dark-gray-300">
                          {streamingStatusMessage}
                        </div>
                      ) : null}
                      {shouldShowNextEpisodeProgress ? (
                        <div className="mt-8pxr px-4pxr">
                          <div className="flex items-center justify-between gap-8pxr text-12pxr text-dark-gray-400">
                            <span>다음회차 쓰는 중</span>
                            <span>{Math.round(streamingProgressPercent)}%</span>
                          </div>
                          <div className="mt-6pxr h-[4px] w-full overflow-hidden rounded-full bg-light-gray-300">
                            <div
                              className="h-full rounded-full bg-primary-100 transition-[width] duration-200 ease-out"
                              style={{ width: `${streamingProgressPercent}%` }}
                            />
                          </div>
                          <div className="mt-6pxr text-11pxr text-dark-gray-300">
                            보통 1분 안쪽으로 첫 문장이 시작돼요.
                          </div>
                        </div>
                      ) : null}
                      {message.role === "assistant"
                        ? renderWebsochatReasonCards(message.reasonCards)
                        : null}
                      {message.role === "assistant"
                        ? renderWebsochatActionCards({
                          actionCards: message.actionCards,
                          onClick: handleClickStarterAction,
                          disabled: areShortcutActionsDisabled,
                          activeStateKey: effectiveShortcutState,
                        })
                        : null}
                      {message.role === "assistant"
                        ? renderWebsochatCtaCards({
                          ctaCards: message.ctaCards,
                          onClick: handleClickWebsochatCtaCard,
                        })
                        : null}
                      {referencedEpisodeNos.length > 0 ? (
                        <div className="mt-8pxr flex flex-wrap gap-6pxr">
                          {referencedEpisodeNos.map((episodeNo) => {
                            const episode = citationEpisodeMap.get(episodeNo);
                            const isClickable = !!episode;
                            const citationLabel = formatWebsochatCitationLabel(
                              episodeNo,
                              episode?.episodeTitle
                            );

                            return (
                              <button
                                key={`${message.messageId}-${episodeNo}`}
                                type="button"
                                onClick={() => handleClickEpisodeCitation(episodeNo)}
                                disabled={!isClickable}
                                aria-label={citationLabel.episodeTitleText
                                  ? `${citationLabel.episodeNoText} ${citationLabel.episodeTitleText}로 이동`
                                  : `${episodeNo}화로 이동`}
                                className={`min-w-[72px] rounded-[10px] border px-10pxr py-8pxr text-left ${
                                  isClickable
                                    ? "border-light-gray-400 bg-white text-dark-gray-500 hover:border-primary-100 hover:text-primary-100"
                                    : "border-light-gray-300 bg-light-gray-100 text-dark-gray-300 cursor-default"
                                }`}
                              >
                                <div className="flex flex-col gap-2pxr">
                                  <span className="text-12pxr font-semibold leading-none">
                                    {citationLabel.episodeNoText}
                                  </span>
                                  {citationLabel.episodeTitleText ? (
                                    <span className="text-11pxr leading-[1.25] break-words">
                                      {citationLabel.episodeTitleText}
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                </>
              )}
              {isAssistantTurnPending
                && streamingKind === "qa"
                && streamingQaActionKey === "next_episode_write"
                && !hasStreamingContentStarted ? (
                  <div className="self-start max-w-[92%] md:max-w-[90%] rounded-[12px] border border-light-gray-300 bg-white px-12pxr py-10pxr text-dark-gray-500">
                    <div className="flex items-center justify-between gap-8pxr text-12pxr text-dark-gray-400">
                      <span>다음회차 쓰는 중</span>
                      <span>{Math.round(streamingProgressPercent)}%</span>
                    </div>
                    <div className="mt-6pxr h-[4px] w-full overflow-hidden rounded-full bg-light-gray-300">
                      <div
                        className="h-full rounded-full bg-primary-100 transition-[width] duration-200 ease-out"
                        style={{ width: `${streamingProgressPercent}%` }}
                      />
                    </div>
                    <div className="mt-6pxr text-11pxr text-dark-gray-300">
                      {streamingStatusMessage || "보통 1분 안쪽으로 첫 문장이 시작돼요."}
                    </div>
                  </div>
                ) : null}
            </div>

            {activeSessionId && !canSendMessage ? (
              <div className="rounded-[12px] border border-light-gray-300 bg-light-gray-100 px-14pxr py-16pxr text-14pxr text-dark-gray-400">
                {unavailableMessage}
              </div>
            ) : (
              <>
                {composerShortcutActions.length ? (
                  <div className="flex flex-col gap-8pxr">
                    <div className="flex flex-wrap gap-8pxr">
                    {composerShortcutActions.map((action) => {
                      const isBlockedAction = Boolean(
                        getBlockedQaActionNotice(action.qaActionKey || null)
                      );
                      const isActive = !isBlockedAction
                        && effectiveShortcutState === resolveWebsochatShortcutStateKey(action);
                      return (
                        <button
                          key={`composer-${action.label}`}
                          type="button"
                          onClick={() => handleClickStarterAction(action)}
                          disabled={areShortcutActionsDisabled || isBlockedAction}
                          className={`rounded-full border px-12pxr py-7pxr text-12pxr font-medium ${
                            isActive
                              ? "border-primary-100 bg-primary-100 text-white"
                            : "border-light-gray-400 bg-white text-dark-gray-500 hover:border-primary-100 hover:text-primary-100"
                          } ${(areShortcutActionsDisabled || isBlockedAction) ? "cursor-not-allowed opacity-50 hover:border-light-gray-400 hover:text-dark-gray-500" : ""}`}
                        >
                          {action.label}
                        </button>
                      );
                    })}
                    </div>
                    {composerModeDetail ? (
                      <div className="px-4pxr text-12pxr text-dark-gray-300">
                        {composerModeDetail}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex items-center gap-8pxr">
                  <button
                    type="button"
                    onClick={handleClickSessionProduct}
                    disabled={!sessionProductSummary && isProductSelectionLocked}
                    aria-label={sessionProductSummary ? "선택한 작품 상세로 이동" : "작품 선택"}
                    className={`relative h-[60px] w-[48px] shrink-0 overflow-hidden rounded-[10px] border border-light-gray-300 bg-white ${
                      !sessionProductSummary && isProductSelectionLocked
                        ? "cursor-not-allowed opacity-60"
                        : "hover:border-primary-100"
                    }`}
                  >
                    {sessionProductSummary?.coverImagePath ? (
                      <Image
                        src={sessionProductSummary.coverImagePath}
                        alt={sessionProductSummary.title || "선택된 작품 표지"}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-light-gray-100 px-6pxr text-center text-10pxr font-medium leading-[1.3] text-dark-gray-300">
                        작품 선택
                      </div>
                    )}
                  </button>
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={handleClickSessionProduct}
                      disabled={!sessionProductSummary}
                      className={`w-full rounded-[12px] border border-light-gray-300 bg-light-gray-100 px-12pxr py-10pxr text-left ${
                        sessionProductSummary ? "hover:border-primary-100" : "cursor-default"
                      }`}
                    >
                      <div className="pr-[56px] text-14pxr font-medium text-dark-gray-500 line-clamp-1">
                        {sessionProductSummary?.title || "아직 선택한 작품이 없어요"}
                      </div>
                      <div className="mt-4pxr flex min-w-0 items-center gap-4pxr overflow-hidden text-12pxr text-dark-gray-300">
                        <span className="min-w-0 max-w-full truncate">
                          {sessionProductSummary?.authorNickname || "작품을 고르면 여기에 붙어요"}
                        </span>
                        {sessionProductSummary ? <span className="shrink-0">·</span> : null}
                        {sessionProductSummary ? (
                          <span className="shrink-0">{sessionProductSummaryReadLabel}</span>
                        ) : null}
                      </div>
                    </button>
                    {sessionProductSummary && !isProductSelectionLocked ? (
                      <button
                        type="button"
                        onClick={handleOpenProductPicker}
                        className="absolute right-10pxr top-10pxr rounded-full border border-light-gray-400 bg-white px-8pxr py-4pxr text-11pxr font-medium text-dark-gray-400 hover:border-primary-100 hover:text-primary-100"
                      >
                        교체
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-8pxr">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      if (event.shiftKey) return;
                      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
                      if (
                        !selectedProductId
                        || !draft.trim()
                        || isStreamingMessage
                        || isAssistantTurnPending
                        || isCreatingSession
                        || isDeletingSession
                        || isReadScopeGuardPending
                      ) {
                        return;
                      }
                      event.preventDefault();
                      handleClickSend();
                    }}
                    placeholder={composerPlaceholderWithShortcutHint}
                    disabled={isReadScopeGuardPending || isAssistantTurnPending}
                    className="flex-1 min-h-[96px] rounded-[16px] border border-light-gray-300 bg-white px-16pxr py-12pxr text-16pxr leading-[1.6] outline-none transition-all focus:border-primary-100 focus:ring-2 focus:ring-primary-100/10 resize-none disabled:bg-light-gray-100 disabled:text-dark-gray-300 shadow-sm"
                  />
                    <Button
                      size="md"
                      className="min-w-[88px] self-end"
                    disabled={!selectedProductId || !draft.trim() || isStreamingMessage || isAssistantTurnPending || isCreatingSession || isDeletingSession || isReadScopeGuardPending}
                      onClick={handleClickSend}
                    >
                    전송
                  </Button>
                </div>
              </>
            )}
            {isSessionDrawerOpen ? (
              <div className="md:hidden fixed inset-0 z-[55]">
                <button
                  type="button"
                  aria-label="세션 목록 닫기"
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setIsSessionDrawerOpen(false)}
                />
                <div className="relative h-full w-[86%] max-w-[320px] rounded-r-[20px] border-r border-light-gray-400 bg-white p-16pxr flex flex-col gap-12pxr shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="text-16pxr font-semibold">세션</div>
                    <button
                      type="button"
                      onClick={() => setIsSessionDrawerOpen(false)}
                      className="text-14pxr text-dark-gray-300"
                    >
                      닫기
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col gap-8pxr overflow-y-auto pr-4pxr">
                    {renderSessionListContent()}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <ModalContainer
          isOpen={isProductPickerOpen}
          onClose={() => setIsProductPickerOpen(false)}
          size="full"
          title="작품 선택"
        >
          <div className="p-16pxr flex flex-col gap-16pxr">
            <div className="flex items-center gap-8pxr">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSearchProducts();
                  }
                }}
                placeholder="작품명 또는 작가명 검색"
                disabled={isProductSelectionLocked}
                className="flex-1 h-[48px] rounded-[12px] border border-light-gray-400 px-16pxr outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleSearchProducts}
                disabled={isSearchButtonDisabled}
                className="shrink-0 min-w-[72px]"
              >
                검색
              </Button>
            </div>
            <div className="min-h-[320px] rounded-[12px] border border-light-gray-300 p-12pxr">
              {isProductsFetching ? (
                <Spinner size={28} />
              ) : normalizedSubmittedKeyword.length === 0 ? (
                <p className="text-14pxr text-dark-gray-300">
                  무료 작품만 보여드릴게요. 작품을 고르면 바로 이 대화에 붙습니다.
                </p>
              ) : isSearchDirty && normalizedKeyword.length > 0 ? (
                <p className="text-14pxr text-dark-gray-300">
                  검색 버튼을 누르거나 Enter를 눌러서 결과를 확인해 주세요.
                </p>
              ) : visibleSearchProducts.length ? (
                <div className="max-h-[420px] overflow-y-auto pr-4pxr">
                  <div className="flex flex-col gap-8pxr">
                    {visibleSearchProducts.map((product) => (
                      <button
                        key={product.productId}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        disabled={isProductSelectionLocked}
                        className={`w-full rounded-[12px] border px-14pxr py-12pxr text-left ${
                          selectedProductId === product.productId
                            ? "border-primary-100 bg-light-gray-100"
                            : "border-light-gray-300"
                        } ${isProductSelectionLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-8pxr">
                          <div className="text-16pxr font-semibold">{product.title}</div>
                          <div className="flex items-center gap-6pxr">
                            {selectedProductId === product.productId ? (
                              <span className="rounded-full bg-primary-100 px-8pxr py-4pxr text-11pxr font-semibold text-white">
                                선택됨
                              </span>
                            ) : null}
                            <span className="text-12pxr font-medium text-primary-100">
                              대화 가능
                            </span>
                          </div>
                        </div>
                        <div className="mt-4pxr text-13pxr text-dark-gray-300">
                          {product.authorNickname || "작가명 없음"}
                          {" · 공개 "}
                          {resolveWebsochatPublishedLatestEpisodeNo(
                            product.publishedLatestEpisodeNo,
                            product.latestEpisodeNo
                          )}화
                          {" · 대화 기준 "}
                          {resolveWebsochatSyncedLatestEpisodeNo(
                            resolveWebsochatPublishedLatestEpisodeNo(
                              product.publishedLatestEpisodeNo,
                              product.latestEpisodeNo
                            ),
                            product.syncedLatestEpisodeNo
                          )}화
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-14pxr text-dark-gray-300">
                  지금 바로 대화할 수 있는 작품이 없습니다.
                </p>
              )}
            </div>
          </div>
        </ModalContainer>
      </div>
    </div>
      </div>
    </div>
  );
}
