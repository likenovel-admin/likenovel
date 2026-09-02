import { useSelectViewerPath } from "@/app/api/query/episode";
import AuthorNote from "@/components/viewer/AuthorNote";
import NextEpisode from "@/components/viewer/NextEpisode";
import PromoBanner from "@/components/viewer/PromoBanner";
import RecommendedProduct from "@/components/viewer/RecommendedProduct";
import ReviewCard from "@/components/viewer/ReviewCard";

interface LastPageProps {
  currentEpisodeId?: number;
  handleCommentState: (prefillContent?: string) => void;
}

export default function LastPage({
  currentEpisodeId,
  handleCommentState,
}: LastPageProps) {
  const { data: viewerData } = useSelectViewerPath(currentEpisodeId || 0);
  return (
    <div className="mt-[28px] mb-[60px] flex flex-col items-center">
      <div className="w-full md:w-[839px] px-16pxr md:px-0">
        <AuthorNote episodeId={currentEpisodeId || 0} />
        {currentEpisodeId && (
          <NextEpisode currentEpisodeId={currentEpisodeId} />
        )}
        <ReviewCard
          productId={viewerData?.data?.product_id}
          episodeId={currentEpisodeId}
          commentOpenYn={viewerData?.data?.commentOpenYn}
          handleCommentState={handleCommentState}
        />
        <PromoBanner />
        {viewerData?.data?.product_id && (
          <RecommendedProduct productId={viewerData.data.product_id} />
        )}
      </div>
    </div>
  );
}
