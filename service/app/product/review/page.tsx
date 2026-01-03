"use client";

import { useSelectPanels } from "@/app/api/query/banner";
import Carousel from "@/components/main/Carousel";
import ReviewList from "@/components/review/ReviewList";
import ReviewReplyList from "@/components/review/ReviewReplyList";
import { GenreProvider } from "@/contexts/GenreContext";

const Page = () => {
  const { data } = useSelectPanels({ division: "review" });

  return (
    <GenreProvider>
      <div className="relative bg-white h-full max-w-[1120px] mx-auto flex flex-col items-center">
        <div className="bg-black-100 h-[385px] w-[100vw] absolute top-[-20px]"></div>
        <Carousel primaryPanels={data?.data ?? []} />
        <ReviewList />
        <ReviewReplyList />
      </div>
    </GenreProvider>
  );
};

export default Page;
