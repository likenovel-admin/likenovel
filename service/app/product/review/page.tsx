"use client";

import ReviewList from "@/components/review/ReviewList";
import ReviewReplyList from "@/components/review/ReviewReplyList";
import { GenreProvider } from "@/contexts/GenreContext";

const Page = () => {
  return (
    <GenreProvider>
      <div className="relative bg-white h-full max-w-[1120px] mx-auto flex flex-col items-center">
        <ReviewList />
        <ReviewReplyList />
      </div>
    </GenreProvider>
  );
};

export default Page;
