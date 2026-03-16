"use client";
import { useGetProductNoticeDetail } from "@/app/api/query/author/episode";
import { useSelectViewerPath } from "@/app/api/query/episode";
import { usePostAiSignalEvent } from "@/app/api/query/recommendation";
import Modal from "@/components/common/Modal";
import ViewerBottomNav from "@/components/menu/ViewerBottomNav";
import ViewerNav from "@/components/menu/ViewerNav";
import ViewerSideMenu from "@/components/menu/ViewerSideMenu";
import EpisodeModal from "@/components/viewer/EpisodeModal";
import EpubViewer from "@/components/viewer/EpubViewer";
import Rating from "@/components/viewer/Rating";
import SettingModal from "@/components/viewer/SettingModal";
import { TYPE_MODAL } from "@/constants/common";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useAuthStore from "@/store/authStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import {
  getLocalStorage,
  setLocalStorage,
  STORAGE_KEYS,
} from "@/utils/localStorage";
import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
const Viewer = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/");
  const episodeId = Number(pathSegments[pathSegments.length - 1]);
  const searchParams = useSearchParams();
  const viewerType = searchParams.get("type");
  const productId = searchParams.get("productId");
  const productTitle = searchParams.get("title");

  const router = useRouter();
  const { setModal, setTypeModal } = useModalStore();
  const { setToast } = useToastStore();
  const { withLoginRequired } = useAuthWrapper();
  const { isAuthenticated } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
  }));
  const [location, setLocation] = useState<string | number>(0);
  const [isScroll, setIsScroll] = useState(() => {
    // Load initial value from localStorage
    const saved = getLocalStorage<boolean>(STORAGE_KEYS.IS_SCROLL);
    return saved ?? true; // Default to true (세로보기)
  });
  const [showNav, setShowNav] = useState(true);
  const [commentState, setCommentState] = useState(false);
  const [noticeState, setNoticeState] = useState(false);
  const [modalType, setModalType] = useState<
    "episode" | "setting" | "rating" | null
  >(null);
  const [epubUrl, setEpubUrl] = useState<string | null>(null);
  const [goFirstRequest, setGoFirstRequest] = useState(0);

  const { mutate: postSignalEvent } = usePostAiSignalEvent();
  const { data } = useSelectViewerPath(episodeId);
  const { data: noticeDetailData } = useGetProductNoticeDetail(
    viewerType === "notice" ? episodeId : "",
    viewerType === "notice"
  );

  // Check for notice data from store and set notice state
  useEffect(() => {
    if (noticeDetailData?.data) {
      setNoticeState(true);
      setShowNav(true);
    } else {
      setNoticeState(false);
    }
  }, [noticeDetailData?.data]);

  // Save isScroll to localStorage whenever it changes
  useEffect(() => {
    setLocalStorage(STORAGE_KEYS.IS_SCROLL, isScroll);
  }, [isScroll]);

  useEffect(() => {
    setLocation(0);
    setEpubUrl(null);
  }, [episodeId]);

  useEffect(() => {
    const fetchEpubFile = async () => {
      if (!data?.data.epubFilePath) {
        setEpubUrl(null);
        return;
      }

      try {
        await axios.get(data.data.epubFilePath, {
          responseType: "blob",
        });
        setEpubUrl(data.data.epubFilePath);
      } catch (error) {
        setToast({
          message: "Epub 파일을 불러오는데 실패했습니다.",
          type: "error",
        });
      }
    };
    fetchEpubFile();
  }, [data?.data.epubFilePath]);

  const handleToggleNav = () => {
    setShowNav(!showNav);
  };

  const handleOpenEpisode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalType("episode");
    setModal(<EpisodeModal productId={data?.data?.product_id} />);
  };
  const handleOpenSetting = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalType("setting");
    setModal(<SettingModal />);
  };

  const handleGoFirst = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isScroll) {
      setGoFirstRequest((prev) => prev + 1);
      return;
    }
    setLocation(0);
  };

  const handleNavigateNextChap = () => {
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

    if (
      episode?.nextEpisodePriceType === "paid" &&
      (!episode.nextEpisodeRentalRemaining ||
        (episode.nextEpisodeRentalRemaining?.days === 0 &&
          episode.nextEpisodeRentalRemaining?.hours === 0)) &&
      episode.nextEpisodeOwnType !== "own"
    ) {
      setTypeModal(TYPE_MODAL.RENT_OWN, {
        title: `${productTitle} ${episode.nextEpisodes}화`,
        episodeId: episode.nextEpisodeId,
        productId: episode.product_id,
      });
      return;
    }
    if (data && data?.data?.nextEpisodeId) {
      if (data.data.product_id) {
        postSignalEvent({
          product_id: data.data.product_id,
          episode_id: episodeId,
          event_type: "next_episode_click",
          next_available_yn: "Y",
          event_payload: { redirect_to_episode_id: data.data.nextEpisodeId },
        });
      }
      router.push(`/viewer/${data?.data?.nextEpisodeId}`);
    }
  };

  const handleNavigatePrevChap = () => {
    const episode = data?.data;
    const productTitle = data?.data?.title;

    if (
      episode?.previousEpisodePriceType === "paid" &&
      (!episode.previousEpisodeRentalRemaining ||
        (episode.previousEpisodeRentalRemaining?.days === 0 &&
          episode.previousEpisodeRentalRemaining?.hours === 0)) &&
      episode.previousEpisodeOwnType !== "own"
    ) {
      setTypeModal(TYPE_MODAL.RENT_OWN, {
        title: `${productTitle} ${episode.nextEpisodes - 2}화`,
        episodeId: episode.previousEpisodeId,
        productId: episode.product_id,
      });
      return;
    }
    if (data && data?.data?.previousEpisodeId) {
      router.push(`/viewer/${data?.data?.previousEpisodeId}`);
    }
  };

  const handleCommentState = useCallback(() => {
    setCommentState((prev) => {
      const next = !prev;
      if (next) {
        setShowNav(true);
      }
      return next;
    });
  }, []);

  const handleNoticeState = () => {
    setNoticeState(!noticeState);
    setShowNav(true);
  };

  return (
    <div className="min-h-screen">
      {showNav && (
        <ViewerNav
          productId={data?.data?.product_id || Number(productId || 0) || 0}
          bookmarkYn={data?.data.bookmarkYn || "N"}
          likedYN={data?.data.liked || "N"}
          episodeTitle={
            noticeState && noticeDetailData?.data
              ? noticeDetailData?.data.title
              : data?.data.episodeTitle || ""
          }
          productTitle={
            noticeState && noticeDetailData?.data
              ? productTitle || ""
              : data?.data.title || ""
          }
          bingeWatchYn={data?.data.bingeWatchYn || "N"}
          commentCount={data?.data?.commentCount}
          isScroll={isScroll}
          commentState={commentState}
          noticeState={noticeState}
          setIsScroll={setIsScroll}
          showNav={showNav}
          handleCommentState={
            noticeState ? handleNoticeState : handleCommentState
          }
        />
      )}

      {noticeState && noticeDetailData?.data ? (
        <div className="mt-[109px] mb-[60px] flex flex-col items-center">
          <div className="w-full md:w-[784px] px-16pxr md:px-0">
            {/* <div className="py-20pxr border-b border-light-gray-300">
              <h1 className="text-18pxr md:text-24pxr font-bold mb-10pxr">
                {noticeData.notice.subject}
              </h1>
              <p className="text-13pxr md:text-14pxr text-dark-gray-400">
                {getFormattingDate(
                  noticeData.notice.updated_date,
                  "YYYY.MM.DD"
                )}
              </p>
            </div> */}
            <div className="py-20pxr text-14pxr md:text-16pxr whitespace-pre-wrap">
              {noticeDetailData?.data.content}
            </div>
          </div>
        </div>
      ) : commentState ? (
        <Rating
          productId={data?.data.product_id || undefined}
          episodeId={episodeId}
          setModalType={setModalType}
        />
      ) : (
        <>
          <div className={`relative ${showNav ? "" : ""} `}>
            {epubUrl && (
              <EpubViewer
                location={location}
                setLocation={setLocation}
                goFirstRequest={goFirstRequest}
                epubUrl={epubUrl}
                coverImagePath={data?.data?.coverImagePath || null}
                isScroll={isScroll}
                showNav={showNav}
                setShowNav={setShowNav}
                currentEpisodeId={episodeId}
                productId={data?.data?.product_id}
                nextEpisodeId={data?.data?.nextEpisodeId}
                handleCommentState={handleCommentState}
              />
            )}
            {/* {isScroll && (
              <LastPage
                currentEpisodeId={episodeId}
                setCommentState={setCommentState}
              />
            )} */}
            {!noticeState && (
              <ViewerSideMenu
                onEpisodeListClick={handleOpenEpisode}
                onSettingClick={handleOpenSetting}
                onGoFirstClick={handleGoFirst}
                isScroll={isScroll}
              />
            )}
          </div>
          {showNav && !noticeState && (
            <ViewerBottomNav
              showNav={showNav}
              handleNavigateNextChap={handleNavigateNextChap}
              handleNavigatePrevChap={handleNavigatePrevChap}
              previousEpisodeId={data?.data?.previousEpisodeId}
              nextEpisodeId={data?.data?.nextEpisodeId}
              commentCount={data?.data?.commentCount}
              productId={data?.data.product_id || Number(productId || 0)}
              bookmarkYn={data?.data.bookmarkYn}
              likedYN={data?.data.liked}
              handleCommentState={handleCommentState}
            />
          )}
        </>
      )}

      <Modal
        size={
          modalType === "setting" ? "sm" : modalType === "episode" ? "md" : "sm"
        }
        hasBlackOverlay={modalType === "setting" ? false : true}
        justifyAlign={
          modalType === "setting" || modalType === "episode" ? "end" : "center"
        }
        itemsAlign={
          modalType === "setting" || modalType === "episode" ? "end" : "center"
        }
      />
    </div>
  );
};
export default Viewer;
