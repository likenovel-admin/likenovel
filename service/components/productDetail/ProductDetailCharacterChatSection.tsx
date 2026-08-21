"use client";

import { useGetCharacterChatCatalog } from "@/app/api/query/product";
import type {
  ICharacterChatCatalogItem,
  IMainCharacterSlotItem,
} from "@/app/api/query/product/dto";
import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import useAuthStore from "@/store/authStore";
import useToastStore from "@/store/toastStore";
import {
  buildHomeCharacterChatSessionRequest,
  createSingleFlightRunner,
  queueHomeCharacterChatLaunch,
} from "@/utils/characterChatLaunch";
import {
  resolveCharacterChatAccountReadEpisodeSeed,
  resolveCharacterChatEpisodeScope,
} from "@/utils/characterChatEpisodeScope";
import { getCharacterChatRoleMeta } from "@/utils/characterChatRole";
import { getWebsochatSafeUserMessage } from "@/utils/websochatError";
import {
  getOrCreateWebsochatGuestKey,
  saveActiveWebsochatSessionId,
  saveWebsochatReturnPath,
} from "@/utils/websochatLaunch";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import CharacterChatPreviewModal from "@/components/main/CharacterChatPreviewModal";

const EMPTY_ITEMS: ICharacterChatCatalogItem[] = [];

interface Props {
  productId: number;
  adultYn: "Y" | "N";
  cacheIdentity: string;
  enabled: boolean;
}

