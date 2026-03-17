import { useSelectViewerPath, useSelectNextEpisodeInfo } from "@/app/api/query/episode";
import { usePostAiSignalEvent } from "@/app/api/query/recommendation";
import { useRouter } from "next/navigation";
import ArrowRight from "/public/images/arrow-right-medium.svg";
import useModalStore from "@/store/modalStore";
import { TYPE_MODAL } from "@/constants/common";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useAuthStore from "@/store/authStore";
import useViewStore from "@/store/viewerStore";
import Image from "next/image";

interface NextEpisodeProps {
  currentEpisodeId: number;
}

export default function NextEpisode({ currentEpisodeId }: NextEpisodeProps) {
  const router = useRouter();
  const { withLoginRequired } = useAuthWrapper();
  const { setTypeModal } = useModalStore();
  const { settings } = useViewStore((state) => ({
    settings: state.settings,
  }));
  const { mutate: postSignalEvent } = usePostAiSignalEvent();
  const { isAuthenticated } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
  }));

  const { data } = useSelectViewerPath(currentEpisodeId);
  const { data: nextEpisodeData } = useSelectNextEpisodeInfo(data?.data?.nextEpisodeId || 0);
  const isDarkTheme = settings.theme === "dark";

  if (!data?.data?.nextEpisodeId) {
    return (
      <div className="w-full text-center py-[20px] mt-[10px]">
        <p className="text-sm text-[#4D5159]">다음화가 없습니다.</p>
      </div>
    );
  }

  const coverImagePath = data.data.coverImagePath;

  const handleNextEpisode = () => {
    const episode = data?.data;
    const productTitle = data?.data?.title;

    if (
      !isAuthenticated &&
      (episode?.nextEpisodePriceType === "paid" ||
        (episode?.nextEpisodes || 0) > 5)
    ) {
      withLoginRequired(() => undefined, {
        redirectPath: `/viewer/${episode?.nextEpisodeId}`,
      })?.();
      return;
    }

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

    // Fire next_episode_click signal event
    if (data.data.product_id) {
      postSignalEvent({
        product_id: data.data.product_id,
        episode_id: currentEpisodeId,
        event_type: "next_episode_click",
        next_available_yn: "Y",
        event_payload: { redirect_to_episode_id: data.data.nextEpisodeId },
      });
    }

    // Navigate to next episode if owned or rental is valid
    router.push(`/viewer/${data.data.nextEpisodeId}`);
  };

  return (
    <section
      className={`w-full rounded-[20px] border border-line px-[22px] py-[21px] sm:p-5 mt-[10px] cursor-pointer transition ${
        isDarkTheme
          ? "bg-[#2B2F35] hover:bg-[#343942]"
          : "bg-card/60 hover:bg-gray-50"
      }`}
      onClick={handleNextEpisode}
    >
      <div className="flex items-center gap-4">
        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md">
          {coverImagePath ? (
            <Image
              src={coverImagePath}
              alt="표지"
              width={64}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">다음화</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <p
            className={`text-base font-semibold tracking-[-2%] ${
              isDarkTheme ? "text-white" : "text-[#111317]"
            }`}
          >
            다음화 보기
          </p>
          <p
            className={`mt-[9px] text-sm font-normal tracking-[-2%] line-clamp-2 ${
              isDarkTheme ? "text-white/85" : "text-[#4D5159]"
            }`}
          >
            {nextEpisodeData?.data?.title || "다음 에피소드"}
          </p>
        </div>

        <ArrowRight
          className={`h-[7px] w-[11px] shrink-0 ${
            isDarkTheme ? "text-white" : "text-[#111317]"
          }`}
        />
      </div>
    </section>
  );
}
