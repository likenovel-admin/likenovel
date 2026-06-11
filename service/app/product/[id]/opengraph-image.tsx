/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import sharp from "sharp";
import {
  PRODUCT_METADATA_REVALIDATE_SECONDS,
  fetchProductMetadata,
  getDefaultProductImageUrl,
  getResolvedProductCoverImageUrl,
  getSiteBaseUrl,
} from "./metadataUtils";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "라이크노벨 작품 공유 이미지";
export const revalidate = PRODUCT_METADATA_REVALIDATE_SECONDS;

const toArrayBuffer = (buffer: Buffer) =>
  buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;

const loadCoverImageSource = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl, {
      next: {
        revalidate: PRODUCT_METADATA_REVALIDATE_SECONDS,
      },
    });
    if (!response.ok) return imageUrl;

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const pngBuffer = await sharp(imageBuffer).png().toBuffer();
    return toArrayBuffer(pngBuffer);
  } catch {
    return imageUrl;
  }
};

export default async function ProductShareImage({
  params,
}: {
  params: { id: string };
}) {
  const siteBaseUrl = getSiteBaseUrl();
  const product = /^\d+$/.test(params.id)
    ? await fetchProductMetadata(params.id)
    : null;
  const coverImageUrl = product?.title
    ? getResolvedProductCoverImageUrl(product.image?.coverImagePath, siteBaseUrl)
    : getDefaultProductImageUrl(siteBaseUrl);
  const coverImageSource = await loadCoverImageSource(coverImageUrl);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#161722",
        }}
      >
        <img
          src={coverImageSource as string}
          alt=""
          width="1360"
          height="850"
          style={{
            position: "absolute",
            left: "-80px",
            top: "-110px",
            width: "1360px",
            height: "850px",
            objectFit: "cover",
            opacity: 0.24,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(90deg, rgba(16,17,28,0.96) 0%, rgba(16,17,28,0.72) 50%, rgba(16,17,28,0.96) 100%)",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "384px",
              height: "552px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px",
              borderRadius: "30px",
              background: "rgba(255,255,255,0.2)",
            }}
          >
            <img
              src={coverImageSource as string}
              alt=""
              width="356"
              height="524"
              style={{
                width: "356px",
                height: "524px",
                objectFit: "contain",
                borderRadius: "20px",
                background: "#f7f7fb",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
