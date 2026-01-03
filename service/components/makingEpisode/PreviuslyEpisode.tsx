import Image from "next/image";

const PreviuslyRound = () => {
  return (
    <div className="w-full px-[15px] pb-[15px] flex items-center gap-[13px] border-b md:justify-between">
      <Image
        src="/images/home.svg"
        alt="previusly-round"
        width={18}
        height={20}
      />
      <div className="flex flex-col gap-1">
        <span className="text-11pxr text-dark-gray-400">
          세계전복급 악역으로 오해 받고 있습니다
        </span>
        <div className="flex gap-1 items-center font-semibold">
          <div className="flex items-center font-normal justify-center border border-[#05a1d3] rounded-full h-[15px] p-1 text-11pxr text-[#05a1d3]">
            최근 회차
          </div>
          <span className="text-15pxr md:text-16pxr text-black-100">
            3화. 이혼은 전문 변호사에게 맡기세요
          </span>
        </div>
      </div>
      <button className="ml-auto md:ml-0">
        <Image src="/images/close.svg" alt="닫기" width={16} height={16} />
      </button>
    </div>
  );
};

export default PreviuslyRound;
