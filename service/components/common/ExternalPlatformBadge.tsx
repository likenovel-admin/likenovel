import {
  EXTERNAL_DISTRIBUTION_PLATFORMS,
  type ExternalDistributionPlatform,
} from "@/constants/externalDistribution";

interface Props {
  platform: ExternalDistributionPlatform;
}

// Tailwind는 components/ 아래 파일만 스캔하므로 색 클래스는 이 컴포넌트에 둔다.
const BADGE_COLOR_CLASS: Record<ExternalDistributionPlatform, string> = {
  kakaopage: "bg-[#FFE300] text-black-100",
  ridi: "bg-[#1E9EFF] text-white",
};

/**
 * 표지 왼쪽 위 고정 배지.
 * 오른쪽 위 19세 배지(24px + 여백 5px)와 겹치지 않도록 최대 너비를 표지 너비 - 39px로 제한한다.
 */
const ExternalPlatformBadge = ({ platform }: Props) => {
  const config = EXTERNAL_DISTRIBUTION_PLATFORMS[platform];
  return (
    <span
      data-testid="external-platform-badge"
      className={`pointer-events-none absolute top-[5px] left-[5px] z-10 flex h-[18px] max-w-[calc(100%-39px)] items-center overflow-hidden whitespace-nowrap px-[3px] text-10pxr font-bold leading-none ${BADGE_COLOR_CLASS[platform]}`}
    >
      {config.label}
    </span>
  );
};

export default ExternalPlatformBadge;
