"use client";

import { useSelectUserGiftBookHistory } from "@/app/api/query/giftbook";
import { IUserGiftBookHistoryItem } from "@/app/api/query/giftbook/dto";
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";
import { getFormattingDate } from "@/utils/getFormattingDate";
import Image from "next/image";
import { useState } from "react";
import Spinner from "../common/Spinner";
import Tab from "../common/Tab";
import UserNickname from "../common/UserNickname";
import Clock from "/public/images/clock.svg";

interface IPresentReceivedItem {
  id: number;
  title?: string;
  authorNickname?: string;
  authorEventLevelBadgeImagePath?: string;
  illustratorNickname?: string;
  hasGle: boolean;
  coverImagePath?: string;
  amount: number;
  updatedDate: string;
  expirationDate?: string;
  rentalExpiredDate?: string;
  rentalRemaining?: number | null;
  waitForFreeYn?: "Y" | "N";
  hasProduct: boolean;
}

const formatRemainingTime = (
  rentalRemaining?: number | null,
  rentalExpiredDate?: string
) => {
  // Prefer using rentalRemaining (seconds) if available
  if (rentalRemaining !== null && rentalRemaining !== undefined) {
    const days = Math.floor(rentalRemaining / (60 * 60 * 24));
    const hours = Math.floor((rentalRemaining % (60 * 60 * 24)) / (60 * 60));

    if (days <= 0 && hours <= 0) {
      return "";
    }

    return (
      <>
        대여{" "}
        <span className="">
          {String(days).padStart(2, "0")}일 {String(hours).padStart(2, "0")}시간
        </span>{" "}
        남음
      </>
    );
  }

  // Fallback to rentalExpiredDate if rentalRemaining is not available
  if (rentalExpiredDate) {
    const now = new Date();
    const endTime = new Date(rentalExpiredDate);
    const diff = endTime.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days <= 0 && hours <= 0) {
      return "";
    }

    return (
      <>
        대여{" "}
        <span className="">
          {String(days).padStart(2, "0")}일 {String(hours).padStart(2, "0")}시간
        </span>{" "}
        남음
      </>
    );
  }

  return "";
};

