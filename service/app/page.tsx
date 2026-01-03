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
import { IProduct } from "@/types";
import { useMemo } from "react";
import {
  useGetDirectRecommend,
  useSelectInterestDropSoonUpdateProducts,
  useSelectLatestUpdateProducts,
  useSelectMainSuggestProducts,
  useSelectProducts,
} from "./api/query/product";
import useAuthStore from "@/store/authStore";

export default function Home() {
  const { user } = useAuthStore();
  const adultYn = user?.isOnAdult ? "Y" : "N";

  const { data, isSuccess } = useSelectProducts(adultYn);
  const { data: suggestProductsData } = useSelectMainSuggestProducts(adultYn);
  const { data: latestUpdateData } = useSelectLatestUpdateProducts(adultYn);
  const { data: interestDropSoonData } =
    useSelectInterestDropSoonUpdateProducts(adultYn);
  const { data: directRecommendData } = useGetDirectRecommend(adultYn);

  const suggestProducts = useMemo(() => {
    return suggestProductsData?.data ?? [];
  }, [suggestProductsData]);

  const freeTopProducts: IProduct[] = [];
  const paidTopProducts: IProduct[] = [];
  isSuccess &&
    data?.topsProducts &&
    Array.isArray(data.topsProducts) &&
    data.topsProducts.map((product: IProduct) => {
      product?.area === "freeTop" && freeTopProducts.push(product);
      product?.area === "paidTop" && paidTopProducts.push(product);
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
            <div className="w-full mt-30pxr md:mt-80pxr bg-[#212123]">
              <PaidTop data={paidTopProducts} />
            </div>
            <div className="w-full">
              <MiddleBanner
                secondaryPanels={data?.banners?.secondaryPanels ?? []}
              />
            </div>
            <div className="w-full max-w-[1120px] mx-auto flex flex-col mt-30pxr md:mt-70pxr gap-30pxr md:gap-68pxr">
              <CPPromotion data={cpPromotionProducts} />
              {(directRecommendData?.data || []).map((directProduct, index) => (
                <BottomProducts
                  suggestionData={{
                    products: directProduct?.productList || [],
                    suggestId: 0,
                    suggestName: directProduct?.title || "",
                    suggestTarget: "",
                    suggestTitle: directProduct?.title || "",
                  }}
                  key="suggest"
                />
              ))}
              {suggestProducts.map((suggestProduct) => (
                <BottomProducts
                  key={suggestProduct.sectionNo}
                  suggestionData={suggestProduct.sectionData}
                />
              ))}
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
      <FloatingDock footerOffset={110} />
      <Footer />
    </>
  );
}