export default function ProductDetailCharacterChatSection({
  productId,
  adultYn,
  cacheIdentity,
  enabled,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setToast } = useToastStore();
  const { user, isAuthenticated, accessToken } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
  }));
  const { data } = useGetCharacterChatCatalog(
    adultYn,
    enabled,
    cacheIdentity
  );
  const characterItems = useMemo(
    () =>
      (data?.data ?? EMPTY_ITEMS)
        .filter((item) => item.productId === productId)
        .sort((left, right) => left.cardOrder - right.cardOrder),
    [data?.data, productId]
  );
  const [selectedItem, setSelectedItem] =
    useState<ICharacterChatCatalogItem | null>(null);
  const [launchingScopeKey, setLaunchingScopeKey] = useState<string | null>(
    null
  );
  const launchOnceRef = useRef(createSingleFlightRunner());
  const accountReadEpisodeNoSeed =
    resolveCharacterChatAccountReadEpisodeSeed(selectedItem);

  const handleLaunch = async (
    item: IMainCharacterSlotItem,
    selectedEpisodeNo: number
  ) => {
    await launchOnceRef.current(async () => {
      setLaunchingScopeKey(item.characterScopeKey);
      try {
        const storedAccessToken =
          window.localStorage.getItem("access_token") ||
          window.sessionStorage.getItem("access_token");
        const hasAccountScope =
          !!accessToken ||
          isAuthenticated ||
          !!user?.userId ||
          !!storedAccessToken;
        const request = buildHomeCharacterChatSessionRequest({
          productId: item.productId,
          characterScopeKey: item.characterScopeKey,
          characterName: item.characterName,
          adultYn,
          guestKey: hasAccountScope ? null : getOrCreateWebsochatGuestKey(),
          accountReadEpisodeTo: selectedEpisodeNo,
          entrySource: "character_catalog",
        });

        queueHomeCharacterChatLaunch({
          payload: {
            request,
            characterName: item.characterName,
            characterImagePath: item.characterImagePath,
            productTitle: item.productTitle,
            authorNickname: item.authorNickname || null,
          },
          clearActiveSession: () => saveActiveWebsochatSessionId(null),
          clearSessionListCache: () =>
            queryClient.removeQueries({ queryKey: ["websochatSessions"] }),
          navigate: () => {
            saveWebsochatReturnPath();
            router.push("/websochat");
          },
        });
      } catch (error) {
        setToast({
          type: "error",
          message: getWebsochatSafeUserMessage(
            error,
            "캐릭터 대화를 시작하지 못했어요. 잠시 후 다시 시도해 주세요."
          ),
        });
      } finally {
        setLaunchingScopeKey(null);
      }
    });
  };

  // `대화하기`는 카탈로그의 읽은 회차 seed로 바로 대화를 시작한다.
  const handleDirectStart = (item: ICharacterChatCatalogItem) => {
    const episodeScope = resolveCharacterChatEpisodeScope({
      entryEpisodeNo: item.entryEpisodeNo,
      preparedEpisodeNo: item.syncedLatestEpisodeNo,
      accountReadEpisodeNo: item.lastViewedEpisodeNo,
    });
    void handleLaunch(item, episodeScope.initialReadEpisodeNo);
  };

  if (characterItems.length === 0) return null;

  return (
    <section
      aria-labelledby="product-character-chat-title"
      className="mt-16pxr w-full max-w-[800px] md:mt-20pxr"
    >
      <div className="mx-16pxr md:mx-0">
        <h2
          id="product-character-chat-title"
          className="text-15pxr font-bold text-black-100 md:text-16pxr"
        >
          주인공챗
        </h2>
        <p className="mt-2pxr text-12pxr leading-[17px] text-dark-gray-400">
          등장인물과 바로 대화해요 · 읽은 회차까지만 기억해요
        </p>

        <ul className="mt-10pxr flex snap-x snap-mandatory gap-8pxr overflow-x-auto pb-2pxr md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
          {characterItems.map((item) => {
            const roleMeta = getCharacterChatRoleMeta(item.characterRole);
            const characterImage = resolveProductCoverImage(
              item.characterImagePath
            );
            const isDefaultImage = characterImage === DEFAULT_PRODUCT_IMAGE;
            const hasCharacterImage = !isDefaultImage;
            const teaserLine = String(item.teaserLine || "").trim();
            const characterName = String(item.characterName || "");
            const nameInitial = characterName.trim().charAt(0) || "?";

            return (
              <li
                key={item.characterSlotId}
                className={`relative shrink-0 snap-start ${
                  characterItems.length === 1
                    ? "w-full md:col-span-2"
                    : "w-[84%] md:w-auto"
                }`}
              >
                <div className="relative flex h-full w-full items-stretch gap-10pxr rounded-[8px] border border-light-gray-500 bg-white px-12pxr py-12pxr transition-colors focus-within:border-primary-100 hover:border-primary-100">
                  <button
                    type="button"
                    aria-label={`${item.characterName} 미리보기와 회차 선택`}
                    aria-haspopup="dialog"
                    onClick={() => setSelectedItem(item)}
                    className="absolute inset-0 z-0 rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2"
                  />
                  {hasCharacterImage ? (
                    <span className="pointer-events-none relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[6px] bg-light-gray-100">
                      <Image
                        src={characterImage}
                        alt={item.characterName}
                        fill
                        sizes="56px"
                        className="object-cover [object-position:50%_12%]"
                      />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[6px] bg-light-gray-200 text-20pxr font-bold text-dark-gray-400"
                    >
                      {nameInitial}
                    </span>
                  )}
                  <span className="pointer-events-none flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-6pxr">
                      <span className="text-14pxr font-bold text-black-100">
                        {item.characterName}
                      </span>
                      <span className="rounded-[4px] bg-light-gray-200 px-5pxr py-2pxr text-10pxr font-medium text-dark-gray-500">
                        {roleMeta.gridLabel}
                      </span>
                    </span>
                    <span className="mt-6pxr line-clamp-2 text-12pxr leading-[18px] text-dark-gray-500">
                      {teaserLine || `${item.characterName}와 이야기를 시작해 보세요.`}
                    </span>
                    <span className="mt-auto flex items-center justify-between gap-8pxr pt-8pxr text-11pxr leading-[15px]">
                      <span className="truncate text-dark-gray-400">
                        ~{item.syncedLatestEpisodeNo}화까지 준비
                      </span>
                      <button
                        type="button"
                        aria-label={`${item.characterName}와 바로 대화 시작`}
                        onClick={() => handleDirectStart(item)}
                        disabled={launchingScopeKey !== null}
                        className="pointer-events-auto relative z-10 shrink-0 rounded-[4px] bg-primary-100 px-8pxr py-4pxr font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2 disabled:opacity-60"
                      >
                        {launchingScopeKey === item.characterScopeKey
                          ? "연결 중…"
                          : "대화하기"}
                      </button>
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <CharacterChatPreviewModal
        item={selectedItem}
        accountReadEpisodeNoSeed={accountReadEpisodeNoSeed}
        isLaunching={launchingScopeKey !== null}
        onLaunch={(item, selectedEpisodeNo) =>
          void handleLaunch(item, selectedEpisodeNo)
        }
        onGoToProduct={() => setSelectedItem(null)}
        onClose={() => {
          if (!launchingScopeKey) setSelectedItem(null);
        }}
      />
    </section>
  );
}
