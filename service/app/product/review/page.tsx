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
      <div className="w-full flex flex-col">
        <Carousel primaryPanels={data?.data ?? []} />
        <div className="bg-white h-full max-w-[1120px] mx-auto w-full flex flex-col items-center">
          <ReviewList />
          <ReviewReplyList />
        </div>
      </div>
    </GenreProvider>
  );
};

export default Page;
