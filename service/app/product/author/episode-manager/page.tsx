"use client";

import Button from "@/components/common/Button";

const page = () => {
  return (
    <div className="w-full h-auto mt-[-12px] mb-[-102px] md:mb-0">
      <div className="flex flex-col w-full max-w-[1120px] mx-auto">
        {/* <ProductCoverArea /> */}
      </div>
      <div className="sticky px-5 pb-5 bottom-0 w-full bg-white mt-8 rounded-t-lg shadow-xl pt-4 flex md:hidden gap-2">
        <Button variant="secondary">
          독자 알림<span className="text-gray-400"> (0회 남음)</span>
        </Button>
        <Button className="flex-1">회차/공지 쓰기</Button>
      </div>
    </div>
  );
};

export default page;
