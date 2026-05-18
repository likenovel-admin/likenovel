"use client";
import FloatingDock from "@/components/common/FloatingDock";
import Spinner from "@/components/common/Spinner";
import BottomBanner from "@/components/main/BottomBanner";
import BottomProducts from "@/components/main/BottomProducts";
import Carousel from "@/components/main/Carousel";
import CPPromotion from "@/components/main/CPPromotion";
import FreeTop from "@/components/main/FreeTop";
import MiddleBanner from "@/components/main/MiddleBanner";
import MiddleMenu from "@/components/main/MiddleMenu";
import PaidTop from "@/components/main/PaidTop";
import RecentlyView from "@/components/main/RecentlyView";
import Footer from "@/components/menu/Footer";
import GlobalNav from "@/components/menu/GlobalNav";
import TasteSection from "@/components/recommendation/TasteSection";
import OnboardingModal from "@/components/recommendation/OnboardingModal";
import { IProduct } from "@/types";
import { useEffect, useMemo, useState } from "react";
import {
  useGetDirectRecommend,
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
import { PRODUCT_DETAIL_ENTRY_SOURCE } from "@/utils/productPath";

export default function Home() {
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const adultYn = user?.isOnAdult ? "Y" : "N";
  const canUseTasteRecommend = Boolean(isAuthenticated || accessToken || user?.userId);
  const canUseInterestDropSoon = Boolean(
    isAuthenticated || accessToken || user?.userId
  );
  const interestDropSoonCacheIdentity =
    user?.userId != null
      ? `user:${user.userId}`
      : accessToken
        ? `token:${accessToken.slice(-16)}`
        : "guest";
  const mainProductCacheIdentity = interestDropSoonCacheIdentity;
  const tasteRecommendCacheIdentity =
    user?.userId != null
      ? `user:${user.userId}`
      : accessToken
        ? `token:${accessToken.slice(-16)}`
        : "guest";
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasFirstLoginOnboarding, setHasFirstLoginOnboarding] = useState(false);

  const { data, isSuccess } = useSelectProducts(
    adultYn,
    mainProductCacheIdentity
  );
  const { data: suggestProductsData } = useSelectMainSuggestProducts(
    adultYn,
    mainProductCacheIdentity
  );
  const { data: mainRuleSlotsData } = useSelectMainRuleSlots(
    adultYn,
    mainProductCacheIdentity
  );
  const { data: latestUpdateData } = useSelectLatestUpdateProducts(
    adultYn,
    mainProductCacheIdentity
  );
  const { data: interestDropSoonData } =
    useSelectInterestDropSoonUpdateProducts(
      adultYn,
      canUseInterestDropSoon,
      interestDropSoonCacheIdentity
    );
  const { data: directRecommendData } = useGetDirectRecommend(adultYn);
  const { data: tasteRecommendationsData } = useGetTasteRecommendations(
    adultYn,
    canUseTasteRecommend,
    tasteRecommendCacheIdentity
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

  const recommendProducts = Array.isArray(data?.topsProducts)
    ? data.topsProducts.slice(0, 8)
    : [];

  return (
    <>
      <GlobalNav />
      <div className="relative min-h-screen pt-[130px] md:pt-[115px] pb-[94px]">
        {isSuccess ? (
          <div className="w-full flex flex-col">
            <Carousel primaryPanels={data?.banners?.primaryPanels ?? []} />
            <div className="w-full max-w-[1120px] mx-auto flex flex-col md:mt-35pxr">
              <MiddleMenu />
              <div className="flex flex-col mt-30pxr md:mt-80pxr gap-70pxr">
                <FreeTop data={freeTopProducts} />
                <RecentlyView />
              </div>
            </div>
            {mainRuleSlotSections.length > 0 && (
              <div className="w-full max-w-[1120px] mx-auto flex flex-col mt-30pxr md:mt-70pxr gap-30pxr md:gap-68pxr">
                {mainRuleSlotSections.map((section) => (
                  <BottomProducts
                    key={`main-rule-${section.suggestName}-${section.suggestTitle}`}
                    suggestionData={section}
                  />
                ))}
              </div>
            )}
            <div className="w-full mt-30pxr md:mt-80pxr bg-[#212123]">
              <PaidTop data={paidTopProducts} />
            </div>
            <div className="w-full">
              <MiddleBanner
                secondaryPanels={data?.banners?.secondaryPanels ?? []}
              />
            </div>
            <div className="w-full max-w-[1120px] mx-auto flex flex-col mt-30pxr md:mt-70pxr gap-30pxr md:gap-68pxr">
              <CPPromotion
                data={cpPromotionProducts}
                title={data?.publisherPromotionTitle}
                entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.HOME_CP_PROMOTION}
              />
              {mixedSections.map((item, index) =>
                item.type === "feature" ? (
                  <BottomProducts
                    key={`feature-${index}-${item.section.suggestTitle || item.section.suggestId}`}
                    suggestionData={item.section}
                  />
                ) : (
                  <TasteSection
                    key={`ai-${index}-${item.section.dimension || item.section.title || index}`}
                    section={item.section}
                  />
                )
              )}
              {/* TODO: 관심 끊기기 임박 작품 api 연결 */}
              <BottomProducts
                suggestionData={{
                  products: latestUpdateData?.data || [],
                  suggestId: 0,
                  suggestName: "",
                  suggestTarget: "",
                  suggestTitle: "최신 업데이트 작품",
                }}
                key="suggest"
              />
              {canUseInterestDropSoon && (
                <BottomProducts
                  suggestionData={{
                    products: interestDropSoonData?.data || [],
                    suggestId: 0,
                    suggestName: "",
                    suggestTarget: "",
                    suggestTitle: "관심 끊기기 임박",
                  }}
                  key="interest"
                />
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
