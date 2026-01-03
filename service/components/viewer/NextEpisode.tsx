import { useSelectViewerPath, useSelectNextEpisodeInfo } from "@/app/api/query/episode";
import { useRouter } from "next/navigation";
import ArrowRight from "/public/images/arrow-right-medium.svg";
import useModalStore from "@/store/modalStore";
import { TYPE_MODAL } from "@/constants/common";

interface NextEpisodeProps {
  currentEpisodeId: number;
}

export default function NextEpisode({ currentEpisodeId }: NextEpisodeProps) {
  const router = useRouter();
  const { setTypeModal } = useModalStore();

  const { data } = useSelectViewerPath(currentEpisodeId);
  const { data: nextEpisodeData } = useSelectNextEpisodeInfo(data?.data?.nextEpisodeId || 0);

  if (!data?.data?.nextEpisodeId) {
    return null;
  }

  const handleNextEpisode = () => {
    const episode = data?.data;
    const productTitle = data?.data?.title;

    // Check if next episode is paid and not owned/rented or rental has expired
    if (
      episode?.nextEpisodePriceType === "paid" &&
      (!episode.nextEpisodeRentalRemaining ||
        (episode.nextEpisodeRentalRemaining?.days === 0 &&
          episode.nextEpisodeRentalRemaining?.hours === 0)) &&
      episode.nextEpisodeOwnType !== "own"
    ) {
      // Show rent/own modal if not owned or rental expired
      setTypeModal(TYPE_MODAL.RENT_OWN, {
        title: `${productTitle} ${episode.nextEpisodes}화`,
        episodeId: episode.nextEpisodeId,
        productId: episode.product_id,
      });
      return;
    }

    // Navigate to next episode if owned or rental is valid
    router.push(`/viewer/${data.data.nextEpisodeId}`);
  };

  return (
    <section className="w-full rounded-[20px] border border-line bg-card/60 px-[22px] py-[21px] sm:p-5 mt-[10px]">
      <div className="flex items-center gap-4">
        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-white/10">
          <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-500">다음화</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-base font-semibold text-[#111317] tracking-[-2%]">
            다음화 보기
          </p>
          <p className="mt-[9px] text-sm font-normal tracking-[-2%] text-[#4D5159] line-clamp-2">
            {nextEpisodeData?.data?.title || "다음 에피소드"}
          </p>
        </div>

        <button
          className="rounded-full p-2 hover:bg-white/5 transition"
          aria-label="next episode"
          onClick={handleNextEpisode}
        >
          <ArrowRight className="h-[7px] w-[11px]" />
        </button>
      </div>
    </section>
  );
}
