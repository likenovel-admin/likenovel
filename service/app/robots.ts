import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_WWW_SERVER_URI || "https://www.likenovel.net";

const getSiteOrigin = () => SITE_URL.replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
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
