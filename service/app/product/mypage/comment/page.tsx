"use client";

import {
  useSelectUserComments,
  useSelectUserCommentsBlock,
} from "@/app/api/query/mypage/user";
import Spinner from "@/components/common/Spinner";
import Tab from "@/components/common/Tab";
import BlockList from "@/components/mypage/BlockList";
import CommentList from "@/components/mypage/CommentList";
import { useState } from "react";

const Page = () => {
  const [type, setType] = useState("comment");
  const { data, isLoading } = useSelectUserComments();
  const { data: blockData, isLoading: isBlockLoading } =
    useSelectUserCommentsBlock();

  return (
    <div className="mx-4 md:mx-0">
      <div className="md:text-24pxr text-18pxr font-semibold pt-6 pb-3 md:pt-11 md:pb-8">
        내 댓글 <span>{data?.data?.length ?? 0}</span>
      </div>
      <Tab
        activeTab={type}
        onTabChange={setType}
        tabs={[
          {
            label: "댓글",
            value: "comment",
          },
          {
            label: "차단 관리",
            value: "block",
          },
        ]}
        style="black"
      />
      {type === "comment" &&
        (isLoading ? <Spinner /> : <CommentList comments={data?.data || []} />)}
      {type === "block" &&
        (isBlockLoading ? (
          <Spinner />
        ) : (
          <BlockList blocks={blockData?.data || []} />
        ))}
    </div>
  );
};

export default Page;
