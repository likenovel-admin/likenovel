import type { IProduct } from "@/types";
import { getIsNewEpisode } from "./getIsNewEpisode";

type ProductUpBadgeSource = Pick<
  IProduct,
  "badge" | "properties" | "latestEpisodeDate"
>;

export const shouldShowProductUpBadge = (
  product?: Partial<ProductUpBadgeSource> | null
) =>
  product?.badge?.newReleaseYn === "Y" ||
  getIsNewEpisode(
    product?.properties?.latestEpisodeDate || product?.latestEpisodeDate || ""
  );
