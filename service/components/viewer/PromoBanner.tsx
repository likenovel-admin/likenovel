import { useSelectPanels } from "@/app/api/query/banner";
import useMediaDevice from "@/hooks/useMediaDevice";
import Image from "next/image";

export default function PromoBanner() {
  const device = useMediaDevice();
  const { data } = useSelectPanels({ division: "viewer" });

  const banner = data?.data?.[0];

  if (!banner) {
    return null;
  }

  const handleBannerClick = () => {
    if (banner.linkPath) {
      window.open(banner.linkPath, '_blank');
    }
  };

  const imageSrc = device === "mobile" ? banner.mobileImgPath : banner.pcImgPath;

  return (
    <section
      className="w-full h-[122px] mt-[18px] rounded-[20px] overflow-hidden cursor-pointer"
      onClick={handleBannerClick}
    >
      <div className="relative w-full h-full">
        <Image
          src={imageSrc}
          alt="promo banner"
          fill
          className="object-cover"
        />
        {banner.overlayYn === "Y" && banner.overlayType === "gradation" && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        )}
        {banner.overlayYn === "Y" && banner.overlayType === "img" && banner.overlayImgPath && (
          <Image
            src={device === "mobile" ? banner.mobileOverlayImgPath : banner.overlayImgPath}
            alt="overlay"
            fill
            className="object-cover"
          />
        )}
        {banner.textType === "char" && (
          <div className={`absolute ${banner.textPosition === "leftTop" ? "top-4 left-4" : "bottom-4 left-4"}`}>
            {banner.topText && (
              <p className="text-white text-sm font-medium">{banner.topText}</p>
            )}
            {banner.middleText && (
              <p className="text-white text-lg font-bold">{banner.middleText}</p>
            )}
            {banner.bottomText && (
              <p className="text-white text-sm">{banner.bottomText}</p>
            )}
          </div>
        )}
        {banner.textType === "img" && banner.textImgPath && (
          <div className={`absolute ${banner.textPosition === "leftTop" ? "top-4 left-4" : "bottom-4 left-4"}`}>
            <Image
              src={device === "mobile" ? banner.mobileTextImgPath : banner.textImgPath}
              alt="text overlay"
              width={200}
              height={100}
              className="object-contain"
            />
          </div>
        )}
      </div>
    </section>
  );
}
