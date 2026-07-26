"use client";

import type { IMainCharacterSlotItem } from "@/app/api/query/product/dto";
import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import useAuthStore from "@/store/authStore";
import useToastStore from "@/store/toastStore";
import {
  buildHomeCharacterChatSessionRequest,
  type CharacterChatEntrySource,
  createSingleFlightRunner,
  queueHomeCharacterChatLaunch,
} from "@/utils/characterChatLaunch";
import { resolveCharacterChatAccountReadEpisodeSeed } from "@/utils/characterChatEpisodeScope";
import { getCharacterChatRoleMeta } from "@/utils/characterChatRole";
import { buildProductDetailPath } from "@/utils/productPath";
import { getWebsochatSafeUserMessage } from "@/utils/websochatError";
import {
  getOrCreateWebsochatGuestKey,
  saveActiveWebsochatSessionId,
  saveWebsochatReturnPath,
} from "@/utils/websochatLaunch";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import CharacterChatPreviewModal from "./CharacterChatPreviewModal";

interface Props {
  items: IMainCharacterSlotItem[];
  adultYn: "Y" | "N";
  entrySource: CharacterChatEntrySource;
  className: string;
  imageSizes?: string;
  priorityItemCount?: number;
}

const CharacterChatCardGrid = ({
  items,
  adultYn,
  entrySource,
  className,
  imageSizes = "(max-width: 767px) 45vw, 211px",
  priorityItemCount = 0,
}: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setToast } = useToastStore();
  const { user, isAuthenticated, accessToken } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
  }));
  const launchOnceRef = useRef(createSingleFlightRunner());
  const [launchingScopeKey, setLaunchingScopeKey] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<IMainCharacterSlotItem | null>(null);
  const selectedAccountReadEpisodeNoSeed =
    resolveCharacterChatAccountReadEpisodeSeed(selectedItem);

  const handleCharacterClick = async (
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
          !!accessToken || isAuthenticated || !!user?.userId || !!storedAccessToken;
        const request = buildHomeCharacterChatSessionRequest({
          productId: item.productId,
          characterScopeKey: item.characterScopeKey,
          characterName: item.characterName,
          adultYn,
          guestKey: hasAccountScope ? null : getOrCreateWebsochatGuestKey(),
          accountReadEpisodeTo: selectedEpisodeNo,
          entrySource,
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

  const handleProductClick = (item: IMainCharacterSlotItem) => {
    setSelectedItem(null);
    router.push(buildProductDetailPath(item.productId));
  };

  return (
    <>
      <ul className={className}>
        {items.map((item, index) => {
          const characterImage = resolveProductCoverImage(item.characterImagePath);
          const isDefaultImage = characterImage === DEFAULT_PRODUCT_IMAGE;
          const isLaunching = launchingScopeKey === item.characterScopeKey;
          const roleMeta = getCharacterChatRoleMeta(item.characterRole);

          return (
            <li key={item.characterSlotId}>
              <button
                type="button"
                aria-label={`${roleMeta.gridLabel} · ${item.characterName} · ${item.productTitle}`}
                aria-haspopup="dialog"
                aria-busy={isLaunching}
                disabled={launchingScopeKey !== null}
                onClick={() => setSelectedItem(item)}
                className="group flex w-full flex-col text-left disabled:cursor-wait"
              >
                <div className="relative isolate aspect-[364/414] w-full overflow-hidden rounded-[10px] bg-light-gray-100">
                  <Image
                    src={characterImage}
                    alt={item.characterName}
                    fill
                    sizes={imageSizes}
                    priority={index < priorityItemCount}
                    unoptimized={isDefaultImage}
                    className={`object-cover [object-position:50%_12%] transition duration-200 md:group-hover:scale-[1.03] ${
                      isLaunching ? "scale-[1.01] opacity-60" : ""
                    }`}
                  />
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-6pxr left-6pxr z-[1] rounded-[4px] border px-5pxr py-2pxr text-10pxr font-medium leading-[13px] shadow-sm md:bottom-8pxr md:left-8pxr md:px-7pxr md:py-3pxr md:text-11pxr md:leading-[14px] ${
                      roleMeta.isProtagonist
                        ? "border-primary-100 bg-primary-100 text-white"
                        : "border-primary-100 bg-white/90 text-primary-100"
                    }`}
                  >
                    {roleMeta.gridLabel}
                  </span>
                  {item.syncedLatestEpisodeNo > 0 && (
                    <span className="absolute right-8pxr top-8pxr z-[1] rounded-full bg-black/70 px-8pxr py-4pxr text-11pxr font-medium leading-[14px] text-white shadow-sm md:text-12pxr">
                      ~{item.syncedLatestEpisodeNo}화까지
                    </span>
                  )}
                  {isLaunching && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                    </span>
                  )}
                </div>
                <span className="mt-10pxr block w-full truncate text-12pxr font-normal leading-[16px] text-dark-gray-400 md:text-13pxr">
                  {item.productTitle}
                </span>
                <span className="mt-5pxr block w-full truncate text-14pxr font-bold leading-[19px] text-black-100 md:text-15pxr">
                  {item.characterName}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <CharacterChatPreviewModal
        item={selectedItem}
        accountReadEpisodeNoSeed={selectedAccountReadEpisodeNoSeed}
        isLaunching={launchingScopeKey !== null}
        onLaunch={(item, selectedEpisodeNo) =>
          void handleCharacterClick(item, selectedEpisodeNo)
        }
        onGoToProduct={handleProductClick}
        onClose={() => {
          if (!launchingScopeKey) {
            setSelectedItem(null);
          }
        }}
      />
    </>
  );
};

export default CharacterChatCardGrid;
