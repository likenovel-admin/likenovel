import { useGetInfiniteEpisodeList } from "@/app/api/query/product";
import { IGetEpisodeProductParams } from "@/app/api/query/product/dto";
import Spinner from "@/components/common/Spinner";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useAuthStore from "@/store/authStore";
import useModalStore from "@/store/modalStore";
import useViewStore from "@/store/viewerStore";
import { getEpisodeBadge } from "@/utils/getEpisodeBadge";
import { getFormattingDate } from "@/utils/getFormattingDate";
import type { ProductDetailEntrySource } from "@/utils/productPath";
import { buildViewerPath } from "@/utils/viewerPath";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EpisodeCard from "./EpisodeCard";
import Align from "/public/images/align.svg";

interface EpisodeModalProps {
  productId?: number;
  currentEpisodeId?: number;
  entrySource?: ProductDetailEntrySource | null;
}

const EpisodeModal = ({
  productId,
  currentEpisodeId,
  entrySource,
}: EpisodeModalProps) => {
  const router = useRouter();
  const { withLoginRequired } = useAuthWrapper();
  const { closeModal } = useModalStore();
  const { isAuthenticated } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
  }));
  const { episodeListAlignType, setEpisodeListAlignType } = useViewStore(
    (state) => ({
      episodeListAlignType: state.episodeListAlignType,
      setEpisodeListAlignType: state.setEpisodeListAlignType,
    })
  );
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentEpisodeRef = useRef<HTMLDivElement | null>(null);
  const hasFocusedCurrentEpisodeRef = useRef(false);

  const queryParams: IGetEpisodeProductParams = {
    product_id: productId?.toString() || "0",
    order_by: "episodeNo",
    order_dir: episodeListAlignType === "new" ? "desc" : "asc",
    limit: 20,
  };

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetInfiniteEpisodeList(queryParams);

  const handleAlignType = () => {
    hasFocusedCurrentEpisodeRef.current = false;
    setEpisodeListAlignType(episodeListAlignType === "new" ? "old" : "new");
  };

  const allEpisodes = useMemo(() => {
    if (!data) return [];
    // API already returns episodes in the correct order based on order_dir
    // No need to sort again on client-side
    return data.pages.flatMap((page) => page.data.episodes);
  }, [data]);
  const hasCurrentEpisode = useMemo(
    () =>
      currentEpisodeId
        ? allEpisodes.some((episode) => episode.episodeId === currentEpisodeId)
        : false,
    [allEpisodes, currentEpisodeId]
  );

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [handleObserver]);

  useEffect(() => {
    if (!currentEpisodeId || hasCurrentEpisode || !hasNextPage || isFetchingNextPage) {
      return;
    }
    fetchNextPage();
  }, [
    currentEpisodeId,
    hasCurrentEpisode,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  useEffect(() => {
    hasFocusedCurrentEpisodeRef.current = false;
  }, [currentEpisodeId, episodeListAlignType]);

  useEffect(() => {
    if (!hasCurrentEpisode || hasFocusedCurrentEpisodeRef.current) {
      return;
    }
    const node = currentEpisodeRef.current;
    if (!node) {
      return;
    }
    hasFocusedCurrentEpisodeRef.current = true;
    requestAnimationFrame(() => {
      node.scrollIntoView({ block: "center" });
    });
  }, [hasCurrentEpisode, allEpisodes.length]);

  if (isLoading) {
    return (
      <div className="px-6 py-20 flex justify-center items-center">
        <Spinner size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-20 flex justify-center items-center">
        <p className="text-gray-500">
          에피소드 목록을 불러오는데 실패했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6">
      <div className="flex justify-between items-center mt-[15px] mb-[13px]">
        <h1 className="font-bold text-22pxr">회차 리스트</h1>
        <button className="flex items-center gap-2" onClick={handleAlignType}>
          <Align />
          <span className="text-dark-gray-400 text-14pxr">
            {episodeListAlignType === "new" ? "최신화부터" : "첫화부터"}
          </span>
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {allEpisodes.length === 0 ? (
          <div className="py-20 flex justify-center items-center">
            <p className="text-gray-500">등록된 에피소드가 없습니다.</p>
          </div>
        ) : (
          <>
            {allEpisodes.map((episode) => {
              // Map API response to EpisodeCard props
              const episodeType = getEpisodeBadge(episode);
              const badges = {
                free: episodeType === "free",
                rental: episodeType === "rental",
                collect: episodeType === "collect",
              };

              return (
                <div
                  key={episode.episodeId}
                  ref={
                    episode.episodeId === currentEpisodeId
                      ? currentEpisodeRef
                      : null
                  }
                >
                  <EpisodeCard
                    episode={episode.episodeNo}
                    episodeTitle={episode.episodeTitle}
                    isCurrent={episode.episodeId === currentEpisodeId}
                    badges={badges}
                    isRead={episode?.usage?.readYn === "Y" || false}
                    uploadDate={
                      episode.createdDate
                        ? getFormattingDate(episode.createdDate, "YYYY.MM.DD")
                        : ""
                    } // TODO: Format date properly
                    viewCount={episode.countHit}
                    likeCount={episode.countLike || 0}
                    onClick={() => {
                      if (
                        !isAuthenticated &&
                        (episode.priceType === "paid" || (episode.episodeNo || 0) > 5)
                      ) {
                        withLoginRequired(() => undefined, {
                          redirectPath: buildViewerPath(episode.episodeId, {
                            productId,
                            entrySource,
                          }),
                          resumeContext: productId
                            ? {
                                productId,
                                originPageType: "viewer",
                                originEpisodeId: currentEpisodeId,
                              }
                            : undefined,
                        })?.();
                        return;
                      }
                      router.push(
                        buildViewerPath(episode.episodeId, {
                          productId,
                          entrySource,
                        })
                      );
                      closeModal();
                    }}
                  />
                </div>
              );
            })}
            {/* Intersection Observer Target */}
            <div ref={observerTarget} className="h-4" />
            {/* Loading indicator for next page */}
            {isFetchingNextPage && (
              <div className="py-4 flex justify-center items-center">
                <Spinner size={30} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default EpisodeModal;
