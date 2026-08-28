"use client";
import FloatingDock from "@/components/common/FloatingDock";
import Spinner from "@/components/common/Spinner";
import AuthorStartCta from "@/components/main/AuthorStartCta";
import BottomBanner from "@/components/main/BottomBanner";
import BottomProducts from "@/components/main/BottomProducts";
import Carousel from "@/components/main/Carousel";
import CharacterSlot from "@/components/main/CharacterSlot";
import CompanyNoticeCarousel from "@/components/main/CompanyNoticeCarousel";
import CPPromotion from "@/components/main/CPPromotion";
import FreeTop from "@/components/main/FreeTop";
import HomeTicker from "@/components/main/HomeTicker";
import LatestUpdate from "@/components/main/LatestUpdate";
import RisingPick from "@/components/main/RisingPick";
import MiddleBanner from "@/components/main/MiddleBanner";
import MiddleMenu from "@/components/main/MiddleMenu";
import PaidTop from "@/components/main/PaidTop";
import RecentlyView from "@/components/main/RecentlyView";
import SingleSlot from "@/components/main/SingleSlot";
import Footer from "@/components/menu/Footer";
import GlobalNav from "@/components/menu/GlobalNav";
import TasteSection from "@/components/recommendation/TasteSection";
import OnboardingModal from "@/components/recommendation/OnboardingModal";
import { IProduct } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useSelectPanels } from "./api/query/banner";
import type { IPanel } from "./api/query/banner/dto";
import {
  useGetDirectRecommend,
  useGetHomeTicker,
  useGetRisingPicks,
  useGetMainCharacterSlots,
  useGetMainSingleSlots,
  useSelectInterestDropSoonUpdateProducts,
  useSelectLatestUpdateProducts,
  useSelectMainRuleSlots,
  useSelectMainSuggestProducts,
  useSelectProducts,
} from "./api/query/product";
import { ISectionData } from "./api/query/product/dto";
import { useGetTasteRecommendations } from "./api/query/recommendation";
import { IRecommendSection } from "./api/query/recommendation/dto";
import {
  ONBOARDING_FIRST_LOGIN_SESSION_KEY,
  ONBOARDING_STATUS_CHANGED_EVENT,
} from "@/constants/onboarding";
import useAuthStore from "@/store/authStore";
import { getHomeQueryState } from "@/utils/homeQueryState";
import { PRODUCT_DETAIL_ENTRY_SOURCE } from "@/utils/productPath";

const COMPANY_NOTICE_BANNER_POSITION = "companyNotice";

const getCompanyNoticeItemsFromPanels = (panels?: IPanel[]) => {
  return (panels ?? [])
    .map((panel) => ({
      id: panel.id,
      imageSrc: panel.pcImgPath || panel.mobileImgPath,
      linkPath: panel.linkPath,
      ariaLabel: `${panel.id}번 회사 공지 배너`,
    }))
    .filter((item) => item.imageSrc);
};

