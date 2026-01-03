import FloatingMenu from "../common/FloatingMenu";
import EpisodeList from "/public/images/episode-list.svg";
import GoFirst from "/public/images/go-first.svg";
import Setting from "/public/images/setting.svg";
interface Props {
  onEpisodeListClick: (e: React.MouseEvent) => void;
  onSettingClick: (e: React.MouseEvent) => void;
  onGoFirstClick: (e: React.MouseEvent) => void;
  isScroll: boolean;
}
const ViewerSideMenu = ({
  onEpisodeListClick,
  onGoFirstClick,
  onSettingClick,
  isScroll,
}: Props) => {
  return (
    <div className="flex-col flex gap-9pxr absolute bottom-80pxr right-5 z-40">
      <FloatingMenu onClick={(e: React.MouseEvent) => onEpisodeListClick(e)}>
        <EpisodeList />
      </FloatingMenu>
      <FloatingMenu onClick={(e: React.MouseEvent) => onSettingClick(e)}>
        <Setting />
      </FloatingMenu>
      <FloatingMenu onClick={(e: React.MouseEvent) => onGoFirstClick(e)}>
        <div className={`${!isScroll && "transform -rotate-90"}`}>
          <GoFirst />
        </div>
      </FloatingMenu>
    </div>
  );
};
export default ViewerSideMenu;
