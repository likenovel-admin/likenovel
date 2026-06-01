import { normalizeUrl } from "@/utils/common";
import {
  getBannerCarouselActivePage,
  getBannerCarouselPageCount,
  getBannerCarouselPageSize,
  getBannerCarouselPageStartIndex,
} from "@/utils/bannerCarouselPaging";
import { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import ArrowLeftMedium from "/public/images/arrow-left-medium.svg";
import ArrowRightMedium from "/public/images/arrow-right-medium.svg";

export interface PrimaryPanel {
  pcImgPath: string;
  mobileImgPath: string;
  textType?: "char" | "img";
  topText?: string;
  middleText?: string;
  bottomText?: string;
  textPosition?: "leftTop" | "leftBottom";
  textImgPath?: string;
  mobileTextImgPath?: string;
  overlayYn?: "Y" | "N";
  overlayType?: "gradation" | "img";
  overlayImgPath?: string;
  mobileOverlayImgPath?: string;
  linkPath: string;
}

interface Props {
  primaryPanels: PrimaryPanel[];
}

const Carousel = ({ primaryPanels }: Props) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<any>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);

  const count = primaryPanels.length;
  const pageSize = getBannerCarouselPageSize(count);
  const pageCount = getBannerCarouselPageCount(count);
  const canSlide = count > pageSize;
  const desktopSlidesToShow = count >= pageSize ? pageSize : Math.max(count, 1);
  const activePage = getBannerCarouselActivePage(currentSlide, count);

  const settings = {
    infinite: canSlide,
    speed: 400,
    slidesToShow: desktopSlidesToShow,
    slidesToScroll: pageSize,
    autoplay: canSlide,
    autoplaySpeed: 5000,
    arrows: false,
    centerMode: false,
    afterChange: (current: number) => setCurrentSlide(current),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: pageSize,
          infinite: canSlide,
          autoplay: canSlide,
          centerMode: count > 1,
          centerPadding: count > 1 ? "32px" : "0px",
        },
      },
    ],
  };

  useEffect(() => {
    setCurrentSlide(0);
  }, [count]);

  if (count === 0) return null;

  const SliderComponent = Slider as any;

  return (
    <div className="w-full">
      <div className="slider-container relative">
        <SliderComponent ref={sliderRef} {...settings}>
          {primaryPanels.map((panel, index) => (
            <div key={index} className="focus:outline-none">
              <div
                className="px-[4.5px] cursor-pointer"
                onMouseDown={(e) => {
                  isDragging.current = false;
                  dragStartX.current = e.clientX;
                }}
                onMouseMove={(e) => {
                  if (Math.abs(e.clientX - dragStartX.current) > 5) {
                    isDragging.current = true;
                  }
                }}
                onClick={() => {
                  if (isDragging.current) return;
                  if (panel.linkPath) {
                    window.open(normalizeUrl(panel.linkPath), "_blank");
                  }
                }}
              >
                <img
                  src={panel.pcImgPath}
                  alt={`banner_${index}`}
                  className="w-full aspect-[364/414] object-cover rounded-[20px]"
                />
              </div>
            </div>
          ))}
        </SliderComponent>

        {canSlide && (
          <>
            <button
              type="button"
              aria-label="이전 배너"
              onClick={() => sliderRef.current?.slickPrev()}
              className="hidden md:flex absolute top-1/2 left-[-20px] -translate-y-1/2 z-50 w-[40px] h-[40px] items-center justify-center rounded-full bg-white border border-[#F0F0F0] shadow-[2px_4px_8px_0_rgba(0,0,0,0.06)]"
            >
              <ArrowLeftMedium className="w-[9px] h-[16px] text-[#333333]" />
            </button>
            <button
              type="button"
              aria-label="다음 배너"
              onClick={() => sliderRef.current?.slickNext()}
              className="hidden md:flex absolute top-1/2 right-[-20px] -translate-y-1/2 z-50 w-[40px] h-[40px] items-center justify-center rounded-full bg-white border border-[#F0F0F0] shadow-[2px_4px_8px_0_rgba(0,0,0,0.06)]"
            >
              <ArrowRightMedium className="w-[9px] h-[16px] text-[#333333]" />
            </button>
          </>
        )}
      </div>

      {pageCount > 1 && (
        <div className="relative flex justify-center gap-[8px] items-center py-[10px]">
          {Array.from({ length: pageCount }).map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              onClick={() =>
                sliderRef.current?.slickGoTo(
                  getBannerCarouselPageStartIndex(pageIndex),
                )
              }
              className="flex items-center cursor-pointer p-[4px]"
            >
              <span
                className={`block h-[6px] rounded-full transition-all ${
                  activePage === pageIndex
                    ? "w-[28px] bg-[#0255d9]"
                    : "w-[10px] bg-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
