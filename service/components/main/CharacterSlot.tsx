"use client";

import { getEpisodeListQueryOptions } from "@/app/api/query/product";
import { IMainCharacterSlotItem } from "@/app/api/query/product/dto";
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
import { buildProductDetailPath } from "@/utils/productPath";
import { getWebsochatSafeUserMessage } from "@/utils/websochatError";
import {
  getOrCreateWebsochatGuestKey,
  saveActiveWebsochatSessionId,
} from "@/utils/websochatLaunch";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import CircleArrow from "../common/CircleArrow";
import CharacterChatPreviewModal from "./CharacterChatPreviewModal";
import MainHeader from "../common/MainHeader";

interface Props {
  items: IMainCharacterSlotItem[];
  adultYn: "Y" | "N";
}

const CHARACTER_SLOT_SECTION_TITLE = "작품속 주인공과 채팅해봐요";

const useResponsivePageSize = () => {
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const tablet = window.matchMedia("(min-width: 768px)");
    const update = () => setPageSize(desktop.matches ? 12 : tablet.matches ? 8 : 4);
    update();
    desktop.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  return pageSize;
};

const CharacterSlot = ({ items, adultYn }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setToast } = useToastStore();
  const { user, isAuthenticated, accessToken } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
  }));
  const pageSize = useResponsivePageSize();
  const launchOnceRef = useRef(createSingleFlightRunner());
  const [page, setPage] = useState(0);
  const [launchingScopeKey, setLaunchingScopeKey] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<IMainCharacterSlotItem | null>(null);
  const list = useMemo(() => items ?? [], [items]);
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const hasPager = list.length > pageSize;

  useEffect(() => setPage(0), [pageSize]);
  useEffect(() => {
    if (page >= pageCount) setPage(0);
  }, [page, pageCount]);

  const visibleItems = useMemo(() => {
    const start = page * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page, pageSize]);

  if (list.length === 0) return null;

  const handleCharacterClick = async (item: IMainCharacterSlotItem) => {
    await launchOnceRef.current(async () => {
      setLaunchingScopeKey(item.characterScopeKey);
      try {
        const storedAccessToken =
          window.localStorage.getItem("access_token") ||
          window.sessionStorage.getItem("access_token");
        const hasAccountScope =
          !!accessToken || isAuthenticated || !!user?.userId || !!storedAccessToken;
        const response = await queryClient.fetchQuery(
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
        );
        const accountReadEpisodeTo = response.data.latestEpisodeNo || 1;

        const request = buildHomeCharacterChatSessionRequest({
          productId: item.productId,
          characterScopeKey: item.characterScopeKey,
          characterName: item.characterName,
          adultYn,
          guestKey: hasAccountScope ? null : getOrCreateWebsochatGuestKey(),
          accountReadEpisodeTo,
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
          navigate: () => router.push("/websochat"),
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
    <section
      data-home-section="character-slot"
      className="relative mx-auto w-full max-w-[1120px]"
    >
      <MainHeader
        headerText={CHARACTER_SLOT_SECTION_TITLE}
        rightAction={
          hasPager ? (
            <div className="flex items-center gap-8pxr">
              <CircleArrow
                direction="left"
                onClick={() => setPage((current) => (current - 1 + pageCount) % pageCount)}
              />
              <CircleArrow
                direction="right"
                onClick={() => setPage((current) => (current + 1) % pageCount)}
              />
            </div>
          ) : null
        }
      />

      <ul className="mt-10pxr grid grid-cols-2 gap-x-10pxr gap-y-20pxr px-16pxr md:mt-20pxr md:grid-cols-4 md:gap-x-20pxr md:px-0 lg:grid-cols-6">
        {visibleItems.map((item) => {
          const characterImage = resolveProductCoverImage(item.characterImagePath);
          const isDefaultImage = characterImage === DEFAULT_PRODUCT_IMAGE;
          const isLaunching = launchingScopeKey === item.characterScopeKey;

          return (
            <li key={item.characterSlotId}>
              <button
                type="button"
                aria-label={`${item.characterName} · ${item.productTitle}`}
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
                    sizes="(max-width: 767px) 45vw, 211px"
                    unoptimized={isDefaultImage}
                    className={`object-cover [object-position:50%_12%] transition duration-200 md:group-hover:scale-[1.03] ${
                      isLaunching ? "scale-[1.01] opacity-60" : ""
                    }`}
                  />
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
                <span className="mt-5pxr block w-full truncate text-14pxr font-semibold leading-[19px] text-black-100 md:text-15pxr">
                  {item.characterName}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <CharacterChatPreviewModal
        item={selectedItem}
        isLaunching={launchingScopeKey !== null}
        onLaunch={(item) => void handleCharacterClick(item)}
        onGoToProduct={handleProductClick}
        onClose={() => {
          if (!launchingScopeKey) setSelectedItem(null);
        }}
      />
    </section>
  );
};

export default CharacterSlot;
