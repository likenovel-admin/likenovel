"use client";

import { useSelectAuthorProducts } from "@/app/api/query/author/product";
import { useSelectComment } from "@/app/api/query/comment";
import { useSelectEpisodes } from "@/app/api/query/episode";
import {
  useAddRecentProduct,
  useCheckRentalTickets,
  useSelectProductDetail,
} from "@/app/api/query/product";
import { useSelectSuggestProducts } from "@/app/api/query/suggest";
import {
  useGetAiProductBriefs,
  usePostAiSignalEvent,
} from "@/app/api/query/recommendation";
import CommentArea from "@/components/common/CommentArea";
import AiLibrarianDetailCard from "@/components/aiLibrarian/AiLibrarianDetailCard";
import MobileProducts from "@/components/common/MobileProducts";
import Tab from "@/components/common/Tab";
import ProductCoverArea from "@/components/productDetail/ProductCoverArea";
import ProductDetailCharacterChatSection from "@/components/productDetail/ProductDetailCharacterChatSection";
import ProductDetailWrapper from "@/components/productDetail/ProductDetailWrapper";
import ProductEpisodes from "@/components/productDetail/ProductEpisodes";
import SameAuthorProducts from "@/components/productDetail/SameAuthorProducts";
import SuggestProducts from "@/components/productDetail/SuggestProducts";
import useAuthStore from "@/store/authStore";
import useChatStore from "@/store/chatStore";
import useGiftBoxStore from "@/store/giftboxStore";
import useToastStore from "@/store/toastStore";
import { IEvaluation, IProduct } from "@/types";
import { mergeKeysEvaluation } from "@/utils/common";
import {
  buildAiLibrarianCopy,
  shouldFocusAiLibrarian,
} from "@/utils/aiLibrarian";
import { openAiLibrarianPanel } from "@/utils/aiLibrarianPanel";
import {
  consumeProductDetailEntrySource,
  getEffectiveProductDetailEntrySource,
  getProductDetailMarketingBackFallbackPath,
  getProductDetailEntrySource,
  isProductDetailEntrySourceResolvedForProduct,
  ProductDetailEntrySourceState,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  resolveProductDetailEntrySourceState,
} from "@/utils/productPath";
import {
  getMarketingAttributionCookiePayload,
  getShortTrackingMarketingAttributionFromSearch,
  hasShortTrackingMarketingLandingForPath,
  MARKETING_ATTRIBUTION_COOKIE_NAME,
  MARKETING_ATTRIBUTION_STORAGE_KEY,
  stripShortTrackingQueryFromCurrentUrl,
} from "@/utils/marketingAttribution";
import {
  resolveProductDetailSignalEntrySource,
  resolveProductEntryAttribution,
  type ProductEntryAttribution,
} from "@/utils/productEntryAttribution";
import {
  endProductTrace,
  logProductTrace,
  startProductTrace,
  updateProductTrace,
} from "@/utils/productTrace";
import {
  getGuestReadProgress,
  type GuestReadProgressRecord,
} from "@/utils/guestReadProgress";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  productId: number;
  initialProduct: IProduct | null;
  initialSearchParamString: string;
}

