"use client";
import { useSelectBannerPromotion } from "@/app/api/query/product";
import { useEffect, useRef } from "react";

const PromotionImageArea = () => {
  const { data } = useSelectBannerPromotion();
  const banners = data?.banners || [];
  const primaryBanner = banners?.[0];
  const containerRef = useRef<HTMLDivElement>(null);

  const pcImage = primaryBanner?.pcImgPath;
  const mobileImage = primaryBanner?.mobileImgPath;

  useEffect(() => {
    if (containerRef.current && pcImage && mobileImage) {
      const updateBackgroundImage = () => {
        if (window.innerWidth >= 768) {
          containerRef.current!.style.backgroundImage = `url(${pcImage})`;
          containerRef.current!.style.backgroundSize = "cover";
        } else {
          containerRef.current!.style.backgroundImage = `url(${mobileImage})`;
          containerRef.current!.style.backgroundSize = "cover";
        }
      };

      updateBackgroundImage();

      window.addEventListener("resize", updateBackgroundImage);
      return () => window.removeEventListener("resize", updateBackgroundImage);
    }
  }, [pcImage, mobileImage]);

  const handleBannerClick = () => {
    if (primaryBanner.linkPath) {
      window.open(primaryBanner.linkPath, "_blank");
    }
  };

  return (
    <div
      onClick={handleBannerClick}
      ref={containerRef}
      className="flex mt-[-12px] flex-col items-center bg-primary-100 w-screen h-[380px] bg-no-repeat bg-center cursor-pointer"
    >
      {/* <div className="w-[50px] h-[20px] md:w-[78px] md:h-[32px] md:text-16pxr mt-10 flex justify-center items-center bg-[#ffcb12] font-semibold rounded-full text-11pxr">
        프로모션
      </div>
      <div className="text-23pxr md:text-32pxr font-bold flex flex-col justify-center text-white mt-3 leading-7 md:leading-9">
        <span className="text-center">라이크노벨에서</span>
        <span className="text-center">다양한 혜택을 만나보세요.</span>
      </div> */}
    </div>
  );
};

export default PromotionImageArea;
