"use client";
import { useGetProductNoticeDetail } from "@/app/api/query/author/episode";
import { useSelectViewerPath } from "@/app/api/query/episode";
import Modal from "@/components/common/Modal";
import Spinner from "@/components/common/Spinner";
import ViewerBottomNav from "@/components/menu/ViewerBottomNav";
import ViewerNav from "@/components/menu/ViewerNav";
import ViewerSideMenu from "@/components/menu/ViewerSideMenu";
import EpisodeModal from "@/components/viewer/EpisodeModal";
import EpubViewer from "@/components/viewer/EpubViewer";
import Rating from "@/components/viewer/Rating";
import SettingModal from "@/components/viewer/SettingModal";
import { TYPE_MODAL } from "@/constants/common";
import { ErrorCodes } from "@/enums/errorCodes";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useAuthStore from "@/store/authStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { syncProductDetailTransitionDecision } from "@/utils/funnelRouteTracker";
import {
  getLocalStorage,
  setLocalStorage,
  STORAGE_KEYS,
} from "@/utils/localStorage";
import { setGuestReadProgress } from "@/utils/guestReadProgress";
import {
  confirmViewerPageContext,
  upsertPendingViewerPageContext,
} from "@/utils/viewerPageContext";
import {
  type NextEpisodeClickSignalContext,
  postNextEpisodeClickSignalBestEffort,
} from "@/utils/nextEpisodeClickSignal";
import {
  buildProductDetailPath,
  getProductDetailEntrySource,
} from "@/utils/productPath";
import { buildViewerPath } from "@/utils/viewerPath";
import { savePendingWebsochatLaunch } from "@/utils/websochatLaunch";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Close from "/public/images/close.svg";

const GUEST_LIMIT_NOTICE_DISMISSED_KEY = "guestEpisodeLimitNoticeDismissed";

