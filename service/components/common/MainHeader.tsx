"use client";

import TimeSpeechBubble from "../common/TimeSpeechBubble";
import ArrowRightSmall from "/public/images/arrow-right-small.svg";
import ExclamationMark from "/public/images/exclamation-mark.svg";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

const rankingGuideMessage = [
  "랭킹 집계 기간: 매시 30분 기준 직전 24시간 조회수",
  "랭킹 집계 기준: 최근 24시간 조회수 90% + 누적 조회수 10%",
  "연재 Top은 공개 3화 이상, 최근 30일 내 공개 또는 예약 공개가 있는 연재중 작품만 포함됩니다.",
];

interface Props {
  headerText: ReactNode;
  textStyle?: string;
  hasTimeSpeechBubble?: boolean;
  timeSpeechBubbleMode?: "current" | "ranking";
  timeSpeechBubbleOnClick?: () => void;
  timeSpeechBubbleAriaLabel?: string;
  timeSpeechBubbleShowActionIndicator?: boolean;
  hasMoreButton?: boolean;
  moreButtonOnClick?: () => void;
  hasRankingGuide?: boolean;
  rankingGuideAction?: ReactNode;
  rightAction?: ReactNode;
  mobileTwoRow?: boolean;
  compactMobileMore?: boolean;
}
const MainHeader = ({
  headerText,
  textStyle = "text-17pxr md:text-24pxr font-bold",
  hasTimeSpeechBubble = false,
  timeSpeechBubbleMode = "current",
  timeSpeechBubbleOnClick,
  timeSpeechBubbleAriaLabel,
  timeSpeechBubbleShowActionIndicator = false,
  hasMoreButton = false,
  moreButtonOnClick,
  hasRankingGuide = false,
  rankingGuideAction,
  rightAction,
  mobileTwoRow = false,
  compactMobileMore = false,
}: Props) => {
  const tooltipId = useId();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const guideRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasRankingGuide) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!guideRef.current) return;
      if (!guideRef.current.contains(event.target as Node)) {
        setIsGuideOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () =>
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
  }, [hasRankingGuide]);

  const rankingMeta = (
    <>
      {hasTimeSpeechBubble && (
        <TimeSpeechBubble
          mode={timeSpeechBubbleMode}
          onClick={timeSpeechBubbleOnClick}
          ariaLabel={timeSpeechBubbleAriaLabel}
          showActionIndicator={timeSpeechBubbleShowActionIndicator}
        />
      )}
      {hasRankingGuide && (
        <div ref={guideRef} className="relative flex items-center">
          <button
            type="button"
            aria-label="랭킹 산정 기준 보기"
            aria-describedby={isGuideOpen ? tooltipId : undefined}
            aria-expanded={isGuideOpen}
            className="flex h-[28px] w-[28px] items-center justify-center"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsGuideOpen((prev) => !prev);
            }}
          >
            <span
              className={`flex h-[16px] w-[16px] items-center justify-center rounded-full border border-light-gray-600 ${
                isGuideOpen
                  ? "bg-black-100 hover:bg-dark-gray-600"
                  : "bg-white hover:bg-light-gray-100"
              }`}
            >
              <ExclamationMark
                className={isGuideOpen ? "text-white" : "text-dark-gray-300"}
              />
            </span>
          </button>
          {isGuideOpen && (
            <div
              id={tooltipId}
              role="tooltip"
              className={`absolute z-20 top-full right-[-8px] mt-8pxr rounded-[10px] bg-black-100 p-10pxr text-left text-12pxr font-medium leading-[17px] text-white shadow-sm ${
                mobileTwoRow ? "w-[200px] md:w-[260px]" : "w-[260px]"
              }`}
            >
              {rankingGuideMessage.map((message) => (
                <span key={message} className="block">
                  {message}
                </span>
              ))}
              <div className="absolute -top-[4px] right-[13px] h-8pxr w-8pxr rotate-45 bg-black-100" />
            </div>
          )}
        </div>
      )}
      {rankingGuideAction}
    </>
  );

  return (
    <div
      className={
        mobileTwoRow
          ? "grid grid-cols-[minmax(0,1fr)_auto] gap-y-4pxr md:flex md:justify-between"
          : "flex justify-between"
      }
    >
      <div
        className={
          mobileTwoRow
            ? "contents md:flex md:items-center md:gap-8pxr md:pl-0"
            : "flex items-center gap-8pxr pl-16pxr md:pl-0"
        }
      >
        <span
          className={`${textStyle} ${
            mobileTwoRow
              ? "col-start-1 row-start-1 self-center whitespace-nowrap pl-16pxr md:pl-0"
              : ""
          }`}
        >
          {headerText}
        </span>
        {mobileTwoRow ? (
          <div className="col-span-2 row-start-2 flex items-center gap-8pxr px-16pxr md:contents">
            {rankingMeta}
          </div>
        ) : (
          rankingMeta
        )}
      </div>
      {(rightAction || hasMoreButton) && (
        <div
          className={
            mobileTwoRow
              ? "col-start-2 row-start-1 flex shrink-0 items-center gap-12pxr whitespace-nowrap pr-16pxr md:pr-0"
              : "flex shrink-0 items-center gap-12pxr pr-16pxr md:pr-0"
          }
        >
          {rightAction}
          {hasMoreButton && (
            <button
              className="flex shrink-0 items-center gap-8pxr p-2"
              onClick={moreButtonOnClick}
            >
              <span
                className={`whitespace-nowrap text-dark-gray-300 ${
                  compactMobileMore
                    ? "text-13pxr md:text-14pxr"
                    : "text-14pxr"
                } font-medium`}
              >
                더보기
              </span>
              <ArrowRightSmall className="text-dark-gray-300 hidden md:block" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
export default MainHeader;
