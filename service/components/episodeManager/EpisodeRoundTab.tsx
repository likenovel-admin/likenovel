import { useOpenEpisode } from "@/app/api/query/author/episode";
import useToastStore from "@/store/toastStore";
import { IEpisode } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Button from "../common/Button";
import RoundBadge from "../common/RoundBadge";
import SimpleMenu from "../common/SimpleMenu";
import ArrowUpDown from "/public/images/arrow-up-down.svg";
import Rating from "/public/images/rating.svg";
import View from "/public/images/view.svg";

interface EpisodeRoundTabProps {
  episodes: IEpisode[];
}

const EpisodeRoundTab = ({ episodes }: EpisodeRoundTabProps) => {
  const [isDescSort, setIsDescSort] = useState(false);

  const sortedEpisodes = useMemo(() => {
    const sorted = [...episodes];

    if (isDescSort) {
      return sorted.sort((a, b) => b.episodeNo - a.episodeNo);
    } else {
      return sorted.sort((a, b) => a.episodeNo - b.episodeNo);
    }
  }, [episodes, isDescSort]);

  return (
    <div>
      <div className="flex gap-2 justify-center items-start pt-5 pb-2 border-b mb-6">
        <Image
          src="/images/megaphone.svg"
          alt="megaphone"
          width={22}
          height={19}
        />
        <span className="text-13pxr md:text-16pxr text-gray-600 font-semibold">
          여기서 1화 더 쓰면 총 조회수는{" "}
          <span className="text-primary-100">000만큼 상승</span> 이 예상되고{" "}
          <span className="text-[#FF5E03]">순위 상승은 000만큼</span> 할 수
          있습니다!
        </span>
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="w-[100px] md:w-[110px]"
        onClick={() => setIsDescSort(!isDescSort)}
      >
        <ArrowUpDown className="w-[11px] md:w-[13px] h-[12px]" />
        <span className="ml-5pxr text-12pxr md:text-14pxr text-dark-gray-500">
          {isDescSort ? "최신 순" : "첫회부터"}
        </span>
      </Button>
      <div className="border-t mt-4">
        {sortedEpisodes?.map((episode) => (
          <EpisodeRoundItem key={episode.episodeId} episode={episode} />
        ))}
      </div>
    </div>
  );
};
interface IEpisodeRoundItemProps {
  episode: IEpisode;
}

const EpisodeRoundItem = ({ episode }: IEpisodeRoundItemProps) => {
  const router = useRouter();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const openEpisodeMutation = useOpenEpisode();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR");
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR");
  };

  const handleToggleVisibility = async () => {
    if (openEpisodeMutation.isPending) {
      return;
    }
    try {
      await openEpisodeMutation.mutateAsync(
        { episodeId: episode.episodeId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["selectProductDetail", episode.productId],
            });

            if (episode.episodeOpenYn === "Y") {
              setToast({
                message: "에피소드가 비공개로 변경되었습니다.",
                type: "success",
              });
            } else {
              setToast({
                message: "에피소드가 공개로 변경되었습니다.",
                type: "success",
              });
            }
          },
          onError: (error: any) => {
            setToast({
              message:
                error?.response?.data?.message ||
                "에피소드 상태 변경에 실패했습니다.",
              type: "error",
            });
          },
        }
      );
    } catch (error) {
      setToast({
        message: "에피소드 상태 변경에 실패했습니다.",
        type: "error",
      });
    }
  };

  const handleOpenEditEpisode = (episode: IEpisode) => {
    router.push(
      `/making-episode/${episode.productId}/${episode.episodeId}/episode`
    );
  };

  const isScheduledRelease =
    episode.openYn === "N" && episode.publishReserveDate;

  return (
    <div className="py-3 border-b border-b-light-gray-100 flex flex-col">
      <div className="flex flex-col gap-[6px]">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-1">
            {isScheduledRelease && <RoundBadge type="reservation" />}
            {episode.openYn === "Y" && <RoundBadge type="release" />}
            {episode.openYn === "N" && !isScheduledRelease && (
              <RoundBadge type="private" />
            )}
            {/* {episode.priceType === "paid" && <RoundBadge type="paid" />} */}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-13pxr font-semibold text-dark-gray-300">
              {episode.episodeTextCount}자
            </span>
            <SimpleMenu
              menuList={[
                {
                  title: "수정",
                  onClick: () => handleOpenEditEpisode(episode),
                },
                {
                  title: episode.episodeOpenYn === "Y" ? "비공개" : "공개",
                  onClick: handleToggleVisibility,
                },
                // {
                //   title: episode.priceType === "free" ? "유료" : "무료",
                //   onClick: () => {},
                // },
              ]}
            />
          </div>
        </div>
        <div className="text-16pxr font-semibold">
          {/* {episode.episodeNo}화. {episode.episodeTitle} */}
          {episode.episodeTitle}
        </div>
        {isScheduledRelease && (
          <span className="text-primary-100 text-11pxr md:text-13pxr">
            {formatDateTime(episode.publishReserveDate)} 공개예정
          </span>
        )}
        {episode.createdDate && (
          <div>
            <div className="flex gap-3 items-center">
              <span className="text-11pxr text-gray-500">
                {formatDate(episode.createdDate)}
              </span>
              <span className="text-gray-300 text-12pxr"> | </span>
              <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                <View className="w-3 h-[14px]" />
                {episode.countView}{" "}
                <IncresedCount
                  increasedCount={episode.countHitIndicator || 0}
                />
              </div>
              <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                <Image
                  src="/images/like.svg"
                  width={15}
                  height={12}
                  alt="좋아요"
                />
                {episode.countLike}{" "}
                <IncresedCount
                  increasedCount={episode.countLikeIndicator || 0}
                />
              </div>
              <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                <Image
                  src={"/images/message-gray.svg"}
                  width={14}
                  height={14}
                  alt="comment"
                />
                {episode.countComment}{" "}
                <IncresedCount
                  increasedCount={episode.countCommentIndicator || 0}
                />
              </div>
              <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                <Rating className="w-[14px] h-[14px] text-dark-gray-300" />
                {episode.countEvaluation}{" "}
                <IncresedCount
                  increasedCount={episode.countEvaluationIndicator || 0}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const IncresedCount = ({ increasedCount }: { increasedCount: number }) => {
  const color = increasedCount > 0 ? "text-primary-100" : "text-red-100";
  return (
    <div className="flex gap-1 items-center">
      <Image
        src={increasedCount > 0 ? "/images/short.svg" : "/images/long.svg"}
        width={8}
        height={8}
        alt="화살표"
      />
      <span className={`text-10pxr ${color}`}>{increasedCount}</span>
    </div>
  );
};
export default EpisodeRoundTab;
