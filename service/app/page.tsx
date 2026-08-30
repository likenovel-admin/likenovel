import HomePageClient from "./HomePageClient";
import {
  SITE_NAME,
  buildHomeMetadata,
  buildWebsiteStructuredData,
} from "@/utils/siteSeoMetadata";

export const metadata = buildHomeMetadata();

export default function HomePage() {
  const websiteStructuredData = buildWebsiteStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <h1 className="sr-only">{SITE_NAME}</h1>
      <HomePageClient />
    </>
  );
}
