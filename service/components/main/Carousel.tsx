import { normalizeUrl } from "@/utils/common";
import { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
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
  contained?: boolean;
}

const Carousel = ({ primaryPanels, contained }: Props) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [animation, setAnimation] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<any>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);

  const isSingle = primaryPanels.length <= 1;
  const settings = {
    className: "center",
    centerMode: !isSingle,
    infinite: !isSingle,
    centerPadding: "0",
    slidesToShow: 1,
    speed: 400,
    autoplay: !isSingle,
    autoplaySpeed: 5000,
    arrows: false,
    beforeChange: (current: number, next: number) => {
      setAnimation(false);
      setShowBanner(false);
      setShowOverlay(false);
    },
    afterChange: (current: number) => {
      if (primaryPanels.length == 0) {
        return;
      }
      setCurrentSlide(current);
      if (primaryPanels[current].textType) {
        setShowBanner(true);
        setAnimation(true);
      } else {
        setShowBanner(false);
        setAnimation(false);
      }
      setShowOverlay(true);
    },
    responsive: [
      {
        breakpoint: 768,
        settings: {
          centerPadding: "15px",
        },
      },
      {
        breakpoint: 1025,
        settings: {
          centerPadding: "15%",
        },
      },
    ],
  };

  useEffect(() => {
    const checkMobile = () => {
      // TODO: 우선 모바일 이미지를 테블릿 사이즈일 때로 설정하기로 협의했는데, 추후 변경될 수 있음
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth < 1025);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    setCurrentSlide(0);
    setShowBanner(true);
    setShowOverlay(true);
  }, []);

  const SliderComponent = Slider as any;

  return (
    <div className="overflow-hidden">
      <div
        className={`slider-container relative h-[350px] md:h-[400px]${
          contained ? " slider-contained" : ""
        }`}
      >
        <SliderComponent ref={sliderRef} {...settings}>
          {primaryPanels.map((panel, index) => (
            <div
              key={index}
              className="relative w-full focus:outline-none cursor-pointer"
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
                  const normalizedUrl = normalizeUrl(panel.linkPath);
                  window.open(normalizedUrl, "_blank");
                }
              }}
            >
              <div className="relative h-[350px] md:h-[400px] lg:h-[400px]">
                <img
                  src={isTablet ? panel.mobileImgPath : panel.pcImgPath}
                  alt={`image_${index}`}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  className="rounded-[30px] z-0"
                />
                {currentSlide === index &&
                  showBanner &&
                  (panel.textType === "img" ? (
                    <div
                      className={`absolute top-0 left-0 z-50 ${
                        animation ? "animate-fadeUp" : ""
                      }`}
                    >
                      <img
                        src={
                          isTablet
                            ? panel.mobileTextImgPath ?? ""
                            : panel.textImgPath ?? ""
                        }
                        style={{
                          objectFit: "cover",
                          width: "100%",
                          height: "100%",
                        }}
                        alt={`text_image_${index}`}
                        width={isMobile ? 400 : 900}
                        height={400}
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col gap-9pxr md:gap-11pxr absolute left-20pxr md:left-53pxr ${
                        panel.textPosition === "leftTop"
                          ? "top-[35px] md:top-[53px]"
                          : "top-[180px]"
                      } text-white z-50 ${animation ? "animate-fadeUp" : ""}`}
                    >
                      {primaryPanels[index].topText ? (
                        <div className="flex justify-center items-center py-0.5 px-2 max-w-fit bg-[#AF49FF] rounded-full">
                          <span className="text-13pxr font-semibold">
                            {primaryPanels[index].topText}
                          </span>
                        </div>
                      ) : null}
                      <span
                        className="text-20pxr md:text-32pxr leading-7 md:leading-10 font-semibold"
                        dangerouslySetInnerHTML={{
                          __html:
                            primaryPanels[index].middleText?.replace(
                              /\n/g,
                              "<br />",
                            ) || "",
                        }}
                      />
                      <span
                        className="text-12pxr md:text-16pxr leading-19pxr md:leading-23pxr text-[#ADBDE8]"
                        dangerouslySetInnerHTML={{
                          __html:
                            primaryPanels[index].bottomText?.replace(
                              /\n/g,
                              "<br />",
                            ) || "",
                        }}
                      />
                    </div>
                  ))}
                {currentSlide === index &&
                panel.overlayYn === "Y" &&
                showOverlay ? (
                  panel.overlayType === "img" ? (
                    <img
                      src={
                        isTablet
                          ? panel.mobileOverlayImgPath ?? ""
                          : panel.overlayImgPath ?? ""
                      }
                      alt={`overlay_image_${index}`}
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                      }}
                      className="rounded-[30px] z-40 animate-slideInFromLeft"
                    />
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-full">
                      <img
                        src={
                          isTablet
                            ? panel.mobileOverlayImgPath ?? ""
                            : panel.overlayImgPath ?? ""
                        }
                        style={{
                          objectFit: "cover",
                          width: "100%",
                          height: "100%",
                        }}
                        alt={`overlay_image_${index}`}
                        className="rounded-[30px] animate-fadeIn"
                        loading="eager"
                      />
                    </div>
                  )
                ) : currentSlide === index &&
                  panel.overlayYn === "N" &&
                  showOverlay ? (
                  <div className="absolute top-0 left-0 rounded-[30px] w-[60%] md:w-[50%] lg:w-[40%] h-full z-40 animate-fadeIn bg-gradient-to-r from-black to-transparent via-black/80" />
                ) : (
                  <div
                    className="absolute top-0 left-0 rounded-[30px] w-full h-full z-40"
                    style={{
                      background:
                        isTablet || currentSlide === index
                          ? "transparent"
                          : "rgba(0, 0, 0, 0.5)",
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </SliderComponent>
      </div>
      {primaryPanels.length > 1 && (
        <div className="relative flex justify-center gap-[8px] items-center py-[10px]">
          {primaryPanels.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => sliderRef.current?.slickGoTo(index)}
              className="flex items-center cursor-pointer p-[4px]"
            >
              <span
                className={`block h-[6px] rounded-full transition-all ${
                  currentSlide === index
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