export default function HomePageClient() {
  const { user, isAuthenticated, accessToken, isAuthInitialized } = useAuthStore();
  const adultYn = user?.isOnAdult ? "Y" : "N";
  const homeQueryState = getHomeQueryState({
    isAuthInitialized,
    isAuthenticated,
    accessToken,
    userId: user?.userId,
  });
  const canUseTasteRecommend = homeQueryState.canUseUserScopedQueries;
  const canUseInterestDropSoon = homeQueryState.canUseUserScopedQueries;
  const mainProductCacheIdentity = homeQueryState.productCacheIdentity;
  const userScopedCacheIdentity =
    homeQueryState.userScopedCacheIdentity ?? "guest";
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasFirstLoginOnboarding, setHasFirstLoginOnboarding] = useState(false);

  const { data, isSuccess } = useSelectProducts(
    adultYn,
    mainProductCacheIdentity,
    homeQueryState.enabled
  );
  const { data: suggestProductsData } = useSelectMainSuggestProducts(
    adultYn,
    mainProductCacheIdentity,
    homeQueryState.enabled
  );
  const { data: mainRuleSlotsData } = useSelectMainRuleSlots(
    adultYn,
    mainProductCacheIdentity,
    homeQueryState.enabled
  );
  const { data: latestUpdateData } = useSelectLatestUpdateProducts(
    adultYn,
    mainProductCacheIdentity,
    homeQueryState.enabled
  );
  const { data: risingPicksData } = useGetRisingPicks(
    adultYn,
    homeQueryState.enabled,
    mainProductCacheIdentity
  );
  const { data: interestDropSoonData } =
    useSelectInterestDropSoonUpdateProducts(
      adultYn,
      homeQueryState.enabled && canUseInterestDropSoon,
      userScopedCacheIdentity
    );
  const { data: directRecommendData } = useGetDirectRecommend(
    adultYn,
    homeQueryState.enabled,
    mainProductCacheIdentity
  );
  const {
    data: homeTickerData,
    isSuccess: isHomeTickerSuccess,
  } = useGetHomeTicker(
    adultYn,
    homeQueryState.enabled,
    mainProductCacheIdentity
  );
  const { data: mainSingleSlotsData } = useGetMainSingleSlots(
    adultYn,
    homeQueryState.enabled,
    mainProductCacheIdentity
  );
  const { data: mainCharacterSlotsData } = useGetMainCharacterSlots(
    adultYn,
    homeQueryState.enabled,
    mainProductCacheIdentity
  );
  const { data: companyNoticeBannerData } = useSelectPanels({
    division: COMPANY_NOTICE_BANNER_POSITION,
    enabled: homeQueryState.enabled,
  });
  const { data: tasteRecommendationsData } = useGetTasteRecommendations(
    adultYn,
    homeQueryState.enabled && canUseTasteRecommend,
    userScopedCacheIdentity
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pendingOnboarding =
      sessionStorage.getItem(ONBOARDING_FIRST_LOGIN_SESSION_KEY) === "Y";
    setHasFirstLoginOnboarding(pendingOnboarding);
  }, [canUseTasteRecommend]);

  useEffect(() => {
    if (!canUseTasteRecommend || !hasFirstLoginOnboarding) return;
    setShowOnboarding(true);
  }, [canUseTasteRecommend, hasFirstLoginOnboarding]);

  const handleCloseOnboarding = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ONBOARDING_FIRST_LOGIN_SESSION_KEY);
      window.dispatchEvent(new Event(ONBOARDING_STATUS_CHANGED_EVENT));
    }
    setHasFirstLoginOnboarding(false);
    setShowOnboarding(false);
  };

  const suggestProducts = useMemo(() => {
    return suggestProductsData?.data ?? [];
  }, [suggestProductsData]);
  const featureSections = useMemo<ISectionData[]>(() => {
    const directSections =
      directRecommendData?.data?.map((directProduct, index) => ({
        products: directProduct?.productList || [],
        suggestId: index + 1,
        suggestName: directProduct?.title || "",
        suggestTarget: "",
        suggestTitle: directProduct?.title || "",
      })) ?? [];
    const suggestSections = suggestProducts.map((suggestProduct) => suggestProduct.sectionData);
    const combined = [...directSections, ...suggestSections];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined;
  }, [directRecommendData, suggestProducts]);
  const mainRuleSlotSections = useMemo<ISectionData[]>(
    () => mainRuleSlotsData?.data ?? [],
    [mainRuleSlotsData]
  );
  const shouldShowTasteSections = useMemo(() => {
    if (!canUseTasteRecommend) return false;
    return tasteRecommendationsData?.data?.needs_onboarding !== true;
  }, [canUseTasteRecommend, tasteRecommendationsData]);
  const tasteSections = useMemo<IRecommendSection[]>(
    () =>
      shouldShowTasteSections
        ? tasteRecommendationsData?.data?.sections ?? []
        : [],
    [shouldShowTasteSections, tasteRecommendationsData]
  );
  const mixedSections = useMemo<
    Array<{ type: "feature"; section: ISectionData } | { type: "ai"; section: IRecommendSection }>
  >(() => {
    const mixed: Array<
      { type: "feature"; section: ISectionData } | { type: "ai"; section: IRecommendSection }
    > = [];
    const maxLength = Math.max(featureSections.length, tasteSections.length);
    for (let index = 0; index < maxLength; index += 1) {
      if (featureSections[index]) {
        mixed.push({ type: "feature", section: featureSections[index] });
      }
      if (tasteSections[index]) {
        mixed.push({ type: "ai", section: tasteSections[index] });
      }
    }
    return mixed;
  }, [featureSections, tasteSections]);
  const visibleMixedSections = useMemo(
    () => mixedSections.filter((item) => item.section.products.length > 0),
    [mixedSections]
  );
  const mainSingleSlotsByKey = useMemo(() => {
    return new Map(
      (mainSingleSlotsData?.data ?? []).map((slot) => [slot.slotKey, slot])
    );
  }, [mainSingleSlotsData]);
  const beforePaidTopSingleSlot = mainSingleSlotsByKey.get("before_paid_top");
  const betweenDirectRecommendFirstSingleSlot = mainSingleSlotsByKey.get(
    "between_direct_recommend_1"
  );
  const betweenDirectRecommendSecondSingleSlot = mainSingleSlotsByKey.get(
    "between_direct_recommend_2"
  );

  const freeTopProducts: IProduct[] = [];
  const paidTopProducts: IProduct[] = [];
  isSuccess &&
    data?.topsProducts &&
    Array.isArray(data.topsProducts) &&
    data.topsProducts.map((product: IProduct) => {
      product?.area === "freeSerialTop" && freeTopProducts.push(product);
      product?.area === "paidMainTop" && paidTopProducts.push(product);
    });

  const cpPromotionProducts = Array.isArray(data?.publisherPromotionProducts)
    ? data.publisherPromotionProducts.slice(0, 12)
    : [];
  const hasCpPromotionProducts = cpPromotionProducts.length > 0;
  const latestUpdateProducts = latestUpdateData?.data || [];
  const hasLatestUpdateProducts = latestUpdateProducts.length > 0;
  const risingPickItems = risingPicksData?.items ?? [];
  const interestDropSoonProducts = interestDropSoonData?.data || [];
  const hasInterestDropSoonProducts =
    canUseInterestDropSoon && interestDropSoonProducts.length > 0;
  const firstSingleSlotAfterMixedIndex = 0;
  const secondSingleSlotAfterMixedIndex = hasCpPromotionProducts ? 1 : 2;
  const shouldRenderFirstSingleSlotAfterLatest =
    Boolean(betweenDirectRecommendFirstSingleSlot) &&
    !hasCpPromotionProducts &&
    visibleMixedSections.length === 0 &&
    hasLatestUpdateProducts;
  const shouldRenderSecondSingleSlotAfterLatest =
    Boolean(betweenDirectRecommendSecondSingleSlot) &&
    visibleMixedSections.length <= secondSingleSlotAfterMixedIndex &&
    hasLatestUpdateProducts &&
    !shouldRenderFirstSingleSlotAfterLatest;

  const recommendProducts = Array.isArray(data?.topsProducts)
    ? data.topsProducts.slice(0, 8)
    : [];
  const companyNoticeCmsItems = useMemo(
    () => getCompanyNoticeItemsFromPanels(companyNoticeBannerData?.data),
    [companyNoticeBannerData?.data]
  );
  const companyNoticeItems =
    companyNoticeCmsItems.length > 0 ? companyNoticeCmsItems : undefined;
  const mainCharacterSlotItems = mainCharacterSlotsData?.data ?? [];

  return (
    <>
      <GlobalNav />
      <div className="relative min-h-screen overflow-x-hidden pt-[130px] md:pt-[115px] pb-[94px]">
        {isSuccess ? (
          <div className="w-full flex flex-col">
            <Carousel primaryPanels={data?.banners?.primaryPanels ?? []} />
            <div className="w-full max-w-[1120px] mx-auto flex flex-col md:mt-35pxr">
              <MiddleMenu />
              {isHomeTickerSuccess && homeTickerData && (
                <div className="mt-24pxr md:mt-35pxr">
                  <HomeTicker
                    items={homeTickerData.items}
                    rotateEveryMs={homeTickerData.rotateEveryMs}
                  />
                </div>
              )}
              <div className="flex flex-col mt-30pxr md:mt-80pxr gap-70pxr">
                <FreeTop data={freeTopProducts} />
                <RisingPick items={risingPickItems} />
                {hasLatestUpdateProducts && (
                  <LatestUpdate products={latestUpdateProducts} />
                )}
                <RecentlyView />
              </div>
            </div>
            {mainCharacterSlotItems.length > 0 && (
              <div className="mt-30pxr md:mt-70pxr">
                <CharacterSlot
                  items={mainCharacterSlotItems}
                  adultYn={adultYn}
                  cacheIdentity={mainProductCacheIdentity}
                />
              </div>
            )}
            {mainRuleSlotSections.length > 0 && (
              <div className="w-full max-w-[1120px] mx-auto flex flex-col mt-44pxr md:mt-88pxr gap-44pxr md:gap-88pxr">
                {mainRuleSlotSections.map((section) => (
                  <BottomProducts
                    key={`main-rule-${section.suggestName}-${section.suggestTitle}`}
                    suggestionData={section}
                  />
                ))}
              </div>
            )}
            {beforePaidTopSingleSlot && (
              <div className="mt-44pxr md:mt-70pxr">
                <SingleSlot slot={beforePaidTopSingleSlot} />
              </div>
            )}
            <div className="w-full mt-30pxr md:mt-80pxr bg-[#212123]">
              <PaidTop data={paidTopProducts} />
            </div>
            <CompanyNoticeCarousel items={companyNoticeItems} />
            <div className="w-full">
              <MiddleBanner
                secondaryPanels={data?.banners?.secondaryPanels ?? []}
              />
            </div>
            <div className="w-full max-w-[1120px] mx-auto flex flex-col mt-44pxr md:mt-88pxr gap-44pxr md:gap-88pxr">
              <CPPromotion
                data={cpPromotionProducts}
                title={data?.publisherPromotionTitle}
                entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.HOME_CP_PROMOTION}
              />
              {visibleMixedSections.map((item, index) => (
                <div
                  key={`${item.type}-${index}-${
                    item.type === "feature"
                      ? item.section.suggestTitle || item.section.suggestId
                      : item.section.dimension || item.section.title || index
                  }`}
                  className="contents"
                >
                  {item.type === "feature" ? (
                    <BottomProducts suggestionData={item.section} />
                  ) : (
                    <TasteSection section={item.section} />
                  )}
                  {index === firstSingleSlotAfterMixedIndex &&
                    betweenDirectRecommendFirstSingleSlot && (
                      <SingleSlot slot={betweenDirectRecommendFirstSingleSlot} />
                    )}
                  {index === secondSingleSlotAfterMixedIndex &&
                    betweenDirectRecommendSecondSingleSlot && (
                      <SingleSlot slot={betweenDirectRecommendSecondSingleSlot} />
                    )}
                </div>
              ))}
              {/* TODO: 관심 끊기기 임박 작품 api 연결 */}
              {shouldRenderFirstSingleSlotAfterLatest &&
                betweenDirectRecommendFirstSingleSlot && (
                  <SingleSlot slot={betweenDirectRecommendFirstSingleSlot} />
                )}
              {shouldRenderSecondSingleSlotAfterLatest &&
                betweenDirectRecommendSecondSingleSlot && (
                  <SingleSlot slot={betweenDirectRecommendSecondSingleSlot} />
                )}
              {hasInterestDropSoonProducts && (
                <div data-home-section="interest-drop-soon" className="contents">
                  <BottomProducts
                    suggestionData={{
                      products: interestDropSoonProducts,
                      suggestId: 0,
                      suggestName: "",
                      suggestTarget: "",
                      suggestTitle: "관심 끊기기 임박",
                    }}
                    key="interest"
                  />
                </div>
              )}
            </div>
            <div className="w-full mt-[67px]">
              <BottomBanner teriayPanels={data?.banners?.teriayPanels ?? []} />
            </div>
          </div>
        ) : (
          <div className="w-full min-h-screen flex justify-center items-center mt-[-100px]">
            <Spinner />
          </div>
        )}
      </div>
      <AuthorStartCta />
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
        dismissOnClose
      />
      <FloatingDock footerOffset={110} />
      <Footer />
    </>
  );
}
