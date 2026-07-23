"use client";

import type { IMainCharacterSlotItem } from "@/app/api/query/product/dto";
import CharacterChatPreviewModal from "@/components/main/CharacterChatPreviewModal";
import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import Image from "next/image";
import { useState } from "react";

export type WebsochatStartView = "chooser" | "character_picker";

interface Props {
  view: WebsochatStartView;
  items: IMainCharacterSlotItem[];
  loading: boolean;
  error: string | null;
  launching: boolean;
  onChooseWebsochat: () => void;
  onChooseCharacterChat: () => void;
  onBack: () => void;
  onRetry: () => void;
  onLaunchCharacter: (
    item: IMainCharacterSlotItem,
    readEpisodeNo: number
  ) => void;
  onGoToProduct: (item: IMainCharacterSlotItem) => void;
}

const CharacterGridSkeleton = () => (
  <ul
    aria-label="주인공 목록 불러오는 중"
    className="grid grid-cols-2 gap-x-10pxr gap-y-20pxr md:grid-cols-4 md:gap-x-20pxr lg:grid-cols-6"
  >
    {Array.from({ length: 12 }, (_, index) => (
      <li key={index} aria-hidden="true">
        <div className="aspect-[364/414] w-full animate-pulse rounded-[10px] bg-light-gray-100" />
        <div className="mt-10pxr h-14pxr w-4/5 animate-pulse rounded-[4px] bg-light-gray-100" />
        <div className="mt-5pxr h-16pxr w-3/5 animate-pulse rounded-[4px] bg-light-gray-100" />
      </li>
    ))}
  </ul>
);

