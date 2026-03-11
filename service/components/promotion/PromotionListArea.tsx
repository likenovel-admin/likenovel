import {
  useGetProducts69Pass,
  useGetProductsAdminGift,
  useGetProductsWaitForFree,
} from "@/app/api/query/product";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import Image from "next/image";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";

interface IPromotionListAreaProps {
  type: string;
}

function transformPromotionData(apiData: Record<string, any[]> | undefined) {
  if (!apiData) return [];

  const groupedByDate: Record<string, any[]> = {};

  Object.entries(apiData).forEach(([dateKey, products]) => {
    const date = new Date(dateKey);
    const formattedDate = `${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}월 ${String(date.getDate()).padStart(2, "0")}일`;

    if (!groupedByDate[formattedDate]) {
      groupedByDate[formattedDate] = [];
    }

    products.forEach((product: any) => {
      groupedByDate[formattedDate].push({
        id: product.productId,
        bookCoverImage:
          product.image?.coverImagePath || "/images/test/temp-cover.jpeg",
        title: product.title,
        authorNickname: product.authorNickname,
        badge: product.badge || {},
        properties: product.properties || {},
      });
    });
  });

  const sortedDates = Object.entries(groupedByDate).sort(([a], [b]) => {
    const currentYear = new Date().getFullYear();
    const dateA = new Date(
      a.replace(/월|일/g, "").replace(" ", "/") + `/${currentYear}`
    );
    const dateB = new Date(
      b.replace(/월|일/g, "").replace(" ", "/") + `/${currentYear}`
    );
    return dateB.getTime() - dateA.getTime();
  });

  return sortedDates.map(([date, list]) => ({ date, list }));
}

const PromotionListArea = ({ type }: IPromotionListAreaProps) => {
  const { data: waitForFreeData } = useGetProductsWaitForFree(
    type === "waitForFree"
  );
  const { data: sixtyNinePassData } = useGetProducts69Pass(type === "69");
  const { data: adminGiftData } = useGetProductsAdminGift(type === "gift");

  let displayData: any[] = [];

  if (type === "waitForFree") {
    displayData = transformPromotionData(waitForFreeData?.data);
  } else if (type === "69") {
    displayData = transformPromotionData(sixtyNinePassData?.data);
  } else if (type === "gift") {
    displayData = transformPromotionData(adminGiftData?.data);
  }

  return (
    <div>
      {displayData.length === 0 ? (
        <div className="flex justify-center items-center py-20 text-gray-400 text-14pxr md:text-16pxr">
          프로모션 대상 작품이 없습니다
        </div>
      ) : (
        displayData.map((item: any) => (
          <DateListItem key={item.date || item.id} {...item} />
        ))
      )}
    </div>
  );
};

interface IDateListItem {
  date: string;
  list: IListItem[];
}

const DateListItem = ({ date, list }: IDateListItem) => {
  return (
    <div className="text-16pxr md:text-18pxr font-semibold border-b md:border-0 pb-10">
      <div className="flex justify-between items-center my-3 md: mt-6">
        <div>{date}</div>
        <div className="text-11pxr md:text-13pxr text-dark-gray-300">
          {list.length}개의 작품
        </div>
      </div>
      <ul className="grid gap-3 grid-cols-3 md:flex md:flex-wrap md:gap-5">
        {list.map((item) => (
          <li key={item.id}>
            <ListItem {...item} />
          </li>
        ))}
      </ul>
    </div>
  );
};

interface IListItem {
  bookCoverImage: string;
  title: string;
  authorNickname: string;
  id: number;
  badge: {
    sixNinePathYn: "Y" | "N";
    waitingForFreeYn: "Y" | "N";
    waitForFreeYn: "Y" | "N";
    freeEpisodeTicketCount: number;
    timepassFromTo: string;
  };
  properties?: { latestEpisodeDate: string };
}

const ListItem = ({
  authorNickname,
  badge,
  bookCoverImage,
  id,
  title,
  properties,
}: IListItem) => {
  const handleClick = () => {
    window.location.href = `/product/${id}`;
  };

  return (
    <div
      className="relative w-[100%] md:w-[140px] cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative aspect-[165/253] rounded-xl overflow-hidden">
        <Image src={bookCoverImage} alt={title} fill />
        <div className="z-10 absolute bottom-[2px] left-[2px] flex gap-1">
          <SquareBadge
            type={getPromotionBadgeType(
              badge?.waitForFreeYn || badge?.waitingForFreeYn,
              badge?.freeEpisodeTicketCount,
              badge?.timepassFromTo,
              badge?.sixNinePathYn
            )}
            freeEpisodeNumber={badge?.freeEpisodeTicketCount}
            timePassValue={badge?.timepassFromTo}
          />
          {getIsNewEpisode(properties?.latestEpisodeDate || "") && (
            <SquareBadge type="up" />
          )}
        </div>
      </div>
      <div className="text-12pxr md:text-16pxr font-medium mt-1.5 line-clamp-2">
        {title}
      </div>
      <UserNickname
        textStyle="text-10pxr md:text-13pxr text-gray-400"
        badgeStyle="w-3 h-3 md:w-4 md:h-4"
        userNickname={authorNickname}
        product={{ badge } as any}
      />
    </div>
  );
};

export default PromotionListArea;
