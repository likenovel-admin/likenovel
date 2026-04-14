"use client";

import {
  bannerPositions,
  bannerSortOptions,
  type BannerPositionValue,
  type BannerSortOptionValue,
} from "@/constants/banner";
import type { ReadonlyURLSearchParams } from "next/navigation";

export type BannerPositionTabValue = "all" | BannerPositionValue;

export type BannerListFilters = {
  page: number;
  position: BannerPositionTabValue;
  sortBy: BannerSortOptionValue;
};

export const defaultBannerListFilters: BannerListFilters = {
  page: 1,
  position: "all",
  sortBy: "show_order_asc",
};

const bannerPositionValues = bannerPositions.map((position) => position.value);
const bannerSortValues = bannerSortOptions.map((option) => option.value);

const isBannerPositionTabValue = (
  value: string | null
): value is BannerPositionTabValue => {
  return (
    value === "all" ||
    bannerPositionValues.includes(value as BannerPositionValue)
  );
};

const isBannerSortValue = (
  value: string | null
): value is BannerSortOptionValue => {
  return bannerSortValues.includes(value as BannerSortOptionValue);
};

const parsePage = (value: string | null): number => {
  if (!value) {
    return defaultBannerListFilters.page;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : defaultBannerListFilters.page;
};

export const parseBannerListFilters = (
  searchParams: URLSearchParams | ReadonlyURLSearchParams
): BannerListFilters => {
  const position = searchParams.get("position");
  const sortBy = searchParams.get("sortBy");

  return {
    page: parsePage(searchParams.get("page")),
    position: isBannerPositionTabValue(position)
      ? position
      : defaultBannerListFilters.position,
    sortBy: isBannerSortValue(sortBy)
      ? sortBy
      : defaultBannerListFilters.sortBy,
  };
};

export const buildBannerListQuery = (filters: BannerListFilters): string => {
  const params = new URLSearchParams();

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (filters.position !== defaultBannerListFilters.position) {
    params.set("position", filters.position);
  }

  if (filters.sortBy !== defaultBannerListFilters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  return params.toString();
};

export const buildBannerListHref = (filters: BannerListFilters): string => {
  const query = buildBannerListQuery(filters);
  return query ? `/banners?${query}` : "/banners";
};
