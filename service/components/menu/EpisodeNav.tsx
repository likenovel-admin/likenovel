import { useSelectProductDetail } from "@/app/api/query/product";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  productId?: number;
  episodeId?: number;
}
const EpisodeNav = ({ productId, episodeId }: Props) => {
  const router = useRouter();

  const { data: productDetail } = useSelectProductDetail(productId || 0);

  const productTitle = productDetail?.data?.product?.title;

  // Find the latest episode
  const latestEpisode = productDetail?.data?.episodes?.reduce(
    (latest, current) => {
      return !latest || current.episodeNo > latest.episodeNo ? current : latest;
    },
    null as any
  );

  // Find the current episode being edited (only if episodeId is provided)
  const currentEpisode = episodeId
    ? productDetail?.data?.episodes?.find((ep) => ep.episodeId === episodeId)
    : null;

  // Determine which episode to display:
  // - When creating (no episodeId): show latest episode
  // - When editing (has episodeId): show current episode
  const displayEpisode = episodeId ? currentEpisode : latestEpisode;

  // Check if display episode is the latest episode
  const isLatestEpisode =
    displayEpisode &&
    latestEpisode &&
    displayEpisode.episodeId === latestEpisode.episodeId;

  return (
    <div className="fixed top-0 left-0 w-full px-[16px] md:px-[200px] py-[15px] flex items-center gap-[13px] border-b md:justify-between z-50 bg-white">
      <div />
      <div className="flex flex-col gap-1">
        <div className="flex gap-[8px] items-end font-semibold">
          {!episodeId && (
            <div className="md:mb-[2px]">
              <div className="flex items-center justify-center border-[1.5px] border-[#05a1d3] rounded-full w-[45px] md:w-[50px] h-[20px] text-9pxr md:text-10pxr font-medium text-[#05a1d3]">
                최근 회차
              </div>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-11pxr md:text-13pxr text-dark-gray-400 font-normal ml-[-52px] md:ml-0">
              {productTitle || ""}
            </span>
            {/* Show latest episode when creating, current episode when editing */}
            {displayEpisode && (
              <div className="flex">
                <span className="text-14pxr md:text-16pxr text-black-100">
                  {displayEpisode.episodeNo && displayEpisode.episodeTitle
                    ? `${displayEpisode.episodeTitle}`
                    : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* TODO: 해당 작품의 회차관리로 이동 */}
      <button
        className="ml-auto md:ml-0"
        onClick={() => {
          router.push(`/product/author/episode-manager/${productId}`);
        }}
      >
        <Image src="/images/close.svg" alt="닫기" width={16} height={16} />
      </button>
    </div>
  );
};

export default EpisodeNav;
