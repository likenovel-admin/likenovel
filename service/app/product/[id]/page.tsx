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
import CommentArea from "@/components/common/CommentArea";
import MobileProducts from "@/components/common/MobileProducts";
import Tab from "@/components/common/Tab";
import ProductCoverArea from "@/components/productDetail/ProductCoverArea";
import ProductDetailWrapper from "@/components/productDetail/ProductDetailWrapper";
import ProductEpisodes from "@/components/productDetail/ProductEpisodes";
import SameAuthorProducts from "@/components/productDetail/SameAuthorProducts";
import SuggestProducts from "@/components/productDetail/SuggestProducts";
import useAuthStore from "@/store/authStore";
import useGiftBoxStore from "@/store/giftboxStore";
import useToastStore from "@/store/toastStore";
import { IEvaluation, IProduct } from "@/types";
import { mergeKeysEvaluation } from "@/utils/common";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function ProductDetail() {
  const { user, isAuthenticated, accessToken } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
  }));
  const canUseUserScope = !!accessToken && !!user?.userId && isAuthenticated;
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname.split("/");
  const productId = Number(pathSegments[pathSegments.length - 1]);
  const [activeTab, setActiveTab] = useState("episode");
  const { data, isPending, isSuccess } = useSelectProductDetail(productId);
  const { setToast } = useToastStore();
  const { setHasNew } = useGiftBoxStore();
  const queryClient = useQueryClient();
  const addRecentProductMutation = useAddRecentProduct();

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

  // Always fetch content-based suggestions (추천1 내용비슷) for all users
  const { data: contentSuggestProducts } = useSelectSuggestProducts(
    productId,
    "content"
  );

  // Fetch cart-based suggestions only when logged in (추천3-장바구니)
  const { data: cartSuggestProducts } = useSelectSuggestProducts(
    productId,
    "cart",
    canUseUserScope
  );

  const { data: episodes } = useSelectEpisodes(
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

  const {
    productData,
    evaluationData,
    noticeData,
    episodeTypePaidCount,
    issuedVouchers,
  } = useMemo(() => {
    const episodeTypePaidCount =
      data?.data.episodes.filter(
        (ep) =>
          ep.priceType === "paid" &&
          ep.ownType !== "own" &&
          ep.ownType !== "rental"
      ).length || 0;
    return {
      productData: data?.data.product as IProduct,
      evaluationData: data?.data.evaluations ?? ({} as IEvaluation),
      noticeData: data?.data.notices,
      episodeTypePaidCount: episodeTypePaidCount,
      issuedVouchers: data?.data.issuedVouchers ?? [],
    };
  }, [data]);

  const adultYn = user?.isOnAdult || user?.isAdult ? "Y" : "N";
  const { data: otherProducts } = useSelectAuthorProducts(
    productData?.authorId,
    productData?.productId,
    adultYn
  );

  // 댓글 영역 ref (스크롤 이벤트 처리용)
  const commentRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  const { data: comments } = useSelectComment(
    Number(productId),
    1,
    6,
    "recommend"
  );

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
    >
      <div className="flex flex-col items-center">
        <div className="w-full bg-light-gray-100 mt-[-50px] md:pb-66pxr">
          <div className="h-[50px]" />
          <ProductCoverArea
            data={productData}
            isSuccess={isSuccess}
            isLoading={isPending}
            evaluations={mergeKeysEvaluation(evaluationData as IEvaluation)}
            episodeId={episodeId}
            latestEpisodeNo={latestEpisodeNo}
            latestEpisodeTitle={latestEpisodeTitle}
            episodeCount={episodeCount}
            firstEpisodeId={firstEpisodeId}
            firstEpisodeTitle={firstEpisodeTitle}
          />
        </div>
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
                      &nbsp;{episodeCount || 0}
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
              notices={noticeData || []}
              priceType={productData?.priceType}
              episodeCount={episodeCount}
              waitForFreeYn={productData?.badge?.waitForFreeYn || productData?.badge?.waitingForFreeYn}
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
              />
            </div>
            <div className="hidden md:block">
              {/* 추천1 내용비슷 - Always show for all users */}
              {(contentSuggestProducts?.data?.length ?? 0) > 0 && (
                <SuggestProducts
                  products={contentSuggestProducts?.data ?? []}
                />
              )}
              {/* 추천3-장바구니 - Only show for logged in users */}
              {user &&
                user.userRole &&
                (cartSuggestProducts?.data?.length ?? 0) > 0 && (
                  <SuggestProducts
                    products={cartSuggestProducts?.data ?? []}
                    title="선호작 추천"
                  />
                )}
            </div>
            <div className="md:hidden flex flex-col gap-40pxr">
              {/* 추천1 내용비슷 - Always show for all users */}
              {(contentSuggestProducts?.data?.length ?? 0) > 0 && (
                <MobileProducts
                  headerText="추천 작품"
                  products={contentSuggestProducts?.data ?? []}
                />
              )}
              {/* 추천3-장바구니 - Only show for logged in users */}
              {user &&
                user.userRole &&
                (cartSuggestProducts?.data?.length ?? 0) > 0 && (
                  <MobileProducts
                    headerText="선호작 추천"
                    products={cartSuggestProducts?.data ?? []}
                  />
                )}
              {(otherProducts?.data?.products.length ?? 0) > 0 && (
                <MobileProducts
                  headerText="작가의 다른 작품"
                  products={otherProducts?.data.products ?? []}
                />
              )}
            </div>
          </div>
          <div className="hidden md:block w-[30%] mt-50pxr">
            {(otherProducts?.data?.products.length ?? 0) > 0 && (
              <SameAuthorProducts
                products={otherProducts?.data.products ?? []}
              />
            )}
          </div>
        </div>
      </div>
    </ProductDetailWrapper>
  );
}
