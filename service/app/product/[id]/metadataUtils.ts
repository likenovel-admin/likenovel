import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import {
  DEFAULT_SITE_DESCRIPTION,
  SITE_NAME,
} from "@/utils/siteSeoMetadata";

export { SITE_NAME };
export const DEFAULT_DESCRIPTION = DEFAULT_SITE_DESCRIPTION;
export const PRODUCT_METADATA_REVALIDATE_SECONDS = 300;

export interface ProductMetadataResponse {
  data?: {
    product?: {
      title?: string | null;
      synopsis?: string | null;
      authorNickname?: string | null;
      image?: {
        coverImagePath?: string | null;
      } | null;
    } | null;
  } | null;
}

export const normalizeBaseUrl = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

export const normalizeDescription = (value?: string | null) => {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > 180
    ? `${normalized.slice(0, 177).trimEnd()}...`
    : normalized;
};

export const toAbsoluteUrl = (value: string, baseUrl: string) => {
  try {
    return new URL(value).toString();
  } catch {
    return new URL(value, `${baseUrl}/`).toString();
  }
};

export const getSiteBaseUrl = () =>
  normalizeBaseUrl(
    process.env.NEXT_PUBLIC_WWW_SERVER_URI,
    "https://www.likenovel.net"
  );

export const getApiBaseUrl = () =>
  normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_SERVER_URI,
    "https://api.likenovel.net"
  );

export const getProductUrl = (
  productId: string,
  siteBaseUrl = getSiteBaseUrl()
) =>
  `${siteBaseUrl}/product/${encodeURIComponent(productId)}`;

export const getProductShareImageUrl = (
  productId: string,
  siteBaseUrl = getSiteBaseUrl()
) => `${getProductUrl(productId, siteBaseUrl)}/opengraph-image`;

export const getDefaultProductImageUrl = (siteBaseUrl = getSiteBaseUrl()) =>
  toAbsoluteUrl(DEFAULT_PRODUCT_IMAGE, siteBaseUrl);

export const getResolvedProductCoverImageUrl = (
  coverImagePath?: string | null,
  siteBaseUrl = getSiteBaseUrl()
) => toAbsoluteUrl(resolveProductCoverImage(coverImagePath), siteBaseUrl);

export const fetchProductMetadata = async (productId: string) => {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/v1/query/products/${encodeURIComponent(
      productId
    )}/details-group`,
    {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: PRODUCT_METADATA_REVALIDATE_SECONDS,
      },
    }
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as ProductMetadataResponse;
  return payload.data?.product ?? null;
};
