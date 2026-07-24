import type { MetadataRoute } from "next";
import {
  getSiteOrigin,
  isIndexableProductionSite,
} from "../utils/siteSeo.mjs";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexableProductionSite()) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
      },
    };
  }

  const siteOrigin = getSiteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/sign-up",
        "/find-id",
        "/find-password",
        "/reset-password",
        "/making-episode/",
        "/order/payment/",
        "/product/author/",
        "/product/message",
        "/product/mypage/",
        "/product/notification",
        "/product/search/result/",
        "/storage-relay",
        "/viewer/",
      ],
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
    host: siteOrigin,
  };
}
