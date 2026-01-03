import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import Image from "next/image";

const PossessionCash = () => {
  const { data: user } = useSelectUserInfo();
  return (
    <div className="p-2 md:p-[14px] border rounded-xl h-fit bg-gray-100 w-full">
      <div className=" gap-2 shadow-md bg-white rounded-xl flex items-center text-12pxr text-gray-500 px-3 py-4">
        <div className="w-[22px] h-[22px] text-16pxr relative">
          <Image src="/images/coin-yellow.svg" alt="cash" fill />
        </div>
        <span className="">보유 캐시</span>
        <div className="text-primary-100 text-15pxr md:text-20pxr">
          {(user?.data.totalCash || 0).toLocaleString()}
          <span className="text-black-100">{"c"}</span>
        </div>
      </div>
    </div>
  );
};

export default PossessionCash;