const Viewer = () => {
  const params = useParams<{ id: string }>();
  const episodeId = Number(params.id || 0);
  const searchParams = useSearchParams();
  const viewerType = searchParams.get("type");
  const isNoticeViewer = viewerType === "notice";
  const viewerContextKind = viewerType === "notice" ? "notice" : "episode";
  const productId = searchParams.get("productId");
  const productTitle = searchParams.get("title");
  const entrySource = getProductDetailEntrySource(searchParams.get("entrySource"));
  const hintedProductId = Number(productId || 0) || 0;
  const viewerEpisodeId = isNoticeViewer ? 0 : episodeId;

  const router = useRouter();
  const queryClient = useQueryClient();
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
  const [suppressViewerClickTick, setSuppressViewerClickTick] = useState(0);
  const [showGuestLimitNotice, setShowGuestLimitNotice] = useState(false);

  const {
    data,
    error: viewerError,
    isError: isViewerError,
    isLoading: isViewerLoading,
    refetch: refetchViewerPath,
  } = useSelectViewerPath(viewerEpisodeId);
  const { data: noticeDetailData } = useGetProductNoticeDetail(
    isNoticeViewer ? episodeId : "",
    isNoticeViewer
  );
  const episodeData = data?.data;
  const viewerErrorStatus = axios.isAxiosError(viewerError)
    ? viewerError.response?.status
    : undefined;
  const viewerErrorCode = axios.isAxiosError<{ code?: string }>(viewerError)
    ? viewerError.response?.data?.code
    : undefined;
  const isGuestEpisodeLimitError =
    !isAuthenticated && viewerErrorCode === ErrorCodes.E4013;
  const isViewerAuthError =
    viewerErrorStatus === 401 || viewerErrorStatus === 403;
  const isViewerNotFoundError = viewerErrorStatus === 404;
  const isViewerMissingData = !isViewerError && !episodeData;
  const isViewerMissingEpisode = isViewerNotFoundError || isViewerMissingData;
  const isViewerTransientError =
    isViewerError && !isViewerAuthError && !isViewerNotFoundError;
  const viewerUnavailableTitle = isViewerAuthError
    ? "로그인이 필요합니다."
    : isViewerMissingEpisode
      ? "회차를 찾을 수 없습니다."
      : "회차를 불러오지 못했습니다.";
  const viewerUnavailableMessage = isViewerAuthError
    ? "로그인이 필요한 회차이거나 접근할 수 없는 회차입니다."
    : isViewerMissingEpisode
      ? "삭제되었거나 공개되지 않은 회차입니다."
      : "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

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
    upsertPendingViewerPageContext({
      episodeId,
      kind: viewerContextKind,
      hintProductId: productId,
    });
  }, [episodeId, productId, viewerContextKind]);

  useEffect(() => {
    if (isNoticeViewer) return;
    if (!data?.data?.product_id) return;

    queryClient.invalidateQueries({
      queryKey: ["selectProductDetail", data.data.product_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["selectEpisode", data.data.product_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["selectUserInfo"],
    });

    confirmViewerPageContext({
      episodeId,
      kind: viewerContextKind,
      resolvedProductId: data.data.product_id,
      hintProductId: productId,
    });
    syncProductDetailTransitionDecision();
  }, [
    data?.data?.product_id,
    episodeId,
    productId,
    queryClient,
    viewerContextKind,
    isNoticeViewer,
  ]);

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
  }, [data?.data.epubFilePath, setToast]);

  useEffect(() => {
    if (isAuthenticated || isNoticeViewer) return;

    const episode = data?.data;
    if (!episode?.product_id || !episode.episodeNo) return;
    if (episode.privateYn === "Y" || episode.productPrivateYn === "Y") return;

    setGuestReadProgress({
      productId: episode.product_id,
      episodeId,
      episodeNo: episode.episodeNo,
      episodeTitle: episode.episodeTitle || "",
    });
  }, [
    data?.data,
    episodeId,
    isAuthenticated,
    isNoticeViewer,
  ]);

  useEffect(() => {
    if (
      isAuthenticated ||
      isNoticeViewer ||
      data?.data?.episodeNo !== 5 ||
      sessionStorage.getItem(GUEST_LIMIT_NOTICE_DISMISSED_KEY) === "Y"
    ) {
      setShowGuestLimitNotice(false);
      return;
    }

    setShowGuestLimitNotice(true);
  }, [data?.data?.episodeNo, isAuthenticated, isNoticeViewer]);

  const handleToggleNav = () => {
    setShowNav(!showNav);
  };

  const handleOpenEpisode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSuppressViewerClickTick((prev) => prev + 1);
    setModalType("episode");
    setModal(
      <EpisodeModal
        productId={data?.data?.product_id}
        currentEpisodeId={episodeId}
        entrySource={entrySource}
      />
    );
  };
  const handleOpenSetting = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSuppressViewerClickTick((prev) => prev + 1);
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
    const nextViewerPath = episode?.nextEpisodeId
      ? buildViewerPath(episode.nextEpisodeId, {
          productId: episode.product_id,
          entrySource,
        })
      : null;

    if (!nextViewerPath) return;

    const signalContext: NextEpisodeClickSignalContext | null =
      episode?.product_id && episode?.nextEpisodeId
        ? {
            originAction: "next_episode_click",
            productId: episode.product_id,
            fromEpisodeId: episodeId,
            redirectToEpisodeId: episode.nextEpisodeId,
            entrySource,
          }
        : null;

    if (
      !isAuthenticated &&
      (episode?.nextEpisodePriceType === "paid" ||
        (episode?.nextEpisodes || 0) > 5)
    ) {
      withLoginRequired(() => undefined, {
        redirectPath: nextViewerPath,
        resumeContext: episode?.product_id
          ? {
              productId: episode.product_id,
              originPageType: "viewer",
              originEpisodeId: episodeId,
            }
          : undefined,
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
        signalContext,
      });
      return;
    }
    if (data && data?.data?.nextEpisodeId) {
      postNextEpisodeClickSignalBestEffort(signalContext);
      router.push(nextViewerPath);
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
      router.push(
        buildViewerPath(data?.data?.previousEpisodeId, {
          productId: data?.data?.product_id,
          entrySource,
        })
      );
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

  const handleOpenWebsochat = useCallback(() => {
    const episode = data?.data;
    if (!episode?.websochatEligible || !episode.episodeNo) return;

    const publishedLatestEpisodeNo =
      episode.websochatPublishedLatestEpisodeNo || episode.episodeNo;

    savePendingWebsochatLaunch({
      productId: episode.product_id,
      title: episode.title,
      coverImagePath: episode.coverImagePath || null,
      priceType: episode.priceType || null,
      latestEpisodeNo: publishedLatestEpisodeNo,
      publishedLatestEpisodeNo,
      syncedLatestEpisodeNo: episode.websochatSyncedLatestEpisodeNo || null,
      contextStatus: episode.websochatContextStatus || null,
      readEpisodeNo: episode.episodeNo,
      readEpisodeTitle: episode.episodeTitle || null,
      launchSource: "viewer_bottom_nav",
      action: {
        label: "이번 회차 대화",
        prompt: `${episode.episodeNo}화까지 읽었고, 이번 회차 기준으로 같이 이야기해줘`,
        modeKey: "qa",
        qaActionKey: null,
      },
    });
    router.push("/websochat");
  }, [data?.data, router]);

  const handleLoginFromUnavailableViewer = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search;
    setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);
    router.push("/login?modal=open", { scroll: false });
  }, [router]);

  const handleSignupFromGuestLimit = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search;
    setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);
    router.push("/sign-up");
  }, [router]);

  const handleDismissGuestLimitNotice = useCallback(() => {
    sessionStorage.setItem(GUEST_LIMIT_NOTICE_DISMISSED_KEY, "Y");
    setShowGuestLimitNotice(false);
  }, []);

  const handleGoToProductDetail = useCallback(() => {
    if (hintedProductId) {
      router.push(
        buildProductDetailPath(hintedProductId, {
          entrySource,
        })
      );
      return;
    }
    router.back();
  }, [entrySource, hintedProductId, router]);

  if (!isNoticeViewer && isViewerLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isNoticeViewer && (isViewerError || !episodeData)) {
    if (isGuestEpisodeLimitError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-24pxr text-center">
          <p className="text-18pxr font-semibold text-black-300">
            여기서부터는 로그인하고 볼 수 있어요
          </p>
          <p className="mt-10pxr text-14pxr text-dark-gray-400 break-keep">
            무료 회차는 로그인만 하면 끝까지 무료예요. 읽던 곳으로 바로
            돌아올 수 있어요.
          </p>
          <button
            type="button"
            autoFocus
            onClick={handleSignupFromGuestLimit}
            className="mt-24pxr h-44pxr px-18pxr rounded-[8px] bg-primary-100 text-white text-14pxr font-semibold"
          >
            3초 만에 시작하기
          </button>
          <button
            type="button"
            onClick={handleLoginFromUnavailableViewer}
            className="mt-16pxr text-14pxr text-dark-gray-400 underline"
          >
            이미 회원이라면 로그인
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-24pxr text-center">
        <p className="text-18pxr font-semibold text-black-300">
          {viewerUnavailableTitle}
        </p>
        <p className="mt-10pxr text-14pxr text-dark-gray-400">
          {viewerUnavailableMessage}
        </p>
        <div className="mt-24pxr flex gap-10pxr">
          {isViewerAuthError && !isAuthenticated && (
            <button
              type="button"
              onClick={handleLoginFromUnavailableViewer}
              className="h-44pxr px-18pxr rounded-[8px] bg-primary-100 text-white text-14pxr font-semibold"
            >
              로그인하기
            </button>
          )}
          {isViewerTransientError && (
            <button
              type="button"
              onClick={() => refetchViewerPath()}
              className="h-44pxr px-18pxr rounded-[8px] bg-primary-100 text-white text-14pxr font-semibold"
            >
              다시 시도
            </button>
          )}
          <button
            type="button"
            onClick={handleGoToProductDetail}
            className="h-44pxr px-18pxr rounded-[8px] border border-light-gray-400 text-14pxr font-semibold text-black-300"
          >
            작품 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {showNav && (
        <ViewerNav
          productId={
            isNoticeViewer
              ? hintedProductId
              : data?.data?.product_id || hintedProductId
          }
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

      {showGuestLimitNotice && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed left-16pxr right-16pxr md:left-1/2 md:right-auto md:w-[600px] md:-translate-x-1/2 z-[60] bg-black-200/95 border border-dark-gray-700 rounded-[10px] p-14pxr shadow-xl flex items-center justify-between animate-fadeUp ${
            showNav && !noticeState
              ? "bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-76pxr"
              : "bottom-16pxr"
          }`}
        >
          <p className="flex-1 pr-12pxr text-13pxr font-medium tracking-[-2%] text-white leading-tight">
            다음 화부터는 로그인이 필요해요 · 무료 회차는 로그인하면 계속 무료
          </p>
          <button
            type="button"
            aria-label="안내 배너 닫기"
            onClick={handleDismissGuestLimitNotice}
            className="p-4pxr rounded-[6px] text-dark-gray-400 flex-shrink-0"
          >
            <Close className="w-16pxr h-16pxr" aria-hidden="true" />
          </button>
        </aside>
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
            <div
              className="py-20pxr text-14pxr md:text-16pxr whitespace-pre-wrap break-words [&_img]:max-w-full [&_img]:h-auto [&_p]:m-0"
              dangerouslySetInnerHTML={{
                __html: noticeDetailData?.data.content || "",
              }}
            />
          </div>
        </div>
      ) : commentState ? (
        <Rating
          productId={data?.data.product_id || undefined}
          episodeId={episodeId}
          commentOpenYn={data?.data.commentOpenYn || "Y"}
          evaluationOpenYn={data?.data.evaluationOpenYn || "Y"}
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
                suppressViewerClickTick={suppressViewerClickTick}
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
              showWebsochatButton={!!data?.data?.websochatEligible}
              handleWebsochatClick={handleOpenWebsochat}
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
