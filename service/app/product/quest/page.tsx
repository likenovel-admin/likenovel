"use client";

import QuestList from "@/components/quest/QuestList";
import QuestNotice from "@/components/quest/QuestNotice";

const Page = () => {
  return (
    <div className="flex flex-col w-full h-full bg-gray-100 md:bg-white md:items-center">
      <div className="mb-2 text-xl font-bold p-4 text-center bg-white md:text-2xl">
        퀘스트
      </div>
      <QuestList />
      <QuestNotice />
    </div>
  );
};

export default Page;
