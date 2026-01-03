import Image from "next/image";
import { ReactNode } from "react";
interface HomeItemProps {
  icon: string;
  title: string;
  numberContent: ReactNode;
  rightContent: ReactNode;
}
const HomeItem = ({
  icon,
  numberContent,
  rightContent,
  title,
}: HomeItemProps) => {
  return (
    <div className="flex border rounded-2xl pl-5 py-4 md:pl-8 md:py7 pr-3 gap-4">
      <div className="w-[40px] h-[40px] md:w-[68px] md:h-[68px] relative">
        <Image src={icon} alt={title} fill />
      </div>
      <div className="flex flex-1 flex-col my-auto">
        <div className="text-12pxr md:text-14pxr text-gray-600">{title}</div>
        <div>{numberContent}</div>
      </div>
      {rightContent}
    </div>
  );
};

export default HomeItem;
