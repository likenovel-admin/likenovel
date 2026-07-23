"use client";

import type { IMainCharacterSlotItem } from "@/app/api/query/product/dto";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CircleArrow from "../common/CircleArrow";
import MainHeader from "../common/MainHeader";
import CharacterChatCardGrid from "./CharacterChatCardGrid";

interface Props {
  items: IMainCharacterSlotItem[];
  adultYn: "Y" | "N";
}

const CHARACTER_SLOT_SECTION_TITLE = "다음 회차를 기다리는 동안, 주인공챗";
const CHARACTER_SLOT_SECTION_SUBTITLES = [
  "읽은 회차에서 주인공과 마음대로 전개를 이어가보세요",
  "당신이 멈춘 회차에서 주인공과 바로 이어가보세요",
  "스포일러 걱정 없이, 읽은 데까지의 주인공과 대화해요",
  "원작에 없던 장면을 주인공과 함께 만들어보세요",
  "지금 읽은 만큼만 아는 주인공과 이야기해보세요",
  "내가 읽은 그 순간의 주인공과 새로운 이야기를 이어가보세요",
];

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
  const pageSize = useResponsivePageSize();
  const [page, setPage] = useState(0);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const list = items;
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const hasPager = list.length > pageSize;

  useEffect(() => setPage(0), [pageSize]);
  useEffect(() => {
    setSubtitleIndex(
      Math.floor(Math.random() * CHARACTER_SLOT_SECTION_SUBTITLES.length)
    );
  }, []);
  useEffect(() => {
    if (page >= pageCount) setPage(0);
  }, [page, pageCount]);

  const visibleItems = useMemo(() => {
    const start = page * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page, pageSize]);

  if (list.length === 0) return null;

  return (
    <section
      data-home-section="character-slot"
      className="relative mx-auto w-full max-w-[1120px]"
    >
      <MainHeader
        headerText={CHARACTER_SLOT_SECTION_TITLE}
        hasMoreButton
        compactMobileMore
        moreButtonOnClick={() => router.push("/product/character-chat")}
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

      <p className="mt-4pxr pl-16pxr text-12pxr text-dark-gray-500 md:pl-0 md:text-14pxr">
        {CHARACTER_SLOT_SECTION_SUBTITLES[subtitleIndex]}
      </p>

      <CharacterChatCardGrid
        items={visibleItems}
        adultYn={adultYn}
        entrySource="home_character_slot"
        className="mt-10pxr grid grid-cols-2 gap-x-10pxr gap-y-20pxr px-16pxr md:mt-20pxr md:grid-cols-4 md:gap-x-20pxr md:px-0 lg:grid-cols-6"
      />
    </section>
  );
};

export default CharacterSlot;
