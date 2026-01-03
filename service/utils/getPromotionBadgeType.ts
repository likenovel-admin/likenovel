export const getPromotionBadgeType = (
  waitForFreeYn?: "Y" | "N",
  freeEpisodes?: number,
  timepassFromTo?: string,
  sixNinePathYn?: "Y" | "N"
): ("waitForFree" | "freeEpisodes" | "timePass")[] => {
  let badgeType: ("waitForFree" | "freeEpisodes" | "timePass")[] = [];
  if (waitForFreeYn === "Y") {
    badgeType.push("waitForFree");
  }
  if (freeEpisodes) {
    badgeType.push("freeEpisodes");
  }
  if (timepassFromTo || sixNinePathYn === "Y") {
    badgeType.push("timePass");
  }
  return badgeType;
};
