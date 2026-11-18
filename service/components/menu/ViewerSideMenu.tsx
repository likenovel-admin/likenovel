import FloatingMenu from "../common/FloatingMenu";
import EpisodeList from "/public/images/episode-list.svg";
import Setting from "/public/images/setting.svg";
interface Props {
  onEpisodeListClick: (e: React.MouseEvent) => void;
  onSettingClick: (e: React.MouseEvent) => void;
  onGoFirstClick: (e: React.MouseEvent) => void;
  isScroll: boolean;
}
const ViewerSideMenu = ({
  onEpisodeListClick,
  onSettingClick,
}: Props) => {
  return (
    <div className="flex-col flex gap-9pxr absolute bottom-80pxr right-5 z-40">
      <FloatingMenu onClick={(e: React.MouseEvent) => onEpisodeListClick(e)}>
        <EpisodeList />
      </FloatingMenu>
      <div className="hidden md:block">
        <FloatingMenu onClick={onSettingClick}>
          <Setting />
        </FloatingMenu>
      </div>
    </div>
  );
};
export default ViewerSideMenu;
