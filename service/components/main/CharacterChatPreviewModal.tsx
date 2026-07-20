"use client";

import type { IMainCharacterSlotItem } from "@/app/api/query/product/dto";
import BottomSheetContainer from "@/components/common/BottomSheetContainer";
import ModalContainer from "@/components/common/ModalContainer";
import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import useMediaDevice from "@/hooks/useMediaDevice";
import Image from "next/image";

interface Props {
  item: IMainCharacterSlotItem | null;
  isLaunching: boolean;
  onLaunch: (item: IMainCharacterSlotItem) => void;
  onGoToProduct: (item: IMainCharacterSlotItem) => void;
  onClose: () => void;
}

const CharacterChatPreviewContent = ({
  item,
  isLaunching,
  onLaunch,
  onGoToProduct,
}: Omit<Props, "item" | "onClose"> & { item: IMainCharacterSlotItem }) => {
  const characterImage = resolveProductCoverImage(item.characterImagePath);
  const isDefaultImage = characterImage === DEFAULT_PRODUCT_IMAGE;
  const authorName = String(item.authorNickname || "").trim();

  return (
    <div className="flex max-h-[80dvh] w-full flex-col overflow-hidden md:w-[600px]">
      <div className="min-h-0 flex-1 overflow-y-auto px-20pxr pb-20pxr md:px-30pxr md:pb-30pxr">
        <div className="flex items-start gap-18pxr md:gap-28pxr">
          <div className="relative aspect-[364/414] w-[132px] shrink-0 overflow-hidden rounded-[10px] bg-light-gray-100 md:w-[220px]">
            <Image
              src={characterImage}
              alt={item.characterName}
              fill
              sizes="(max-width: 767px) 132px, 220px"
              unoptimized={isDefaultImage}
              className="object-cover [object-position:50%_12%]"
            />
            {item.syncedLatestEpisodeNo > 0 && (
              <span className="absolute right-8pxr top-8pxr rounded-full bg-black/70 px-8pxr py-4pxr text-11pxr font-medium leading-[14px] text-white">
                ~{item.syncedLatestEpisodeNo}화까지
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
            <p className="mt-16pxr text-13pxr leading-[19px] text-dark-gray-500 md:text-14pxr md:leading-[21px]">
              읽은 회차 범위 안에서 작품의 설정과 캐릭터를 반영해 대화합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-light-gray-200 bg-white px-20pxr pb-[calc(16px+env(safe-area-inset-bottom))] pt-14pxr md:px-30pxr md:pb-20pxr">
        <div className="flex flex-col gap-10pxr md:flex-row-reverse">
          <button
            type="button"
            disabled={isLaunching}
            aria-busy={isLaunching}
            onClick={() => onLaunch(item)}
            className="h-48pxr w-full rounded-[10px] bg-primary-100 text-16pxr font-medium text-white disabled:cursor-wait disabled:opacity-60"
          >
            이 캐릭터와 대화하기
          </button>
          <button
            type="button"
            disabled={isLaunching}
            onClick={() => onGoToProduct(item)}
            className="h-48pxr w-full rounded-[10px] border border-light-gray-300 bg-white text-15pxr font-medium text-dark-gray-500 disabled:opacity-60"
          >
            작품 보기
          </button>
        </div>
      </div>
    </div>
  );
};

const CharacterChatPreviewModal = ({
  item,
  isLaunching,
  onLaunch,
  onGoToProduct,
  onClose,
}: Props) => {
  const device = useMediaDevice();

  if (!item || device === null) return null;

  const content = (
    <CharacterChatPreviewContent
      item={item}
      isLaunching={isLaunching}
      onLaunch={onLaunch}
      onGoToProduct={onGoToProduct}
    />
  );

  if (device === "mobile") {
    return (
      <BottomSheetContainer isOpen onClose={onClose} usePortal>
        {content}
      </BottomSheetContainer>
    );
  }

  return (
    <ModalContainer isOpen onClose={onClose} size="full" usePortal>
      {content}
    </ModalContainer>
  );
};

export default CharacterChatPreviewModal;
