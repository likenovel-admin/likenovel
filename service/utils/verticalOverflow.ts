type VerticalOverflowMetrics = Pick<
  HTMLElement,
  "clientHeight" | "scrollHeight"
>;

export const isVerticallyOverflowing = ({
  clientHeight,
  scrollHeight,
}: VerticalOverflowMetrics) => scrollHeight - clientHeight > 1;