export default function ProductDetailClient({
  productId,
  initialProduct,
  initialSearchParamString,
}: Props) {
  const { user, isAuthenticated, accessToken, isAuthInitialized } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
    isAuthInitialized: state.isAuthInitialized,
  }));
  const canUseUserScope =
    isAuthInitialized && !!accessToken && !!user?.userId && isAuthenticated;
  const isUserScopePending =
    isAuthInitialized && !!accessToken && isAuthenticated && !user?.userId;
  const isAuthIdentitySettled = isAuthInitialized && !isUserScopePending;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useMemo(
    () => new URLSearchParams(initialSearchParamString),
    [initialSearchParamString]
  );
  const searchParamString = initialSearchParamString;
  const entrySourceParam = searchParams.get("entrySource");
  const focusParam = searchParams.get("focus");
  const shouldPrioritizeAiLibrarian = shouldFocusAiLibrarian(focusParam);
  const urlEntrySource = getProductDetailEntrySource(entrySourceParam);
  const [hasHiddenMarketingLanding, setHasHiddenMarketingLanding] =
    useState(false);
  const [marketingLandingChecked, setMarketingLandingChecked] = useState(false);
  const [marketingProductEntryAttribution, setMarketingProductEntryAttribution] =
    useState<ProductEntryAttribution | null>(null);
  const productDetailBackFallbackPath =
    getProductDetailMarketingBackFallbackPath(
      searchParamString,
      hasHiddenMarketingLanding
    );
  const [entrySourceState, setEntrySourceState] =
    useState<ProductDetailEntrySourceState>({
      productId: null,
      entrySource: null,
    });
  const entrySource = getEffectiveProductDetailEntrySource(
    urlEntrySource,
    entrySourceState,
    productId
  );
  const detailSignalEntrySource = resolveProductDetailSignalEntrySource(
    entrySource,
    marketingProductEntryAttribution
  );
  const entrySourceResolved = isProductDetailEntrySourceResolvedForProduct(
    entrySourceState,
    productId
  );
  const viewerEntrySource =
    entrySource === PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION
      ? entrySource
      : null;
  const [activeTab, setActiveTab] = useState("episode");
  const [
    hasDeferredProductDetailSecondaryData,
    setHasDeferredProductDetailSecondaryData,
  ] = useState(false);
  const [guestReadProgress, setGuestReadProgressState] =
    useState<GuestReadProgressRecord | null>(null);
  const [guestReadProgressReadyProductId, setGuestReadProgressReadyProductId] =
    useState<number | null>(null);
  const productDetailCacheIdentity = !isAuthInitialized || isUserScopePending
    ? "auth-pending"
    : canUseUserScope
      ? `user:${user.userId}`
      : "guest";
  const { data, isPending, isSuccess } = useSelectProductDetail(
    productId,
    productDetailCacheIdentity,
    isAuthInitialized && !isUserScopePending
  );
  const canLoadAiBrief =
    initialProduct?.productId === productId || isSuccess;
  const { setToast } = useToastStore();
  const { setHasNew } = useGiftBoxStore();
  const setAiLibrarianPanelOpen = useChatStore((state) => state.setIsOpen);
  const requestProductQuestion = useChatStore(
    (state) => state.requestProductQuestion
  );
  const queryClient = useQueryClient();
  const addRecentProductMutation = useAddRecentProduct();
  const { mutate: postAiSignalEvent } = usePostAiSignalEvent();
  const detailViewSignalKeyRef = useRef<string | null>(null);
  const aiLibrarianRef = useRef<HTMLDivElement>(null);
  const marketingBackHistorySeededPathRef = useRef<string | null>(null);
  const marketingBackHandledPathRef = useRef<string | null>(null);

  // Check if user has already received tickets for this product (using sessionStorage for current session)
  const ticketCheckKey = `rental_ticket_checked_${productId}`;
  const [hasCheckedTickets, setHasCheckedTickets] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(ticketCheckKey) === "true";
    }
    return false;
  });

  // Check for rental tickets when user first enters the product detail page
  const { data: rentalTicketsData } = useCheckRentalTickets(
    productId,
    canUseUserScope && !hasCheckedTickets
  );

  useEffect(() => {
    setHasDeferredProductDetailSecondaryData(false);
    if (!productId) return;

    const timer = window.setTimeout(() => {
      setHasDeferredProductDetailSecondaryData(true);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [productId]);

  const shouldLoadSecondaryProductDetailData =
    shouldPrioritizeAiLibrarian || (isSuccess && hasDeferredProductDetailSecondaryData);
  const shouldLoadComments =
    shouldLoadSecondaryProductDetailData || activeTab === "comment";

  // Always fetch content-based suggestions (추천1 내용비슷) for all users
  const { data: contentSuggestProducts } = useSelectSuggestProducts(
    productId,
    "content",
    shouldLoadSecondaryProductDetailData
  );

  // Fetch cart-based suggestions only when logged in (추천3-장바구니)
  const { data: cartSuggestProducts } = useSelectSuggestProducts(
    productId,
    "cart",
    canUseUserScope && shouldLoadSecondaryProductDetailData
  );

  const { data: episodes, isSuccess: isEpisodesSuccess } = useSelectEpisodes(
    productId,
    canUseUserScope ? user?.userId || null : null,
    1,
    25,
    "episodeNo",
    "asc"
  );

  const { episodeId, latestEpisodeNo, latestEpisodeTitle, firstEpisodeId, firstEpisodeTitle, episodeCount } =
    useMemo(() => {
      return {
        episodeId: episodes?.pages[0].data.latestEpisodeId ?? 0,
        latestEpisodeNo: episodes?.pages[0].data.latestEpisodeNo ?? 0,
        latestEpisodeTitle: episodes?.pages[0].data.latestEpisodeTitle ?? "",
        episodeCount: episodes?.pages[0].data.pagination.totalCount ?? 0,
        firstEpisodeId: episodes?.pages[0].data.episodes[0]?.episodeId ?? 0,
        firstEpisodeTitle: episodes?.pages[0].data.episodes[0]?.episodeTitle ?? "",
      };
    }, [episodes]);

  useEffect(() => {
    if (!isAuthIdentitySettled || canUseUserScope || !productId) {
      setGuestReadProgressState(null);
      setGuestReadProgressReadyProductId(null);
      return;
    }

    const refreshGuestReadProgress = () => {
      setGuestReadProgressState(getGuestReadProgress(productId));
      setGuestReadProgressReadyProductId(productId);
    };

    refreshGuestReadProgress();
    window.addEventListener("pageshow", refreshGuestReadProgress);
    window.addEventListener("focus", refreshGuestReadProgress);

    return () => {
      window.removeEventListener("pageshow", refreshGuestReadProgress);
      window.removeEventListener("focus", refreshGuestReadProgress);
    };
  }, [canUseUserScope, isAuthIdentitySettled, productId]);

  const hasRefreshedGuestReadProgress =
    guestReadProgressReadyProductId === productId;
  const isWebsochatReadScopeReady =
    isAuthIdentitySettled &&
    (canUseUserScope
      ? isEpisodesSuccess
      : hasRefreshedGuestReadProgress);

  const effectiveEpisodeId =
    !canUseUserScope && guestReadProgress ? guestReadProgress.episodeId : episodeId;
  const effectiveLatestEpisodeNo =
    !canUseUserScope && guestReadProgress
      ? guestReadProgress.episodeNo
      : latestEpisodeNo;
  const effectiveLatestEpisodeTitle =
    !canUseUserScope && guestReadProgress
      ? guestReadProgress.episodeTitle
      : latestEpisodeTitle;

  const {
    productData,
    evaluationData,
    noticeData,
    ownerEpisodes,
    episodeTypePaidCount,
    issuedVouchers,
  } = useMemo(() => {
    const episodeTypePaidCount =
      data?.data.episodes.filter(
        (ep) => ep.priceType === "paid" && ep.ownType !== "own"
      ).length || 0;
    return {
      productData: (data?.data.product ?? initialProduct) as IProduct,
      evaluationData: data?.data.evaluations ?? ({} as IEvaluation),
      noticeData: data?.data.notices,
      ownerEpisodes: data?.data.episodes ?? [],
      episodeTypePaidCount: episodeTypePaidCount,
      issuedVouchers: data?.data.issuedVouchers ?? [],
    };
  }, [data, initialProduct]);
  const isProductOwner =
    !!user?.userId && !!productData?.authorId && user.userId === productData.authorId;
  const isAdminCPEditor =
    user?.userRole === "CP" ||
    user?.userRole === "editor" ||
    user?.userRole === "admin";
  const shouldUseOwnerEpisodeList = canUseUserScope && (isProductOwner || isAdminCPEditor);
  const displayEpisodeCount = shouldUseOwnerEpisodeList
    ? ownerEpisodes.length
    : episodeCount;
  const productWaitForFreeYn =
    productData?.badge?.waitForFreeYn === "Y" ||
    productData?.badge?.waitingForFreeYn === "Y"
      ? "Y"
      : "N";
  const serialEpisodeOwnPrice =
    (productData?.seriesRegularPrice ?? 0) > 0
      ? productData?.seriesRegularPrice ?? 100
      : 100;
  const { data: aiBriefsData, isFetching: isAiBriefLoading } = useGetAiProductBriefs(
    [productId],
    productData?.adultYn === "Y" ? "Y" : "N",
    !!productId && canLoadAiBrief
  );
  const aiLibrarianBrief = aiBriefsData?.data?.[0] ?? null;
  const aiLibrarianCopy = useMemo(
    () =>
      productData && aiLibrarianBrief
        ? buildAiLibrarianCopy(productData, aiLibrarianBrief)
        : null,
    [aiLibrarianBrief, productData]
  );
  const handleAskAiLibrarianMore = () => {
    const productQuestion = {
      productId,
      prompt: productData?.title
        ? `${productData.title} 이 작품 어떤 작품인지 알려줘`
        : "이 작품 어떤 작품인지 알려줘",
    };
    openAiLibrarianPanel({
      setIsOpen: setAiLibrarianPanelOpen,
    });

    requestProductQuestion(productQuestion);
  };

  useEffect(() => {
    if (!aiLibrarianCopy || !shouldPrioritizeAiLibrarian) return;

    const timer = window.setTimeout(() => {
      aiLibrarianRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [aiLibrarianCopy, shouldPrioritizeAiLibrarian]);

  useEffect(() => {
    if (!pathname || typeof document === "undefined") {
      return;
    }

    const isMarketingLanding = hasShortTrackingMarketingLandingForPath(
      document.cookie,
      pathname
    );
    const shortTrackingAttribution =
      typeof window !== "undefined"
        ? getShortTrackingMarketingAttributionFromSearch(
            window.location.search,
            pathname
          )
        : null;
    const hasShortTrackingQueryLanding = Boolean(shortTrackingAttribution);
    setHasHiddenMarketingLanding(isMarketingLanding || hasShortTrackingQueryLanding);
    setMarketingLandingChecked(true);

    if (!isMarketingLanding && !hasShortTrackingQueryLanding) {
      setMarketingProductEntryAttribution(null);
      return;
    }

    const attribution =
      shortTrackingAttribution ||
      getMarketingAttributionCookiePayload(document.cookie);
    if (attribution && typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(
          MARKETING_ATTRIBUTION_STORAGE_KEY,
          JSON.stringify(attribution)
        );
      } catch {
        // Attribution persistence must not block product rendering.
      }

      setMarketingProductEntryAttribution(
        resolveProductEntryAttribution({
          pathname,
          referrerPath: null,
          entrySource: urlEntrySource,
          marketingAttribution: attribution,
        })
      );
    }

    document.cookie = `${MARKETING_ATTRIBUTION_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
    stripShortTrackingQueryFromCurrentUrl();
  }, [pathname, urlEntrySource]);

  useEffect(() => {
    if (
      !productDetailBackFallbackPath ||
      !pathname ||
      !Number.isFinite(productId)
    ) {
      return;
    }

    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (window.location.pathname !== pathname) {
      return;
    }

    const currentState =
      typeof window.history.state === "object" && window.history.state !== null
        ? window.history.state
        : null;
    const isAlreadySeeded =
      marketingBackHistorySeededPathRef.current === currentPath ||
      currentState?.likenovelProductDetailMarketingBackSeeded === currentPath;

    if (isAlreadySeeded) {
      marketingBackHistorySeededPathRef.current = currentPath;
    } else {
      // Add a same-URL sentinel so browser Back fires popstate before leaving.
      window.history.pushState(
        {
          ...(currentState ?? {}),
          likenovelProductDetailMarketingBackSeeded: currentPath,
        },
        "",
        currentPath
      );
      marketingBackHistorySeededPathRef.current = currentPath;
    }

    const handleMarketingBack = () => {
      if (
        marketingBackHandledPathRef.current === currentPath ||
        window.location.pathname !== pathname
      ) {
        return;
      }

      marketingBackHandledPathRef.current = currentPath;
      router.replace(productDetailBackFallbackPath);
    };

    window.addEventListener("popstate", handleMarketingBack);
    return () => {
      window.removeEventListener("popstate", handleMarketingBack);
    };
  }, [pathname, productDetailBackFallbackPath, productId, router]);

  useEffect(() => {
    logProductTrace(
      "product-page",
      "derived-product-state",
      {
        hasProductData: !!productData,
        title: productData?.title ?? null,
        priceType: productData?.priceType ?? null,
        singleRegularPrice: productData?.singleRegularPrice ?? null,
        singleRentalPrice: productData?.singleRentalPrice ?? null,
        seriesRegularPrice: productData?.seriesRegularPrice ?? null,
        coverImagePath: productData?.image?.coverImagePath ?? null,
        episodeTypePaidCount,
      },
      {
        pathname,
        productId,
      }
    );
  }, [episodeTypePaidCount, pathname, productData, productId]);

  const adultYn = user?.isOnAdult || user?.isAdult ? "Y" : "N";
  const { data: otherProducts } = useSelectAuthorProducts(
    productData?.authorId,
    productData?.productId,
    adultYn,
    shouldLoadSecondaryProductDetailData
  );

  // 댓글 영역 ref (스크롤 이벤트 처리용)
  const commentRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  const { data: comments } = useSelectComment(
    Number(productId),
    1,
    6,
    "recommend",
    true,
    shouldLoadComments
  );

  useEffect(() => {
    startProductTrace({
      pathname,
      productId,
    });
    updateProductTrace({
      pathname,
      productId,
    });

    return () => {
      endProductTrace("product-page-unmount", {
        pathname,
        productId,
      });
    };
  }, [pathname, productId]);

  useEffect(() => {
    logProductTrace(
      "product-page",
      "query-state",
      {
        isPending,
        isSuccess,
        hasData: !!data?.data?.product,
        title: data?.data?.product?.title ?? null,
        coverImagePath: data?.data?.product?.image?.coverImagePath ?? null,
        latestEpisodeId: data?.data?.product?.latestEpisodeId ?? null,
        episodeCount: data?.data?.episodes?.length ?? 0,
      },
      {
        pathname,
        productId,
      }
    );
  }, [data, isPending, isSuccess, pathname, productId]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Call API to add recent product if user is logged in
  useEffect(() => {
    if (canUseUserScope && user?.userRole && productId) {
      addRecentProductMutation.mutate(productId);
      queryClient.invalidateQueries({
        queryKey: ["getRecentProduct"],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseUserScope, user?.userId, user?.userRole, productId]);

  useEffect(() => {
    const consumedEntrySource = consumeProductDetailEntrySource(
      productId,
      urlEntrySource
    );
    setEntrySourceState((current) =>
      resolveProductDetailEntrySourceState(
        current,
        productId,
        consumedEntrySource
      )
    );
  }, [productId, urlEntrySource]);

  useEffect(() => {
    if (!canUseUserScope || !isSuccess || !productData?.productId || !user?.userId) {
      return;
    }

    if (!entrySourceResolved || !marketingLandingChecked) {
      return;
    }

    if (productData?.privateYn === "Y" && !productData?.title) {
      return;
    }

    const signalKey = `${productData.productId}:${user.userId}`;
    if (detailViewSignalKeyRef.current === signalKey) {
      return;
    }

    detailViewSignalKeyRef.current = signalKey;
    postAiSignalEvent(
      {
        product_id: productData.productId,
        event_type: "product_detail_view",
        event_payload: detailSignalEntrySource
          ? { entry_source: detailSignalEntrySource }
          : undefined,
      },
      {
        onError: (error) => {
          console.error("[aiSignal] product_detail_view failed", error);
        },
      }
    );
  }, [
    canUseUserScope,
    detailSignalEntrySource,
    entrySourceResolved,
    isSuccess,
    marketingLandingChecked,
    postAiSignalEvent,
    productData?.privateYn,
    productData?.productId,
    productData?.title,
    user?.userId,
  ]);

  useEffect(() => {
    const MAX_RECENT_PRODUCTS = 50;

    if (productData) {
      const extendedProductData = {
        ...productData,
        episodeId: episodeId || null,
        latestEpisodeNo: latestEpisodeNo || 0,
        episodeCount: episodeCount || 0,
        firstEpisodeId: firstEpisodeId || null,
      };

      const existingProducts = JSON.parse(
        localStorage.getItem("recent_viewed_products") || "[]"
      );

      const updatedProducts = [
        extendedProductData,
        ...existingProducts.filter(
          (item: { productId: number }) =>
            item.productId !== productData.productId
        ),
      ];

      if (updatedProducts.length > MAX_RECENT_PRODUCTS) {
        updatedProducts.pop();
      }

      localStorage.setItem(
        "recent_viewed_products",
        JSON.stringify(updatedProducts)
      );
    }
  }, [productData, episodeId, latestEpisodeNo, episodeCount, firstEpisodeId]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < scrollY) {
        setActiveTab("episode");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrollY, activeTab]);

  useEffect(() => {
    if (activeTab === "comment") {
      commentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      const handleScroll = () => {
        setScrollY(window.scrollY);
      };
      window.addEventListener("scroll", handleScroll);
      const scrollEndTimeout = setTimeout(() => {
        window.removeEventListener("scroll", handleScroll);
      }, 1000);
      return () => {
        clearTimeout(scrollEndTimeout);
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [activeTab]);

  // Handle rental ticket toast display
  useEffect(() => {
    // 336, 337, 339, 342
    if (rentalTicketsData && !hasCheckedTickets) {
      const {
        firstTimeVisitorTickets,
        earlyReaderTickets,
        waitForFreeTickets,
        sixToNinePassTickets,
        eventTickets,
        totalReceived,
      } = rentalTicketsData.data;

      if (totalReceived > 0) {
        let message = "";
        const receivedSources = [];

        // Check which sources provided tickets
        if (firstTimeVisitorTickets > 0)
          receivedSources.push("firstTimeVisitor");
        if (earlyReaderTickets > 0) receivedSources.push("earlyReader");
        if (waitForFreeTickets > 0) receivedSources.push("waitForFree");
        if (sixToNinePassTickets > 0) receivedSources.push("sixToNinePass");
        if (eventTickets > 0) receivedSources.push("event");

        // Case 1: Only first-time visitor tickets (첫방문자 무료 대여권)
        if (receivedSources.length === 1 && firstTimeVisitorTickets > 0) {
          message = `첫방문자 무료 대여권이 ${firstTimeVisitorTickets}장 지급 되었습니다`;
          // message = `해당 작품의 대여권을 ${firstTimeVisitorTickets}장 받았습니다`;
        }
        // Case 2: Only wait-for-free tickets (기다리면 무료)
        else if (receivedSources.length === 1 && waitForFreeTickets > 0) {
          message = `기다리면 무료 대여권이 지급 되었습니다.`;
          // message = `해당 작품의 대여권을 ${waitForFreeTickets}장 받았습니다`;
        }
        // Case 3: Only 6-9 pass tickets (6-9 패스)
        else if (receivedSources.length === 1 && sixToNinePassTickets > 0) {
          message = `6-9패스 대여권이 지급 되었습니다.`;
          // message = `해당 작품의 대여권을 ${sixToNinePassTickets}장 받았습니다`;
        }
        // Case 4: Only early reader tickets (선작 독자)
        else if (receivedSources.length === 1 && earlyReaderTickets > 0) {
          message = `해당 작품의 대여권을 ${earlyReaderTickets}장 받았습니다`;
        }
        // Case 5: Only event tickets
        else if (receivedSources.length === 1 && eventTickets > 0) {
          message = `해당 작품의 대여권을 ${totalReceived}장 받았습니다`;
        }
        // Case 6: Multiple sources - show total
        else {
          message = `해당 작품 대여권 ${totalReceived}장 받았습니다`;
        }

        // Invalidate user info query to update ticket count in GlobalMenu
        queryClient.invalidateQueries({
          queryKey: ["selectUserInfo"],
        });
        queryClient.invalidateQueries({
          queryKey: ["getEpisodeList"],
        });

        // setToast({
        //   message,
        //   type: "success",
        // });
      }

      // Mark as checked in both state and sessionStorage
      setHasCheckedTickets(true);
      // if (typeof window !== "undefined") {
      //   sessionStorage.setItem(ticketCheckKey, "true");
      // }
    }
  }, [
    rentalTicketsData,
    hasCheckedTickets,
    setToast,
    ticketCheckKey,
    queryClient,
  ]);

  // Check for issued vouchers and show toast messages
  const voucherCheckKey = `issued_vouchers_checked_${productId}`;
  const [hasCheckedVouchers, setHasCheckedVouchers] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(voucherCheckKey) === "true";
    }
    return false;
  });

  console.log("issuedVouchers", issuedVouchers);

  useEffect(() => {
    if (issuedVouchers && issuedVouchers.length > 0 && !hasCheckedVouchers) {
      // Show toast message for each issued voucher type
      issuedVouchers.forEach((voucher) => {
        // let message = "";

        // switch (voucherType) {
        //   case "free-for-first":
        //   case "firstTimeVisitor":
        //     message = "첫방문자 무료 대여권이 지급 되었습니다";
        //     break;
        //   case "wait-for-free":
        //   case "waitForFree":
        //     message = "기다리면 무료 대여권이 지급 되었습니다.";
        //     break;
        //   case "6-9-pass":
        //   case "sixToNinePass":
        //     message = "6-9패스 대여권이 지급 되었습니다.";
        //     break;
        //   case "reader-of-prev":
        //   case "earlyReader":
        //     message = "선작 독자 무료 대여권이 지급 되었습니다.";
        //     break;
        //   default:
        //     message = `${voucherType} 대여권이 지급 되었습니다.`;
        // }

        if (voucher) {
          setToast({
            message: voucher.message,
            type: "success",
          });
          setHasNew(true);
        }
      });

      // Invalidate user info query to update ticket count
      queryClient.invalidateQueries({
        queryKey: ["selectUserInfo"],
      });

      // Refetch product detail to update voucher information
      queryClient.invalidateQueries({
        queryKey: ["selectProductDetail", productId],
      });

      // Mark as checked in both state and sessionStorage
      setHasCheckedVouchers(true);
      // if (typeof window !== "undefined") {
      //   sessionStorage.setItem(voucherCheckKey, "true");
      // }
    }
  }, [
    issuedVouchers,
    hasCheckedVouchers,
    setToast,
    voucherCheckKey,
    queryClient,
    productId,
  ]);

  // 비공개 작품 접근 차단
  if (isSuccess && productData?.privateYn === "Y" && !productData?.title) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-16pxr">
        <span className="text-18pxr md:text-22pxr font-semibold text-dark-gray-400">
          비공개 작품이거나 존재하지 않는 작품입니다.
        </span>
        <button
          className="text-primary-100 text-14pxr md:text-16pxr"
          onClick={() => router.push("/")}
        >
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <ProductDetailWrapper
      productId={productId}
      authorId={productData?.authorId}
      authorName={productData?.authorNickname}
      isPaidProduct={productData?.priceType === "paid"}
      isVolumeProduct={
        (productData?.singleRegularPrice ?? 0) > 0 &&
        (productData?.seriesRegularPrice ?? 0) <= 0
      }
      episodeTypePaidCount={episodeTypePaidCount}
      ownPrice={productData?.singleRegularPrice ?? 0}
      rentalPrice={productData?.singleRentalPrice ?? 0}
      interestStatus={productData?.interestStatus}
      interestEndDate={productData?.badge?.interestEndDate}
      productName={productData?.title}
      coverImagePath={productData?.image?.coverImagePath ?? null}
      publishedLatestEpisodeNo={productData?.latestEpisodeNo ?? null}
      syncedLatestEpisodeNo={productData?.syncedLatestEpisodeNo ?? null}
      contextStatus={
        typeof (productData as { contextStatus?: string | null } | undefined)
          ?.contextStatus === "string"
          ? (productData as { contextStatus?: string | null }).contextStatus
          : null
      }
    >
      <div className="flex flex-col items-center">
        <div className="w-full bg-light-gray-100 mt-[-50px] md:pb-66pxr">
          <div className="h-[50px]" />
          <ProductCoverArea
            data={productData}
            isSuccess={!!productData}
            isLoading={!productData}
            evaluations={mergeKeysEvaluation(evaluationData as IEvaluation)}
            episodeId={effectiveEpisodeId}
            latestEpisodeNo={effectiveLatestEpisodeNo}
            isWebsochatReadScopeReady={isWebsochatReadScopeReady}
            latestEpisodeTitle={effectiveLatestEpisodeTitle}
            episodeCount={displayEpisodeCount}
            firstEpisodeId={firstEpisodeId}
            firstEpisodeTitle={firstEpisodeTitle}
            entrySource={viewerEntrySource}
            backFallbackPath={productDetailBackFallbackPath}
          />
        </div>
        <ProductDetailCharacterChatSection
          productId={productId}
          adultYn={adultYn}
          cacheIdentity={productDetailCacheIdentity}
          enabled={isAuthIdentitySettled}
        />
        {productData && (isAiBriefLoading || aiLibrarianCopy) && (
          <div
            ref={aiLibrarianRef}
            className="w-full max-w-[800px] mt-20pxr md:mt-24pxr scroll-mt-[88px]"
          >
            <AiLibrarianDetailCard
              copy={aiLibrarianCopy}
              isLoading={isAiBriefLoading && !aiLibrarianCopy}
              onAskMore={handleAskAiLibrarianMore}
            />
          </div>
        )}
        <div className="flex w-full max-w-[800px] mt-30pxr md:mt-10pxr">
          <Tab
            tabs={[
              {
                label: (
                  <>
                    <span>작품 회차</span>
                    <span
                      className={`${
                        activeTab === "episode" ? "text-primary-100" : ""
                      } `}
                    >
                      &nbsp;{displayEpisodeCount || 0}
                    </span>
                  </>
                ),
                value: "episode",
              },
              {
                label: (
                  <>
                    <span>댓글</span>
                    <span
                      className={`${
                        activeTab === "comment" ? "text-primary-100" : ""
                      } `}
                    >
                      &nbsp;{comments?.pages[0].data.commentTotalCount || 0}
                    </span>
                  </>
                ),
                value: "comment",
              },
            ]}
            style="underline"
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
        <div className="flex w-full max-w-[1120px] mx-auto gap-50pxr">
          <div className="flex flex-col mt-50pxr w-full md:w-[70%] gap-40pxr">
            <ProductEpisodes
              productId={productId}
              productTitle={productData?.title}
              authorId={productData?.authorId}
              notices={noticeData || []}
              priceType={productData?.priceType}
              episodeCount={displayEpisodeCount}
              paidEpisodeNo={productData?.paidEpisodeNo}
              waitForFreeYn={productWaitForFreeYn}
              episodeOwnPrice={serialEpisodeOwnPrice}
              bulkPurchasePrice={
                episodeTypePaidCount
                  ? episodeTypePaidCount * serialEpisodeOwnPrice
                  : 0
              }
              bulkPurchaseEpisodeCount={episodeTypePaidCount}
              entrySource={viewerEntrySource}
              initialOwnerEpisodes={shouldUseOwnerEpisodeList ? ownerEpisodes : undefined}
            />
            <div
              ref={commentRef}
              className="flex flex-col gap-18pxr px-16pxr md:px-0"
            >
              <span className="text-18pxr md:text-22pxr font-bold">
                작품 전체 댓글 {comments?.pages[0].data.commentTotalCount || 0}
                개
              </span>
              <CommentArea
                pageType="product"
                productId={productId}
                hasEpisode
                keepPreviousData
                hasAuthorFixedComment
                enabled={shouldLoadComments}
              />
            </div>
            <div className="hidden md:block">
              {/* 추천1 내용비슷 - Always show for all users */}
              {(contentSuggestProducts?.data?.length ?? 0) > 0 && (
                <SuggestProducts
                  products={contentSuggestProducts?.data ?? []}
                  entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.PRODUCT_DETAIL_CONTENT_SUGGEST}
                />
              )}
              {/* 추천3-장바구니 - Only show for logged in users */}
              {user &&
                user.userRole &&
                (cartSuggestProducts?.data?.length ?? 0) > 0 && (
                  <SuggestProducts
                    products={cartSuggestProducts?.data ?? []}
                    title="선호작 추천"
                    entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.PRODUCT_DETAIL_CART_SUGGEST}
                  />
                )}
            </div>
            <div className="md:hidden flex flex-col gap-40pxr">
              {/* 추천1 내용비슷 - Always show for all users */}
              {(contentSuggestProducts?.data?.length ?? 0) > 0 && (
                <MobileProducts
                  headerText="추천 작품"
                  products={contentSuggestProducts?.data ?? []}
                  entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.PRODUCT_DETAIL_CONTENT_SUGGEST}
                />
              )}
              {/* 추천3-장바구니 - Only show for logged in users */}
              {user &&
                user.userRole &&
                (cartSuggestProducts?.data?.length ?? 0) > 0 && (
                  <MobileProducts
                    headerText="선호작 추천"
                    products={cartSuggestProducts?.data ?? []}
                    entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.PRODUCT_DETAIL_CART_SUGGEST}
                  />
                )}
              <MobileProducts
                headerText="작가의 다른 작품"
                products={otherProducts?.data.products ?? []}
                entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.PRODUCT_DETAIL_SAME_AUTHOR}
                emptyMessage="이 작가의 다른 작품이 없습니다."
              />
            </div>
          </div>
          <div className="hidden md:block w-[30%] mt-50pxr">
            <SameAuthorProducts
              products={otherProducts?.data.products ?? []}
              entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.PRODUCT_DETAIL_SAME_AUTHOR}
            />
          </div>
        </div>
      </div>
    </ProductDetailWrapper>
  );
}
