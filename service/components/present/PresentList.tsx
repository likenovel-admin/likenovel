"use client";

import {
  useReceiveGiftBox,
  useSelectUserGiftBook,
} from "@/app/api/query/giftbook";
import { IGiftBookItem } from "@/app/api/query/giftbook/dto";
import Spinner from "@/components/common/Spinner";
import useToastStore from "@/store/toastStore";
import { getGiftTicketLabel } from "@/utils/giftTicketLabel";
import { getFormattingDate } from "@/utils/getFormattingDate";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";

interface IPresentItem {
  id: number;
  title: string;
  authorNickname: string;
  authorEventLevelBadgeImagePath: string;
  illustratorNickname?: string;
  hasGle: boolean;
  freeEpisodeNumber: number;
  timePassValue: string;
  coverImagePath: string;
  waitForFreeYn: "Y" | "N";
  newReleaseYn: "Y" | "N";
  monopolyYn: "Y" | "N";
  episodeUploadYn: "Y" | "N";
  sixNinePathYn: "Y" | "N";
  isCompleted: boolean;
  amount: number;
  expiration_date: string;
  hasProduct: boolean;
  productType: string;
  promotionType: string;
  acquisitionType: string;
  ticketType: string;
  promotionItemType: string;
}

const PresentList = () => {
  const router = useRouter();
  const { data: giftBookResponse, isLoading } = useSelectUserGiftBook();

  const presents: IPresentItem[] =
    giftBookResponse?.data?.map((gift: IGiftBookItem) => ({
      id: gift.id,
      title: gift.product?.title || "",
      authorNickname: gift.product?.author_name || "",
      authorEventLevelBadgeImagePath:
        gift.product?.badge?.authorEventLevelBadgeImagePath || "",
      illustratorNickname: "",
      hasGle: true,
      freeEpisodeNumber: gift.product?.badge?.freeEpisodeTicketCount || 0,
      timePassValue: gift.product?.badge?.timepassFromTo || "",
      coverImagePath: gift.product?.thumbnail_url || "",
      waitForFreeYn:
        gift.product?.badge?.waitForFreeYn ||
        gift.product?.badge?.waitingForFreeYn ||
        "N",
      newReleaseYn: gift.product?.badge?.newReleaseYn || "N",
      episodeUploadYn: gift.product?.badge?.episodeUploadYn ? "Y" : "N",
      sixNinePathYn: gift.product?.badge?.sixNinePathYn || "N",
      monopolyYn: "N",
      productType: gift.product?.product_type || "",
      isCompleted: gift.received_yn === "Y",
      amount: gift.amount,
      expiration_date: gift.expiration_date || "",
      hasProduct: gift.product !== null, // Flag to check if product exists
      promotionType: gift.promotion_type || "",
      acquisitionType: gift.acquisition_type || "",
      ticketType: gift.ticket_type || "",
      promotionItemType: gift.promotion?.type || "",
    })) || [];

  return (
    <div className="w-full h-full flex flex-col px-20pxr">
      <header className="flex justify-between py-16pxr border-b border-light-gray-300">
        <h1 className="text-18pxr md:text-24pxr font-bold">선물함</h1>
        <button
          className="text-13pxr text-dark-gray-400 flex items-center gap-4pxr"
          onClick={() => router.push("/product/present/received")}
        >
          받은 선물 보기
          <div className="w-[28px] h-[28px] flex flex-col p-7pxr gap-[1.5px] justify-center border border-dark-gray-100 rounded-full">
            <div className="w-full h-[2px] bg-dark-gray-400"></div>
            <div className="w-full h-[2px] bg-dark-gray-400"></div>
            <div className="w-[50%] h-[2px] bg-dark-gray-400"></div>
          </div>
        </button>
      </header>
      {isLoading ? (
        <div className="mt-50pxr w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-5">
            {presents?.map((present) => (
              <PresentItem key={present.id} {...present} />
            ))}
          </div>{" "}
        </>
      )}
    </div>
  );
};

