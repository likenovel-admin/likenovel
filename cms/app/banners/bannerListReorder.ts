export function getBannerListPagination(
  position: string,
  page: number,
  countPerPage: number,
) {
  if (position === "all") {
    return { page, count_per_page: countPerPage };
  }

  return { page: -1, count_per_page: -1 };
}

export function canReorderBannerList(
  position: string,
  itemCount: number,
): boolean {
  return position !== "all" && itemCount > 1;
}

export function getBannerReorderItems<
  T extends { id: number; show_order: number },
>(items: readonly T[]): T[] {
  return [...items].sort(
    (left, right) =>
      left.show_order - right.show_order || left.id - right.id,
  );
}
