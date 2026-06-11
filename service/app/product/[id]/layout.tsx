import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE_NAME = "라이크노벨";
const DEFAULT_DESCRIPTION = "라이크노벨에서 작품을 만나보세요.";
const PRODUCT_METADATA_REVALIDATE_SECONDS = 300;

interface ProductMetadataResponse {
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

const normalizeBaseUrl = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const normalizeDescription = (value?: string | null) => {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > 180
    ? `${normalized.slice(0, 177).trimEnd()}...`
    : normalized;
};

const toAbsoluteUrl = (value: string, baseUrl: string) => {
  try {
    return new URL(value).toString();
  } catch {
    return new URL(value, `${baseUrl}/`).toString();
  }
};

const getSiteBaseUrl = () =>
  normalizeBaseUrl(
    process.env.NEXT_PUBLIC_WWW_SERVER_URI,
    "https://www.likenovel.net"
  );

const getApiBaseUrl = () =>
  normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_SERVER_URI,
    "https://api.likenovel.net"
  );

const getDefaultMetadata = (productId?: string): Metadata => {
  const siteBaseUrl = getSiteBaseUrl();
  const productUrl = productId
    ? `${siteBaseUrl}/product/${encodeURIComponent(productId)}`
    : siteBaseUrl;
  const imageUrl = toAbsoluteUrl(DEFAULT_PRODUCT_IMAGE, siteBaseUrl);

  return {
    metadataBase: new URL(siteBaseUrl),
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      siteName: SITE_NAME,
      type: "website",
      url: productUrl,
      images: [
        {
          url: imageUrl,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      images: [imageUrl],
    },
  };
};

const fetchProductMetadata = async (productId: string) => {
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

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const productId = params.id;
  if (!/^\d+$/.test(productId)) return getDefaultMetadata(productId);

  try {
    const product = await fetchProductMetadata(productId);
    if (!product?.title) return getDefaultMetadata(productId);

    const siteBaseUrl = getSiteBaseUrl();
    const productUrl = `${siteBaseUrl}/product/${encodeURIComponent(
      productId
    )}`;
    const title = product.title.trim();
    const authorNickname = product.authorNickname?.trim();
    const cardTitle = authorNickname ? `${title} - ${authorNickname}` : title;
    const description =
      normalizeDescription(product.synopsis) ||
      (authorNickname
        ? `${authorNickname} 작가의 ${title}`
        : `${title} - ${SITE_NAME}`);
    const coverImagePath = resolveProductCoverImage(
      product.image?.coverImagePath
    );
    const imageUrl = toAbsoluteUrl(coverImagePath, siteBaseUrl);

    return {
      metadataBase: new URL(siteBaseUrl),
      title: cardTitle,
      description,
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        title: cardTitle,
        description,
        siteName: SITE_NAME,
        type: "article",
        url: productUrl,
        authors: authorNickname ? [authorNickname] : undefined,
        images: [
          {
            url: imageUrl,
            alt: cardTitle,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: cardTitle,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return getDefaultMetadata(productId);
  }
}

export default function ProductDetailMetadataLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
