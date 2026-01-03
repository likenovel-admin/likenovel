"use client";

import { useSelectEvents } from "@/app/api/query/event";
import Spinner from "@/components/common/Spinner";
import { IEvent } from "@/types";
import { getFormattingDate } from "@/utils/getFormattingDate";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import RoundBadge from "../common/RoundBadge";
import Tab from "../common/Tab";

const EventList = () => {
  const [selectedTab, setSelectedTab] = useState<"progress" | "end">(
    "progress"
  );

  const { data, isLoading, isFetching, refetch } = useSelectEvents(
    selectedTab === "progress" ? "N" : "Y"
  );

  const events = data?.data;

  useEffect(() => {
    refetch();
  }, [selectedTab]);

  return (
    <div className="w-full h-full md:max-w-[1120px] mx-auto flex flex-col md:px-0 px-4">
      <header className="flex justify-between py-16pxr">
        <h1 className="text-18pxr md:text-24pxr font-bold">이벤트</h1>
      </header>
      <div className="pb-4 pt-2">
        <Tab
          tabs={[
            {
              label: "진행중인 이벤트",
              value: "progress",
            },
            {
              label: "종료된 이벤트",
              value: "end",
            },
          ]}
          style="black"
          activeTab={selectedTab}
          onTabChange={(value) => setSelectedTab(value as "progress" | "end")}
        />
      </div>
      {isLoading || isFetching ? (
        <div className="w-full mt-70pxr flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-5">
            {events?.map((event) => (
              <EventItem key={event.id} {...event} type={selectedTab} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const EventItem = memo((props: IEvent & { type: "progress" | "end" }) => {
  const router = useRouter();

  const dateRange = props.end_date
    ? `${getFormattingDate(props.start_date, "MM.DD")} ~ ${getFormattingDate(
        props.end_date,
        "MM.DD"
      )}`
    : `${getFormattingDate(props.start_date, "MM.DD")} ~`;

  const now = new Date();
  const endDate = new Date(props.end_date);
  const isEnded = endDate < now;

  // Calculate days remaining or days passed
  const daysDifference = Math.floor(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysDisplay = isEnded
    ? Math.abs(daysDifference) // Days after end (positive number)
    : daysDifference; // Days remaining (can be negative if ended)

  return (
    <button
      className="w-full h-full flex flex-col relative cursor-pointer"
      onClick={() => router.push(`/product/event/${props.id}`)}
    >
      <div className="relative w-full h-auto aspect-[256/140] rounded-lg overflow-hidden">
        <Image src={props.thumbnail_image_path} alt="event" fill />
      </div>
      <div className="text-left">
        <span className="text-16pxr font-semibold mt-12pxr line-clamp-1">
          {props.title}
        </span>
        <span className="text-13pxr mt-4pxr text-dark-gray-400">
          {dateRange}
        </span>
      </div>
      <div className="mt-21pxr">
        {props.type === "progress" ? (
          <>
            {props.end_date ? (
              <RoundBadge
                type="custom"
                color={isEnded ? "bg-[#FFEFEC]" : "bg-blue-100"}
                textColor={isEnded ? "text-red-100" : "text-primary-100"}
                text={`D-${daysDisplay}`}
                className="h-24pxr w-44pxr text-13pxr font-semibold"
              />
            ) : (
              <RoundBadge
                type="custom"
                color="bg-blue-100"
                textColor="text-primary-100"
                text={"상시진행"}
                className="h-24pxr w-61pxr text-13pxr font-semibold"
              />
            )}
          </>
        ) : (
          <RoundBadge
            type="custom"
            color="bg-[#F0F1F3]"
            textColor="text-[#888B92]"
            text={"종료"}
            className="h-24pxr w-39pxr text-13pxr font-semibold"
          />
        )}
      </div>
    </button>
  );
});

EventItem.displayName = "EventItem";

export default EventList;
