"use client";

import { useSitePageViewTracker } from "@/hooks/useSitePageViewTracker";
import { useSitePageDwellTracker } from "@/hooks/useSitePageDwellTracker";

export default function SitePageViewTracker() {
  useSitePageViewTracker();
  useSitePageDwellTracker();
  return null;
}
