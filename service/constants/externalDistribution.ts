export const EXTERNAL_DISTRIBUTION_PLATFORMS = {
  kakaopage: {
    label: "카카오페이지",
  },
  ridi: {
    label: "리디",
  },
} as const;

export type ExternalDistributionPlatform =
  keyof typeof EXTERNAL_DISTRIBUTION_PLATFORMS;

export const EXTERNAL_DISTRIBUTION_PLATFORM_ORDER: ExternalDistributionPlatform[] =
  ["kakaopage", "ridi"];

export const EXTERNAL_DISTRIBUTION_PATH = "/product/external-distribution";

export const isExternalDistributionPlatform = (
  value: unknown
): value is ExternalDistributionPlatform =>
  typeof value === "string" &&
  Object.prototype.hasOwnProperty.call(EXTERNAL_DISTRIBUTION_PLATFORMS, value);

export const parseExternalDistributionPlatform = (
  value: string | null | undefined
): ExternalDistributionPlatform =>
  isExternalDistributionPlatform(value) ? value : "kakaopage";

export const buildExternalDistributionPath = (
  platform: ExternalDistributionPlatform
) => `${EXTERNAL_DISTRIBUTION_PATH}?platform=${platform}`;

export const buildExternalDistributionDescription = (
  platform: ExternalDistributionPlatform,
  minOpenEpisodes: number
) =>
  `라이크노벨에서 ${minOpenEpisodes}화 이상 유료 연재한 작품은 ${EXTERNAL_DISTRIBUTION_PLATFORMS[platform].label}에서도 연재돼요.`;