const WebsochatStartChooser = ({
  view,
  items,
  loading,
  error,
  launching,
  onChooseWebsochat,
  onChooseCharacterChat,
  onBack,
  onRetry,
  onLaunchCharacter,
  onGoToProduct,
}: Props) => {
  const [selectedItem, setSelectedItem] =
    useState<IMainCharacterSlotItem | null>(null);

  if (view === "chooser") {
    return (
      <section className="mx-auto flex min-h-full w-full max-w-[720px] flex-col justify-center px-16pxr py-32pxr md:px-0 md:py-48pxr">
        <h1 className="text-22pxr font-bold leading-[30px] text-black-100 md:text-26pxr md:leading-[36px]">
          어떤 대화를 시작할까요?
        </h1>
        <p className="mt-8pxr text-14pxr leading-[21px] text-dark-gray-500 md:text-15pxr">
          작품에 대해 묻거나, 읽은 범위 안에서 주인공과 이야기해보세요.
        </p>

        <div className="mt-24pxr grid grid-cols-1 gap-12pxr md:grid-cols-2 md:gap-16pxr">
          <button
            type="button"
            onClick={onChooseWebsochat}
            className="min-h-[144px] rounded-[10px] border border-light-gray-300 bg-white p-20pxr text-left transition-colors hover:border-dark-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2 md:p-24pxr"
          >
            <span className="block text-18pxr font-bold leading-[25px] text-black-100">
              웹소챗
            </span>
            <span className="mt-12pxr block text-15pxr font-semibold leading-[21px] text-black-100">
              작품에 대해 물어보기
            </span>
            <span className="mt-6pxr block text-13pxr leading-[19px] text-dark-gray-500 md:text-14pxr md:leading-[21px]">
              줄거리, 인물, 복선과 다음 전개를 물어보세요.
            </span>
          </button>

          <button
            type="button"
            onClick={onChooseCharacterChat}
            className="min-h-[144px] rounded-[10px] border border-light-gray-300 bg-white p-20pxr text-left transition-colors hover:border-dark-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2 md:p-24pxr"
          >
            <span className="block text-18pxr font-bold leading-[25px] text-black-100">
              주인공챗
            </span>
            <span className="mt-12pxr block text-15pxr font-semibold leading-[21px] text-black-100">
              주인공과 대화하기
            </span>
            <span className="mt-6pxr block text-13pxr leading-[19px] text-dark-gray-500 md:text-14pxr md:leading-[21px]">
              읽은 데까지만 아는 주인공과 이야기를 이어가보세요.
            </span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1120px] px-16pxr py-24pxr md:px-24pxr md:py-32pxr lg:px-0">
      <button
        type="button"
        onClick={() => {
          setSelectedItem(null);
          onBack();
        }}
        className="flex min-h-48pxr items-center text-14pxr font-medium text-dark-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2"
      >
        <span aria-hidden="true" className="mr-8pxr text-18pxr">
          ←
        </span>
        대화 방식 다시 선택
      </button>

      <div className="mt-16pxr">
        <h1 className="text-22pxr font-bold leading-[30px] text-black-100 md:text-26pxr md:leading-[36px]">
          대화할 주인공을 골라주세요
        </h1>
        <p className="mt-8pxr text-14pxr leading-[21px] text-dark-gray-500 md:text-15pxr">
          지금 대화할 수 있는 주인공만 보여드려요.
        </p>
      </div>

      <div className="mt-24pxr">
        {loading ? (
          <CharacterGridSkeleton />
        ) : error ? (
          <div
            role="alert"
            className="flex min-h-[220px] flex-col items-center justify-center border-y border-light-gray-200 px-16pxr text-center"
          >
            <p className="text-14pxr leading-[21px] text-dark-gray-500">
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-16pxr min-h-48pxr rounded-[10px] border border-light-gray-300 bg-white px-20pxr text-14pxr font-medium text-black-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2"
            >
              다시 시도
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center border-y border-light-gray-200 px-16pxr text-center">
            <p className="text-14pxr leading-[21px] text-dark-gray-500">
              지금 대화할 수 있는 주인공이 없어요.
            </p>
            <button
              type="button"
              onClick={onChooseWebsochat}
              className="mt-16pxr min-h-48pxr rounded-[10px] bg-primary-100 px-20pxr text-14pxr font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2"
            >
              웹소챗 시작하기
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-10pxr gap-y-20pxr md:grid-cols-4 md:gap-x-20pxr lg:grid-cols-6">
            {items.map((item) => {
              const characterImage = resolveProductCoverImage(
                item.characterImagePath
              );
              const isDefaultImage = characterImage === DEFAULT_PRODUCT_IMAGE;

              return (
                <li key={item.characterSlotId}>
                  <button
                    type="button"
                    aria-label={`${item.characterName} · ${item.productTitle}`}
                    aria-haspopup="dialog"
                    disabled={launching}
                    onClick={() => setSelectedItem(item)}
                    className="group flex min-h-48pxr w-full flex-col text-left disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2"
                  >
                    <span className="relative isolate aspect-[364/414] w-full overflow-hidden rounded-[10px] bg-light-gray-100">
                      <Image
                        src={characterImage}
                        alt={item.characterName}
                        fill
                        sizes="(max-width: 767px) 45vw, (max-width: 1023px) 23vw, 170px"
                        unoptimized={isDefaultImage}
                        className="object-cover [object-position:50%_12%]"
                      />
                      {item.syncedLatestEpisodeNo > 0 && (
                        <span className="absolute right-8pxr top-8pxr rounded-full bg-black/70 px-8pxr py-4pxr text-11pxr font-medium leading-[14px] text-white md:text-12pxr">
                          ~{item.syncedLatestEpisodeNo}화까지
                        </span>
                      )}
                    </span>
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
        )}
      </div>

      <CharacterChatPreviewModal
        item={selectedItem}
        isLaunching={launching}
        onLaunch={onLaunchCharacter}
        onGoToProduct={onGoToProduct}
        onClose={() => {
          if (!launching) setSelectedItem(null);
        }}
      />
    </section>
  );
};

export default WebsochatStartChooser;
