"use client";

import NoticeDetail from "@/components/customer-service/NoticeDetail";

const Page = ({ params }: { params: { noticeId: string } }) => {
  return (
    <div className="flex-col md:mx-auto md:px-0 w-full max-w-[1120px] mx-auto pt-10">
      <NoticeDetail noticeId={params.noticeId} />
    </div>
  );
};

export default Page;
