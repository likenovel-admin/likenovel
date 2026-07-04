import { useSelectCommentByEpisode } from "@/app/api/query/comment";
import CommentList from "@/components/viewer/CommentList";
import RatingForm from "@/components/viewer/RatingForm";
import { SHOW_PRODUCT_EVALUATION_SURFACE } from "@/constants/common";
import { Dispatch, SetStateAction, useMemo, useState } from "react";

interface RatingProps {
  productId?: number;
  episodeId: number;
  commentOpenYn?: "Y" | "N";
  evaluationOpenYn?: "Y" | "N";
  setModalType: Dispatch<
    SetStateAction<"episode" | "setting" | "rating" | null>
  >;
}

export default function Rating({
  productId,
  episodeId,
  commentOpenYn = "Y",
  evaluationOpenYn = "Y",
  setModalType,
}: RatingProps) {
  const [activeTab, setActiveTab] = useState("recommend");

  // Only fetch to get comment count, will be used by CommentList too (shared cache)
  const { data: episodeComments } = useSelectCommentByEpisode(
    productId || 0,
    episodeId || 0,
    1,
    10,
    activeTab
  );

  const commentTotalCount = useMemo(() => {
    return episodeComments?.pages?.[0]?.data?.commentTotalCount || 0;
  }, [episodeComments]);

  return (
    <div
      className={`mb-[60px] flex flex-col items-center ${
        SHOW_PRODUCT_EVALUATION_SURFACE ? "mt-[109px]" : "mt-24pxr"
      }`}
    >
      <div className="w-full md:w-[784px] px-16pxr md:px-0">
        <RatingForm
          productId={productId}
          episodeId={episodeId}
          commentTotalCount={commentTotalCount}
          commentOpenYn={commentOpenYn}
          evaluationOpenYn={evaluationOpenYn}
        />
        <CommentList
          setModalType={setModalType}
          pageType="episode"
          productId={productId}
          episodeId={episodeId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasEpisode
          hasAuthorFixedComment
        />
      </div>
    </div>
  );
}
