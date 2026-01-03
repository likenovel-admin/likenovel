import useOutsideListener from "@/hooks/useOutsideListener";
import { useState } from "react";
import Another from "/public/images/another.svg";
interface ISimpleMenuProps {
  menuList: {
    title: string;
    onClick: () => void;
  }[];
}

const SimpleMenu = ({ menuList }: ISimpleMenuProps) => {
  const [isExtraOpen, setIsExtraOpen] = useState(false);
  const [extraMenuRef, setExtraMenuRef] = useState<HTMLDivElement | null>(null);
  useOutsideListener({
    content: extraMenuRef,
    onClose: () => setIsExtraOpen(false),
  });
  return (
    <div className="relative">
      <button
        className="p-2 text-dark-gray-100 hover:text-dark-gray-500"
        onClick={() => setIsExtraOpen(true)}
      >
        <Another className="w-[3px] h-[15px]" />
      </button>
      {isExtraOpen && (
        <div
          className="absolute w-max right-2 flex justify-center flex-col bg-white border border-light-gray-500 rounded-[8px] z-[21]"
          ref={setExtraMenuRef}
        >
          {menuList.map((menu) => (
            <button
              key={menu.title}
              className="text-14pxr px-[20px] w-full [&:not(:first-child)]:border-t py-2 hover:bg-light-gray-100"
              onClick={menu.onClick}
            >
              {menu.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleMenu;