const PresentItem = (props: IPresentItem) => {
  const queryClient = useQueryClient();
  const { setToast } = useToastStore();
  const receiveMutation = useReceiveGiftBox();

  const badgeTypes: ("waitForFree" | "timePass" | "freeEpisodes")[] = [];
  if (props.waitForFreeYn === "Y") badgeTypes.push("waitForFree");
  if (props.timePassValue || props.sixNinePathYn === "Y")
    badgeTypes.push("timePass");
  if (props.freeEpisodeNumber > 0) badgeTypes.push("freeEpisodes");

  const handleReceiveGift = async () => {
    if (receiveMutation.isPending) return;

    try {
      await receiveMutation.mutateAsync(props.id, {
        onSuccess: () => {
          // Invalidate queries to refresh gift list
          queryClient.invalidateQueries({ queryKey: ["selectUserGiftBook"] });
          queryClient.invalidateQueries({
            queryKey: ["selectUserGiftBookHistory"],
          });
          queryClient.invalidateQueries({
            queryKey: ["selectUserInfo"],
          });

          setToast({
            message: "선물을 받았습니다!",
            type: "success",
          });
        },
        onError: (error: any) => {
          console.error("Receive gift error:", error);
          setToast({
            message:
              error.response?.data?.message ||
              "선물 받기 중 오류가 발생했습니다.",
            type: "error",
          });
        },
      });
    } catch (error) {
      // Error already handled in onError callback
      console.error("Receive gift failed:", error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-16pxr py-16pxr border-b border-light-gray-300">
        {props.hasProduct && (
          <div className="relative w-[100px] h-[140px]">
            <Image
              src={
                props.coverImagePath ||
                "https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
              }
              alt="작품 표지"
              fill
              className="rounded-lg object-cover"
            />
            {badgeTypes.length > 0 && (
              <div className="absolute top-1 left-1 md:align-end">
                <SquareBadge
                  type={badgeTypes}
                  freeEpisodeNumber={props.freeEpisodeNumber}
                  timePassValue={props.timePassValue}
                  size="small"
                />
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col gap-7pxr flex-1">
          {props.hasProduct && (
            <>
              <div className="flex flex-col md:flex-row-reverse md:justify-end gap-1">
                <div className="flex items-center gap-4pxr">
                  {props.monopolyYn === "Y" && (
                    <SquareBadge type="only" size="small" />
                  )}

                  {props.newReleaseYn === "Y" && (
                    <SquareBadge type="new" size="small" />
                  )}
                  {props.productType && (
                    <SquareBadge
                      type={props.productType as "free" | "paid"}
                      size="small"
                    />
                  )}
                  {props.episodeUploadYn === "Y" && (
                    <SquareBadge type="up" size="small" />
                  )}
                </div>
                <h3 className="text-16pxr font-semibold">{props.title}</h3>
              </div>
              <div className="flex items-center gap-8pxr">
                <UserNickname
                  userNickname={props.authorNickname}
                  hasGle={props.hasGle}
                  product={
                    {
                      badge: {
                        authorEventLevelBadgeImagePath:
                          props.authorEventLevelBadgeImagePath,
                      },
                    } as any
                  }
                />
                {props.illustratorNickname && (
                  <>
                    <span className="text-8pxr text-dark-gray-100">|</span>
                    <span className="text-13pxr text-dark-gray-400 whitespace-nowrap">
                      {props.illustratorNickname} 그림
                    </span>
                  </>
                )}
              </div>
            </>
          )}
          <div className="flex items-center gap-4pxr mt-2">
            <Image
              src="/images/discount.svg"
              width={16}
              height={16}
              alt="대여권"
            />
            <span className="text-13pxr">
              {getGiftTicketLabel({
                promotionType: props.promotionType,
                acquisitionType: props.acquisitionType,
                ticketType: props.ticketType,
                promotionItemType: props.promotionItemType,
              })}{" "}
              {props.amount}장
              {props.expiration_date ? (
                <span className="ml-2 text-primary-100 hidden md:inline-block">
                  유효기간{" "}
                  {getFormattingDate(props.expiration_date, "YYYY.MM.DD")}
                </span>
              ) : null}
            </span>
          </div>
        </div>
        <button
          className={`w-m h-32pxr px-2.5 py-1.5 rounded-full text-sm md:mt-auto
          ${
            props.isCompleted
              ? "bg-gray-200 text-gray-500"
              : "bg-black text-white"
          }
          ${receiveMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={props.isCompleted ? undefined : handleReceiveGift}
          disabled={props.isCompleted || receiveMutation.isPending}
        >
          {receiveMutation.isPending
            ? "처리중..."
            : props.isCompleted
            ? "바로가기"
            : "선물받기"}
        </button>
      </div>
    </div>
  );
};

export default PresentList;
