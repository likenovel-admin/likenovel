import HomePageClient from "./HomePageClient";
import { buildHomeMetadata } from "@/utils/siteSeoMetadata";

export const metadata = buildHomeMetadata();

export default function HomePage() {
  return <HomePageClient />;
}
