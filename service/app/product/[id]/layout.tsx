import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  fetchProductMetadata,
  getDefaultProductImageUrl,
  getProductShareImageUrl,
  getProductUrl,
  getSiteBaseUrl,
  normalizeDescription,
} from "./metadataUtils";

const getDefaultMetadata = (productId?: string): Metadata => {
  const siteBaseUrl = getSiteBaseUrl();
  const productUrl = productId
    ? getProductUrl(productId, siteBaseUrl)
    : siteBaseUrl;
  const imageUrl = getDefaultProductImageUrl(siteBaseUrl);

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
    const productUrl = getProductUrl(productId, siteBaseUrl);
    const title = product.title.trim();
    const authorNickname = product.authorNickname?.trim();
    const cardTitle = authorNickname ? `${title} - ${authorNickname}` : title;
    const description =
      normalizeDescription(product.synopsis) ||
      (authorNickname
        ? `${authorNickname} 작가의 ${title}`
        : `${title} - ${SITE_NAME}`);
    const imageUrl = getProductShareImageUrl(productId, siteBaseUrl);

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
            width: 1200,
            height: 630,
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