const PresentReceived = () => {
  const [selectedTab, setSelectedTab] = useState<"received" | "used">(
    "received"
  );

  const [selectedCheck, setSelectedCheck] = useState<"all" | "limit">("all");

  const { data, isLoading } = useSelectUserGiftBookHistory(selectedTab);

  const allPresents: IPresentReceivedItem[] =
    data?.data?.map((item: IUserGiftBookHistoryItem) => ({
      id: item.id,
      title: item.product?.title || "",
      authorNickname: item.product?.author_name || "",
      authorEventLevelBadgeImagePath:
        item.product?.badge?.authorEventLevelBadgeImagePath || "",
      illustratorNickname: "",
      hasGle: true,
      coverImagePath: item.product?.thumbnail_url || "",
      amount: item.amount,
      updatedDate: item.product?.updated_date || "",
      expirationDate: item.rental_expired_date || "",
      rentalExpiredDate: item.rental_expired_date || "",
      rentalRemaining: item.rental_remaining,
      waitForFreeYn: item.product?.badge?.waitForFreeYn || "N",
      hasProduct: item.product !== null,
    })) || [];

  // Filter based on selectedCheck (only apply for "received" tab)
  const presents =
    selectedTab === "received" && selectedCheck === "limit"
      ? allPresents.filter((present) => {
          if (!present.expirationDate) return false;
          const expirationDate = new Date(present.expirationDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
          return expirationDate > today;
        })
      : allPresents;
  return (
    <div className="w-full h-full flex flex-col px-20pxr">
      <header className="flex justify-between py-16pxr">
        <h1 className="text-18pxr md:text-24pxr font-bold">받은 선물함</h1>
      </header>
      <div className="pb-4 pt-2">
        <Tab
          tabs={[
            {
              label: "받은 선물",
              value: "received",
            },
            {
              label: "사용한 선물",
              value: "used",
            },
          ]}
          style="black"
          activeTab={selectedTab}
          onTabChange={(value) => setSelectedTab(value as "received" | "used")}
        />
      </div>
      {selectedTab === "received" && (
        <div className="border-b pb-4">
          <Tab
            tabs={[
              {
                label: "전체보기",
                value: "all",
              },
              {
                label: "유효기간 있는 내역만 보기",
                value: "limit",
              },
            ]}
            style="check"
            activeTab={selectedCheck}
            onTabChange={(value) => setSelectedCheck(value as "all" | "limit")}
          />
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center items-center py-40pxr">
          <Spinner size={40} />
        </div>
      ) : (
        presents?.map((present: any) => (
          <PresentReceivedItem
            key={present.id}
            {...present}
            type={selectedTab}
          />
        ))
      )}
    </div>
  );
};

const PresentReceivedItem = (
  props: IPresentReceivedItem & { type: "received" | "used" }
) => {
  console.log("props.hasProduct", props.expirationDate);
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-16pxr py-16pxr border-b border-light-gray-300 items-center">
        {props.hasProduct && (
          <div className="relative w-[100px] h-[140px]">
            <Image
              src={props.coverImagePath || DEFAULT_PRODUCT_IMAGE}
              alt="작품 표지"
              fill
              className="rounded-lg object-cover"
            />
          </div>
        )}
        <div className="flex flex-col flex-1">
          {props.hasProduct && props.title && (
            <>
              <h3 className="text-16pxr font-semibold">{props.title}</h3>
              {props.authorNickname && (
                <div className="flex items-center gap-8pxr mt-1">
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
              )}
            </>
          )}
          {props.type === "used" ? (
            <span className="text-12pxr text-dark-gray-400 mt-2">
              {props.updatedDate
                ? getFormattingDate(props.updatedDate || "", "YYYY.MM.DD")
                : ""}
            </span>
          ) : (
            <div className="flex items-center gap-4pxr mt-2">
              <Image
                src="/images/discount.svg"
                width={16}
                height={16}
                alt="대여권"
              />
              <span className="text-13pxr">대여권 {props.amount}장</span>
            </div>
          )}
        </div>
        {props.type === "used" ? (
          props.waitForFreeYn === "Y" ? (
            <div className="text-12pxr flex flex-col text-dark-gray-700 whitespace-pre-line text-right">
              {`기다리면 무료`}
              {!!formatRemainingTime(
                props.rentalRemaining,
                props.rentalExpiredDate
              ) && (
                <div className="flex items-center gap-5pxr">
                  <Clock className="w-[12px] h-[12px] text-dark-gray-100" />
                  <span className="text-11pxr text-dark-gray-200">
                    {formatRemainingTime(
                      props.rentalRemaining,
                      props.rentalExpiredDate
                    )}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col flex-end">
              <div className="flex items-center flex-row justify-end gap-4pxr">
                <Image
                  src="/images/discount.svg"
                  width={16}
                  height={16}
                  alt="대여권"
                />
                <span className="text-13pxr">대여권 {props.amount}장</span>
              </div>
              {!!formatRemainingTime(
                props.rentalRemaining,
                props.rentalExpiredDate
              ) && (
                <div className="flex items-center gap-5pxr">
                  <Clock className="w-[12px] h-[12px] text-dark-gray-100" />
                  <span className="text-11pxr text-dark-gray-200">
                    {formatRemainingTime(
                      props.rentalRemaining,
                      props.rentalExpiredDate
                    )}
                  </span>
                </div>
              )}
            </div>
          )
        ) : props.expirationDate ? (
          <div className="flex flex-col text-11pxr text-right text-dark-gray-400">
            <span>유효기간</span>
            <span className="text-black-100">
              {getFormattingDate(props.expirationDate, "YYYY.MM.DD")}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PresentReceived;
