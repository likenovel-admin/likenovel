import { ISelectEpisodeObject } from "@/app/api/query/episode/dto";
import { IEpisodeListResponse } from "@/app/api/query/product/dto";

// check if episode is free, paid, rental, or collect
export const getEpisodeBadge = (
  episode: ISelectEpisodeObject | IEpisodeListResponse["data"]["episodes"][0]
) => {
  if (episode.priceType === "free") {
    return "free";
  } else if (
    episode.priceType === "paid" &&
    episode.ownType !== "rental" &&
    episode.ownType !== "own"
  ) {
    return "paid";
  } else if (
    episode.priceType === "paid" &&
    episode.ownType === "rental" &&
    (!episode.rentalRemaining ||
      (episode.rentalRemaining?.days === 0 &&
        episode.rentalRemaining?.hours === 0))
  ) {
    return "paid";
  } else if (episode.ownType === "rental") {
    return "rental";
  } else if (episode.ownType === "own") {
    return "collect";
  } else {
    return null;
  }
};
