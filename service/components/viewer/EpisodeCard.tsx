import SquareBadge from "../common/SquareBadge";
import ThumbsUp from "/public/images/thumbs-up-gray.svg";
import View from "/public/images/view.svg";
interface Props {
  episodeTitle?: string;
  episode?: number;
  isRead?: boolean;
  isCurrent?: boolean;
  badges?: Badge;
  uploadDate?: string;
  viewCount?: number;
  likeCount?: number;
  onClick?: () => void;
}

interface Badge {
  free: boolean;
  rental: boolean;
  collect: boolean;
}

const EpisodeCard = ({
  episodeTitle,
  episode,
  isRead = false,
  isCurrent = false,
  badges = { free: true, rental: false, collect: false },
  uploadDate,
  viewCount,
  likeCount,
  onClick: onclick,
}: Props) => {
  return (
    <div
      className={`rounded-lg border px-20pxr py-21pxr cursor-pointer ${
        isCurrent
          ? "border-[#0092C1] bg-[#F4FBFE]"
          : "border-light-gray-400"
      }`}
      onClick={onclick}
    >
      <div className="flex justify-between mb-5pxr">
        <div className="flex gap-2pxr">
          {badges?.free ? (
            <SquareBadge type="free" />
          ) : (
            <SquareBadge type="paid" />
          )}
          {badges?.rental && <SquareBadge type="rental" />}
          {badges?.collect && <SquareBadge type="collect" />}
        </div>
        <div className="flex items-center gap-4pxr">
          {isCurrent && (
            <div className="flex justify-center items-center min-w-34pxr h-22pxr px-8pxr rounded-xl border border-[#B9E7F7] bg-[#F4FBFE] text-[#0092C1] text-12pxr">
              현재
            </div>
          )}
          {isRead && (
            <div className="flex justify-center items-center w-34pxr h-22pxr rounded-xl border border-[#0092C1] text-[#0092C1] text-12pxr">
              읽음
            </div>
          )}
        </div>
      </div>
      <div className="w-4/5">
        <span className="text-18pxr font-medium break-words">
          {/* {episode}화. {episodeTitle} */}
          {episodeTitle}
        </span>
      </div>
      <div className="flex items-center gap-11pxr">
        <span className="text-dark-gray-400 text-13pxr">{uploadDate}</span>
        <div className="h-8pxr border border-l-1 border-[#D5D7E1]" />
        <div className="flex items-center gap-1">
          <View className="w-[14px] h-[12px] text-dark-gray-600" />
          <span className="text-dark-gray-400 text-13pxr">{viewCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbsUp className="w-[15px] h-[12px]" />
          <span className="text-dark-gray-400 text-13pxr">{likeCount}</span>
        </div>
        {/* TODO: 댓글수 추가 */}
      </div>
    </div>
  );
};

export default EpisodeCard;
