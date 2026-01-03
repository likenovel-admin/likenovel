import { IProduct } from "@/types";
import { getUser } from "@/utils/getUser";

export const useAdultCoverImage = () => {
  const user = getUser();
  const getAdultCoverImage = (
    product: IProduct,
    width: number,
    height: number,
    className?: string
  ) => {
    return !user?.isOnAdult && product.adultYn === "Y" ? (
      product.image?.adultDefaultcoverImagePath ? (
        <img
          src={product.image?.adultDefaultcoverImagePath}
          alt={product.title}
          width={width}
          height={height}
          className={className}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp";
          }}
        />
      ) : (
        // TODO: 19금 대체 이미지 추가
        <img
          src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
          alt={product.title}
          width={width}
          height={height}
          className={className}
        />
      )
    ) : product.image?.coverImagePath ? (
      <img
        src={product.image?.coverImagePath}
        alt={product.title}
        width={width}
        height={height}
        className={className}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp";
        }}
      />
    ) : (
      <img
        src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
        alt={product.title}
        width={width}
        height={height}
        className={className}
      />
    );
  };

  return getAdultCoverImage;
};
