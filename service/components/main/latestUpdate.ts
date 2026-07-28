export const LATEST_UPDATE_MAX_ITEMS = 9;
export const LATEST_UPDATE_MOBILE_PAGE_SIZE = 3;

interface GenreProduct {
  genre?: string[];
  priceType: "free" | "paid";
}

export const getLatestUpdateGenreTabs = <T extends GenreProduct>(
  products: T[]
) => [
  "전체",
  ...Array.from(
    new Set(
      products
        .filter((product) => product.priceType === "free")
        .flatMap((product) => product.genre ?? [])
    )
  ),
];

export const filterLatestUpdateProducts = <T extends GenreProduct>(
  products: T[],
  activeGenre: string
) => {
  const freeProducts = products.filter(
    (product) => product.priceType === "free"
  );

  if (activeGenre === "전체") {
    return freeProducts.slice(0, LATEST_UPDATE_MAX_ITEMS);
  }

  const filteredProducts = freeProducts.filter((product) => {
    const genres = product.genre ?? [];
    return genres.includes(activeGenre);
  });

  return filteredProducts.slice(0, LATEST_UPDATE_MAX_ITEMS);
};

export const paginateLatestUpdateProducts = <T>(products: T[]) =>
  Array.from(
    {
      length: Math.ceil(products.length / LATEST_UPDATE_MOBILE_PAGE_SIZE),
    },
    (_, pageIndex) => {
      const pageStart = pageIndex * LATEST_UPDATE_MOBILE_PAGE_SIZE;
      return products.slice(
        pageStart,
        pageStart + LATEST_UPDATE_MOBILE_PAGE_SIZE
      );
    }
  );

export const clampLatestUpdatePage = (pageIndex: number, pageCount: number) =>
  Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0));
