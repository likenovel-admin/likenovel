"use client";

import {
  createFunnelRouteContext,
  trackFunnelRouteContext,
} from "@/utils/funnelRouteTracker";
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
    trackFunnelRouteContext(routeContext);
  }, [routeContext]);
};
