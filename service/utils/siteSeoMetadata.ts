import type { Metadata } from "next";

import {
  getSiteOrigin,
  isIndexableProductionSite,
} from "./siteSeo.mjs";

export const SITE_NAME = "라이크노벨";
export const DEFAULT_SITE_DESCRIPTION = "라이크노벨에서 작품을 만나보세요.";

const getRobotsMetadata = (): Metadata["robots"] =>
  isIndexableProductionSite()
    ? {
        index: true,
        follow: true,
      }
    : {
        index: false,
        follow: false,
      };

export const buildRootMetadata = (): Metadata => {
  const siteOrigin = getSiteOrigin();
  const naverSiteVerification =
    process.env.NAVER_SITE_VERIFICATION?.trim();

  return {
    metadataBase: new URL(siteOrigin),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_SITE_DESCRIPTION,
    robots: getRobotsMetadata(),
    verification: naverSiteVerification
      ? {
          other: {
            "naver-site-verification": naverSiteVerification,
          },
        }
      : undefined,
    openGraph: {
      title: SITE_NAME,
      description: DEFAULT_SITE_DESCRIPTION,
      siteName: SITE_NAME,
      type: "website",
      locale: "ko_KR",
      url: siteOrigin,
    },
    twitter: {
      card: "summary",
      title: SITE_NAME,
      description: DEFAULT_SITE_DESCRIPTION,
    },
  };
};

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
}

export const buildPageMetadata = ({
  title,
  description,
  path,
}: PageMetadataInput): Metadata => {
  const pageUrl = new URL(path, `${getSiteOrigin()}/`).toString();

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "website",
      locale: "ko_KR",
      url: pageUrl,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
};
