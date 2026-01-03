import { useSelectEvents } from "@/app/api/query/event";
import useSearchModalStore from "@/store/searchModalStore";
import { IEvent } from "@/types";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import ArrowRightSmall from "/public/images/arrow-right-small.svg";
import GiftBox from "/public/images/gift-box.svg";

interface Props {
  pageType?: "search" | "result";
  events?: IEvent[];
}
const OngoingEvent = ({ events = [], pageType = "search" }: Props) => {
  const router = useRouter();
  const { setIsOpen } = useSearchModalStore();
  const { data, isLoading } = useSelectEvents("N", pageType === "result");

  const displayedEvents = useMemo(() => {
    const eventData = pageType === "result" ? events : data?.data || [];
    return pageType === "search"
      ? eventData.slice(0, 3)
      : eventData.slice(0, 4);
  }, [data?.data, events, pageType]);

  return (
    <div className="w-full">
      <div className="flex justify-between">
        <div className="flex items-center gap-6pxr pl-16pxr md:pl-0">
          <GiftBox />
          <span className="font-semibold">진행중인 이벤트</span>
        </div>
        <button
          className="flex items-center gap-8pxr p-2"
          onClick={() => {
            router.push("/product/event");
            setIsOpen(false);
          }}
        >
          <span className="text-dark-gray-300 text-13pxr font-medium pr-16pxr md:pr-0">
            더보기
          </span>
          <ArrowRightSmall className="text-dark-gray-300 hidden md:block" />
        </button>
      </div>
      <div
        className={`${
          pageType === "search"
            ? "w-full flex gap-10pxr pl-16pxr md:pl-0 scroll-hidden overflow-x-auto md:grid md:grid-cols-3"
            : "w-full flex gap-10pxr pl-16pxr md:pl-0 scroll-hidden overflow-x-auto md:grid md:grid-cols-3"
        }`}
      >
        {displayedEvents.map((event, index) => (
          <button
            key={event.id || index}
            onClick={() => {
              router.push(`/product/event/${event.id}`);
              setIsOpen(false);
            }}
          >
            {pageType === "search" ? (
              <img
                src={event.thumbnail_image_path || ""}
                alt={event.eventTitle || "진행중인 이벤트"}
                className="object-cover mt-10pxr min-w-[167px] h-[90px] md:w-[208px] md:h-[133px] rounded-[10px]"
              />
            ) : (
              <img
                src={event.thumbnail_image_path || ""}
                alt={event.eventTitle || "진행중인 이벤트"}
                width={260}
                height={140}
                className="object-cover mt-10pxr min-w-[167px] w-[260px] h-[140px] rounded-[10px] px-2"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
export default OngoingEvent;
