"use client";

import {
  createFunnelRouteContext,
  trackFunnelRouteContext,
} from "@/utils/funnelRouteTracker";
import { logViewerTrace } from "@/utils/viewerTrace";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export const useFunnelRouteTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const routeContext = useMemo(
    () => createFunnelRouteContext(pathname || "/", searchParams),
    [pathname, searchKey]
  );

  useEffect(() => {
    const tracked = trackFunnelRouteContext(routeContext);
    logViewerTrace(
      "funnel-route-tracker",
      "track-route-context",
      {
        tracked,
        routeContext,
      },
      {
        pathname: routeContext.pathname,
        episodeId: routeContext.viewerEpisodeId,
        productId: routeContext.productId,
      }
    );
  }, [routeContext]);
};
