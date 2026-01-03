import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { ChangeEvent, useState } from "react";
import Button from "../common/Button";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";
import Check from "/public/images/check.svg";
interface IPromotionListArea {
  type: string;
}
const PromotionListArea = ({ type }: IPromotionListArea) => {
  const [seletedItems, setSeletedItems] = useState<number[]>([]);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const id = parseInt(event.target.value, 10);
    if (event.target.checked) {
      setSeletedItems([...seletedItems, id]);
    } else {
      setSeletedItems(seletedItems.filter((item) => item !== id));
    }
  };
  const { data } = useQuery({
    queryKey: ["voteList"],
    queryFn() {
      return [
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
      ];
    },
  });
  return (
    <div className={`${type !== "progress" ? "mb-20" : ""} mt-4 md:mt-10`}>
      <ul className="grid gap-x-3 gap-y-10 grid-cols-3 md:flex md:flex-wrap md:gap-5">
        {data?.map((item) => (
          <li key={item.id}>
            <ListItem
              type={type}
              key={item.id}
              {...item}
              onChange={handleChange}
              checked={seletedItems.includes(item.id)}
            />
          </li>
        ))}
      </ul>
      {type === "progress" && (
        <div className="sticky md:relative bottom-0 pb-3 bg-white z-10 w-full md:mt-10 md:border-t-8 md:border-t-light-gray-100 flex justify-center">
          <Button className="mt-4 md:mt-8 w-full md:w-[276px] h-[50px] text-16pxr font-semibold">
            {seletedItems.length}개 선택 투표하기
          </Button>
        </div>
      )}
    </div>
  );
};

interface IListItem {
  bookCoverImage: string;
  title: string;
  authorNickname: string;
  id: number;
  type: string;
  badge: {
    authorEventLevelBadgeImagePath: string;
  };
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const ListItem = ({
  authorNickname,
  badge,
  bookCoverImage,
  id,
  title,
  onChange,
  checked,
  type,
}: IListItem) => {
  return (
    <label className="cursor-pointer">
      <div className="relative w-[100%] md:w-[140px] ">
        <div className="relative aspect-[165/253] rounded-xl overflow-hidden">
          <Image src={bookCoverImage} alt={title} fill />
          <div className="z-10 absolute bottom-[2px] left-[2px] flex gap-1">
            <SquareBadge
              type={["waitForFree", "timePass"]}
              freeEpisodeNumber={4}
              timePassValue={"6-1"}
              size="small"
            />{" "}
            <SquareBadge type={"up"} />
          </div>
        </div>
        <div className="text-12pxr md:text-16pxr font-medium mt-1.5 line-clamp-2">
          {title}
        </div>
        <UserNickname
          textStyle="text-10pxr md:text-13pxr text-gray-400"
          badgeStyle="w-3 h-3 md:w-4 md:h-4"
          userNickname={authorNickname}
          hasGle
          product={{ badge } as any}
        />
      </div>
      {type === "progress" ? (
        <>
          <input
            type="checkbox"
            className="hidden"
            value={id}
            checked={checked}
            onChange={(event) => onChange(event)}
          />
          <div
            className={`border rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-4 ${
              checked ? "bg-primary-100" : "border-gray-200"
            }`}
          >
            <Check
              className={`w-3 h-3 ${checked ? "text-white" : "text-gray-400"}`}
            />
          </div>
        </>
      ) : null}
    </label>
  );
};

export default PromotionListArea;
