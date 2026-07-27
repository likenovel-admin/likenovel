export const LATEST_UPDATE_GENRE_TABS = [
  "전체",
  "현대판타지",
  "판타지",
  "무협",
  "대체역사",
  "스포츠",
  "퓨전",
  "드라마",
  "전쟁·밀리터리",
  "로맨스",
  "게임",
  "SF",
  "기타",
] as const;

export type LatestUpdateGenre = (typeof LATEST_UPDATE_GENRE_TABS)[number];

export const LATEST_UPDATE_MAX_ITEMS = 21;

const DEDICATED_GENRES = new Set<string>(
  LATEST_UPDATE_GENRE_TABS.slice(1, -1)
);

interface GenreProduct {
  genre?: string[];
  priceType: "free" | "paid";
}

export const filterLatestUpdateProducts = <T extends GenreProduct>(
  products: T[],
  activeGenre: LatestUpdateGenre
) => {
  const freeProducts = products.filter(
    (product) => product.priceType === "free"
  );

  if (activeGenre === "전체") {
    return freeProducts.slice(0, LATEST_UPDATE_MAX_ITEMS);
  }

  const filteredProducts = freeProducts.filter((product) => {
    const genres = product.genre ?? [];
    if (activeGenre === "기타") {
      return genres.every((genre) => !DEDICATED_GENRES.has(genre));
    }
    return genres.includes(activeGenre);
  });

  return filteredProducts.slice(0, LATEST_UPDATE_MAX_ITEMS);
};
