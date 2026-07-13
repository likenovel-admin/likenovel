"use client";

import { IMainCharacterSlotItem } from "@/app/api/query/product/dto";
import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import useToastStore from "@/store/toastStore";
import { savePendingHomeCharacterChatLaunch } from "@/utils/characterChatLaunch";
import { saveActiveWebsochatSessionId } from "@/utils/websochatLaunch";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CircleArrow from "../common/CircleArrow";
import MainHeader from "../common/MainHeader";

interface Props {
  items: IMainCharacterSlotItem[];
  adultYn: "Y" | "N";
}

const CHARACTER_SLOT_SECTION_TITLE = "작품속 주인공과 채팅해봐요";

const useResponsivePageSize = () => {
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const tablet = window.matchMedia("(min-width: 768px)");
    const update = () => setPageSize(desktop.matches ? 10 : tablet.matches ? 8 : 4);
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
  const { setToast } = useToastStore();
  const pageSize = useResponsivePageSize();
  const [page, setPage] = useState(0);
  const [launchingScopeKey, setLaunchingScopeKey] = useState<string | null>(null);
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

  const handleCharacterClick = (item: IMainCharacterSlotItem) => {
    if (launchingScopeKey !== null) return;
    setLaunchingScopeKey(item.characterScopeKey);
    try {
      savePendingHomeCharacterChatLaunch({
        productId: item.productId,
        productTitle: item.productTitle,
        characterScopeKey: item.characterScopeKey,
        characterName: item.characterName,
        adultYn,
      });
      saveActiveWebsochatSessionId(null);
      router.push("/websochat");
    } catch {
      setLaunchingScopeKey(null);
      setToast({
        type: "error",
        message: "캐릭터 대화를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.",
      });
    }
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

      <ul className="mt-10pxr grid grid-cols-2 gap-x-10pxr gap-y-20pxr px-16pxr md:mt-20pxr md:grid-cols-4 md:gap-x-20pxr md:px-0 lg:grid-cols-5">
        {visibleItems.map((item) => {
          const characterImage = resolveProductCoverImage(item.characterImagePath);
          const isDefaultImage = characterImage === DEFAULT_PRODUCT_IMAGE;
          const isLaunching = launchingScopeKey === item.characterScopeKey;

          return (
            <li key={item.characterSlotId}>
              <button
                type="button"
                aria-label={`${item.characterName} · ${item.productTitle}`}
                aria-busy={isLaunching}
                disabled={launchingScopeKey !== null}
                onClick={() => handleCharacterClick(item)}
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
    </section>
  );
};

export default CharacterSlot;
