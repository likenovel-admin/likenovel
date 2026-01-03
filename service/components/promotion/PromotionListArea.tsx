import {
  useGetProducts69Pass,
  useGetProductsWaitForFree,
} from "@/app/api/query/product";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";

interface IPromotionListAreaProps {
  type: string;
}

const PromotionListArea = ({ type }: IPromotionListAreaProps) => {
  const { data: waitForFreeData } = useGetProductsWaitForFree(
    type === "waitForFree"
  );
  const { data: sixtyNinePassData } = useGetProducts69Pass(type === "69");

  const { data: mockData } = useQuery({
    queryKey: ["promotionList"],
    queryFn() {
      return [
        {
          date: "09월 07일",
          list: [
            {
              id: 1,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "판타지 세계의 무당이 되었다.무당이 되었다.무당이 되었다.",
              authorNickname: "로스티플",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 2,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "이세계에서 살아남기",
              authorNickname: "작가 A",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 3,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "마법사의 제자",
              authorNickname: "작가 B",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
          ],
        },
        {
          date: "09월 06일",
          list: [
            {
              id: 4,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "용사의 귀환",
              authorNickname: "작가 C",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 5,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "드래곤의 후예",
              authorNickname: "작가 D",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 6,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "기사의 맹세",
              authorNickname: "작가 E",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
          ],
        },
        {
          date: "09월 05일",
          list: [
            {
              id: 7,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "마왕의 부활",
              authorNickname: "작가 F",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 8,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "성검의 주인",
              authorNickname: "작가 G",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 9,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "어둠의 군주",
              authorNickname: "작가 H",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
          ],
        },
        {
          date: "09월 04일",
          list: [
            {
              id: 10,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "빛의 전사",
              authorNickname: "작가 I",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 11,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "어둠의 전사",
              authorNickname: "작가 J",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 12,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "시간의 마법사",
              authorNickname: "작가 K",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 123,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "시간의 마법사",
              authorNickname: "작가 K",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 124,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "시간의 마법사",
              authorNickname: "작가 K",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 125,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "시간의 마법사",
              authorNickname: "작가 K",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 126,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "시간의 마법사",
              authorNickname: "작가 K",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 127,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "시간의 마법사",
              authorNickname: "작가 K",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 128,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "시간의 마법사",
              authorNickname: "작가 K",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 912,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "시간의 마법사",
              authorNickname: "작가 K",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
          ],
        },
        {
          date: "09월 03일",
          list: [
            {
              id: 13,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "공간의 마법사",
              authorNickname: "작가 L",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 14,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "차원의 여행자",
              authorNickname: "작가 M",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
            {
              id: 15,
              bookCoverImage: "/images/test/temp-cover.jpeg",
              title: "별의 수호자",
              authorNickname: "작가 N",
              badge: {
                authorEventLevelBadgeImagePath: "/images/test/level.svg",
              },
            },
          ],
        },
      ];
    },
  });

  // Transform API data to match mock data structure
  let displayData: any[] = [];

  if (type === "waitForFree" && waitForFreeData?.data) {
    // Data is already grouped by date, transform to display format
    const groupedByDate: Record<string, any[]> = {};

    Object.entries(waitForFreeData.data).forEach(([dateKey, products]) => {
      // Parse the date from the API response (format: "2025-08-19T06:50:29")
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

    // Sort dates and transform to match mock data structure
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

    displayData = sortedDates.map(([date, list]) => ({
      date,
      list: list as any[],
    }));
  } else if (type === "69" && sixtyNinePassData?.data) {
    // Data is already grouped by date, transform to display format
    const groupedByDate: Record<string, any[]> = {};

    Object.entries(sixtyNinePassData.data).forEach(([dateKey, products]) => {
      // Parse the date from the API response (format: "2025-08-19T06:50:29")
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

    // Sort dates and transform to match mock data structure
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

    displayData = sortedDates.map(([date, list]) => ({
      date,
      list: list as any[],
    }));
  } else {
    // Use mock data for other tabs
    displayData = [];
  }

  return (
    <div>
      {displayData?.map((item: any) => (
        <DateListItem key={item.date || item.id} {...item} />
      ))}
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
          {/* <SquareBadge
            type={["waitForFree", "timePass"]}
            freeEpisodeNumber={4}
            timePassValue={"6-1"}
            size="small"
          />{" "}
          <SquareBadge type={"up"} /> */}
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
