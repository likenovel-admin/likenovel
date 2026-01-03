import { setLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import Box from "/public/images/box-button.svg";
import List from "/public/images/list-button.svg";
interface Props {
  listType: "list" | "box";
  setListType: (listType: "list" | "box") => void;
  isFree?: boolean;
}
const ListTypeTab = ({ listType, setListType, isFree }: Props) => {
  const iconStyle = (value: string) => {
    return listType === value
      ? "text-black-100"
      : "text-light-gray-500 hover:text-dark-gray-300 transition-colors";
  };
  return (
    <div className="flex mr-16pxr md:mr-0">
      <button
        className={`flex justify-center items-center w-[30px] h-[30px] rounded-l-[6px] rounded-r-0 border border-light-gray-600 hover:bg-light-gray-100 ${iconStyle(
          "list"
        )}`}
        onClick={() => {
          setListType("list");
          if (isFree) {
            setLocalStorage(STORAGE_KEYS.FREE_TOP_VIEW_TYPE, "list");
          } else {
            setLocalStorage(STORAGE_KEYS.PAID_TOP_VIEW_TYPE, "list");
          }
        }}
      >
        <List className={`w-[12px] h-[12px]`} />
      </button>
      <button
        className={`flex justify-center items-center w-[30px] h-[30px] rounded-r-[6px] rounded-l-0 border border-light-gray-600 border-l-0 hover:bg-light-gray-100 ${iconStyle(
          "box"
        )}`}
        onClick={() => {
          setListType("box");
          if (isFree) {
            setLocalStorage(STORAGE_KEYS.FREE_TOP_VIEW_TYPE, "box");
          } else {
            setLocalStorage(STORAGE_KEYS.PAID_TOP_VIEW_TYPE, "box");
          }
        }}
      >
        <Box className={`w-[12px] h-[12px]`} />
      </button>
    </div>
  );
};
export default ListTypeTab;
