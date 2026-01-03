import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

const VoteHonorListArea = () => {
  const { data } = useQuery({
    queryKey: ["voteHonorList"],
    queryFn() {
      return [
        {
          rank: 1,
          nickname: "로스티플",
          profileImagePath: "/images/test/pic1.png",
          levelImage: ["/images/new.png", "/images/test/level.svg"],
        },
        {
          rank: 2,
          nickname: "닉네임2",
          profileImagePath: "/images/test/pic2.png",
          levelImage: ["/images/new.png", "/images/test/level.svg"],
        },
        {
          rank: 3,
          nickname: "닉네임3",
          profileImagePath: "/images/test/pic2.png",
          levelImage: ["/images/new.png", "/images/test/level.svg"],
        },
        {
          rank: 4,
          nickname: "닉네임4",
          profileImagePath: "/images/test/pic2.png",
          levelImage: ["/images/new.png", "/images/test/level.svg"],
        },
        {
          rank: 5,
          nickname: "닉네임5",
          profileImagePath: "/images/test/pic1.png",
          levelImage: ["/images/new.png", "/images/test/level.svg"],
        },
        {
          rank: 6,
          nickname: "닉네임6",
          profileImagePath: "/images/test/pic1.png",
          levelImage: ["/images/new.png", "/images/test/level.svg"],
        },
        {
          rank: 7,
          nickname: "닉네임7",
          profileImagePath: "/images/test/pic1.png",
          levelImage: ["/images/new.png", "/images/test/level.svg"],
        },
        {
          rank: 8,
          nickname: "닉네임8",
          profileImagePath: "/images/test/pic1.png",
          levelImage: ["/images/new.png", "/images/test/level.svg"],
        },
        {
          rank: 9,
          nickname: "닉네임9",
          profileImagePath: "/images/test/pic2.png",
          levelImage: ["/images/new.png", "/images/test/level.svg"],
        },
        {
          rank: 10,
          nickname: "닉네임10",
          profileImagePath: "/images/test/pic2.png",
          levelImage: ["/images/new.png", "/images/test/level.svg"],
        },
      ];
    },
  });
  return (
    <div className="bg-light-gray-100 mx-[-16px] p-5 md:p-0 md:pt-10">
      <div className="text-20pxr md:text-24pxr font-bold mb-4 md:mb-6 md:mx-2">
        금주 명예의 전당
      </div>
      <ul className="grid gap-3 md:gap-0 grid-cols-2 md:flex md:flex-wrap">
        {data?.map((item) => (
          <VoteHonorItem key={item.rank} {...item} />
        ))}
      </ul>
    </div>
  );
};

interface IVoteHonorItem {
  rank: number;
  nickname: string;
  levelImage: string[];
  profileImagePath: string;
}
const VoteHonorItem = ({
  rank,
  nickname,
  levelImage,
  profileImagePath,
}: IVoteHonorItem) => {
  return (
    <div className="p-4 md:p-0 md:w-[280px] md:h-[232px] md:flex md:flex-col md:items-center bg-white md:bg-transparent md:bg-[url('/images/item-background.svg')] md:bg-no-repeat md:bg-center md:bg-contain rounded-xl md:rounded-none flex gap-3">
      <div className="w-10 h-10 min-w-10 min-h-10 md:w-20 md:h-20 md:mt-3 overflow-hidden relative rounded-full">
        <Image
          src={profileImagePath}
          alt="레벨 이미지"
          fill
          className="w-10 h-10"
        />
      </div>
      <div className="flex flex-col gap-1 w-full md:px-10 px-0 items-center">
        <div className="font-medium text-14pxr md:text-18pxr border-b w-full text-center mb-4 pb-4">
          {nickname}
        </div>
        <div className="flex gap-1 md:gap-2.5">
          {levelImage.map((image) => (
            <div key={image} className="relative w-4 h-4 md:w-6 md:h-6">
              <Image src={image} alt="레벨 이미지" fill />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoteHonorListArea;
