"use client";

import { ONBOARDING_SELECTED_TAG_CHIP_CLASS } from "@/components/recommendation/tagChipStyles";
import type { AiLibrarianCopy } from "@/utils/aiLibrarian";
import { PRODUCT_DETAIL_AI_LIBRARIAN_FOCUS } from "@/utils/aiLibrarian";

interface Props {
  copy?: AiLibrarianCopy | null;
  isLoading?: boolean;
  onAskMore?: () => void;
}

export default function AiLibrarianDetailCard({
  copy,
  isLoading = false,
  onAskMore,
}: Props) {
  if (!copy && !isLoading) return null;

  return (
    <section
      id={PRODUCT_DETAIL_AI_LIBRARIAN_FOCUS}
      className="mx-16pxr md:mx-0 rounded-[10px] border border-light-gray-500 bg-white px-16pxr py-16pxr md:px-20pxr md:py-18pxr"
    >
      <div className="min-w-0">
        <span className="text-16pxr md:text-18pxr font-bold text-black-100">
          AI 사서
        </span>
        {isLoading && !copy ? (
          <div
            aria-label="AI 사서 브리핑 불러오는 중"
            className="mt-10pxr animate-pulse"
          >
            <div className="h-[14px] w-full rounded-full bg-light-gray-400" />
            <div className="mt-7pxr h-[14px] w-4/5 rounded-full bg-light-gray-400" />
            <div className="mt-14pxr flex flex-col gap-8pxr">
              <div className="h-[12px] w-11/12 rounded-full bg-light-gray-300" />
              <div className="h-[12px] w-4/5 rounded-full bg-light-gray-300" />
              <div className="h-[12px] w-3/4 rounded-full bg-light-gray-300" />
            </div>
            <div className="mt-14pxr flex gap-6pxr">
              <div className="h-[25px] w-[58px] rounded-full bg-light-gray-300" />
              <div className="h-[25px] w-[72px] rounded-full bg-light-gray-300" />
              <div className="h-[25px] w-[64px] rounded-full bg-light-gray-300" />
            </div>
          </div>
        ) : (
          <p className="mt-8pxr text-14pxr md:text-15pxr leading-[22px] text-dark-gray-500">
            {copy?.intro}
          </p>
        )}
      </div>

      {copy && (
        <>
          <ul className="mt-12pxr flex flex-col gap-6pxr">
            {copy.points.map((point) => (
              <li
                key={point}
                className="flex gap-7pxr text-13pxr md:text-14pxr leading-[20px] text-dark-gray-500"
              >
                <span className="mt-[8px] h-[3px] w-[3px] shrink-0 rounded-full bg-dark-gray-300" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {copy.chips.length > 0 && (
            <div className="mt-12pxr flex flex-wrap gap-6pxr">
              {copy.chips.map((chip) => (
                <span
                  key={chip}
                  className={ONBOARDING_SELECTED_TAG_CHIP_CLASS}
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {onAskMore && (
            <div className="mt-14pxr flex justify-center">
              <button
                type="button"
                onClick={onAskMore}
                className="rounded-full bg-primary-100 px-10pxr py-4pxr text-11pxr font-semibold leading-[15px] text-white"
              >
                AI사서에게 더 물어볼까요?
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
