import InvertedTriangle from "/public/images/inverted-triangle.svg";
import Triangle from "/public/images/triangle.svg";

interface Props {
  rankIndicator: number;
  textStyles?: string;
  alignLocation?: "center" | "end";
}
const RankIndicator = ({
  rankIndicator,
  textStyles = "text-12pxr font-bold",
  alignLocation = "end",
}: Props) => {
  return (
    <div className="flex items-center h-[12px]">
      {rankIndicator !== undefined &&
        (rankIndicator > 0 ? (
          <span
            className={`flex gap-2pxr items-end ${textStyles} text-red-100`}
          >
            <Triangle
              className={`${
                alignLocation === "center" ? "mb-7pxr" : "mb-3pxr"
              } `}
            />
            {rankIndicator}
          </span>
        ) : rankIndicator < 0 ? (
          <span
            className={`flex gap-2pxr items-end ${textStyles} text-primary-100`}
          >
            <InvertedTriangle
              className={`${
                alignLocation === "center" ? "mb-7pxr" : "mb-3pxr"
              } `}
            />
            {String(rankIndicator).replace("-", "")}
          </span>
        ) : (
          <span className="text-15pxr font-bold text-dark-gray-200">-</span>
        ))}
    </div>
  );
};
export default RankIndicator;
