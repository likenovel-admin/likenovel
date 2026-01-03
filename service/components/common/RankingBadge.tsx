import RankIndicator from "./RankIndicator";
import RankingOne from "/public/images/ranking-one.svg";
import RankingThree from "/public/images/ranking-three.svg";
import RankingTwo from "/public/images/ranking-two.svg";
import Ranking from "/public/images/ranking.svg";
interface RankingBadgeProps {
  rank: number;
  rankIndicator?: number;
}

const RankingBadge: React.FC<RankingBadgeProps> = ({ rank, rankIndicator }) => {
  let rankingComponent;
  let rankingColor;

  const leftPosition = rank >= 10 ? "left-[5px]" : "left-[10px]";

  switch (rank) {
    case 1:
      rankingComponent = <RankingOne />;
      rankingColor = "#8B3900";
      break;
    case 2:
      rankingComponent = <RankingTwo />;
      rankingColor = "#2D3036";
      break;
    case 3:
      rankingComponent = <RankingThree />;
      rankingColor = "#893B00";
      break;
    default:
      rankingComponent = <Ranking />;
      rankingColor = "#525252";
  }

  return (
    <div className="flex flex-col items-center gap-5pxr">
      <div className="relative">
        {rankingComponent}
        <span
          className={`absolute top-[2px] ${leftPosition} text-16pxr font-bold`}
          style={{ color: rankingColor }}
        >
          {rank}
        </span>
      </div>
      {rankIndicator !== undefined && (
        <RankIndicator rankIndicator={rankIndicator}></RankIndicator>
      )}
    </div>
  );
};

export default RankingBadge;
