import { ADMIN_EMAIL } from "@/constants/common";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Arrow from "/public/images/footer-arrow-bottom.svg";
const MobileFooter = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative flex pt-[38px] px-[16px] justify-center">
      <div className="flex flex-col justify-center w-full">
        <button
          className="flex justify-center items-center gap-[10px] p-[5px]"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          <div className="text-white text-12pxr">라이크노벨 사업자 정보</div>
          <Arrow className={`${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div className="absolute left-0 top-[60px] w-full bg-black-100 z-50">
            <div className="flex justify-center mt-[10px] gap-[15px] text-dark-gray-200 text-12pxr">
              <span>라이크노벨</span> <span>대표 : 이홍산</span>
              <span>사업자 등록 번호 : 327-24-00954</span>
            </div>
            <div className="flex justify-center flex-wrap text-dark-gray-200 text-12pxr">
              <span className="mr-[15px]">
                통신판매업신고 : 2020-성남분당C-0039
              </span>
            </div>
            <div className="flex justify-center text-dark-gray-200 text-12pxr">
              <span className="mr-[15px]">대표전화 : 070-5157-3000</span>
              <span className="">이메일 : admin@likenovel.net</span>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-dark-gray-200 text-12pxr">
                경기도 용인시 기흥구 공세로 150-29,
              </p>
              <p className="text-dark-gray-200 text-12pxr">
                B01-J207호(공세동, 테라스가 든) 
              </p>
            </div>
            <div className="flex justify-center mt-[10px] text-dark-gray-200 text-12pxr">
              © 2024 LikeNovel
            </div>
          </div>
        )}
        <div className="flex justify-center items-center gap-[20px] mt-[10px] font-semibold">
          <button
            className="text-white text-12pxr hover:underline"
            onClick={() => {
              router.push("/product/agree/terms");
            }}
          >
            이용약관
          </button>
          <button
            className="text-white text-12pxr hover:underline"
            onClick={() => {
              router.push("/product/agree/privacy");
            }}
          >
            개인정보취급방침
          </button>
          <button
            className="text-white text-12pxr hover:underline"
            onClick={() => {
              router.push("/product/agree/operate");
            }}
          >
            운영정책
          </button>
          <button
            className="text-white text-12pxr hover:underline"
            onClick={() => {
              router.push("/product/customer-service/notice");
            }}
          >
            고객센터
          </button>
        </div>
        <div className="w-full border-b-[#27282E] border-b-2 border-t-0 border-r-0 border-l-0 my-[20px]" />
        <div className="flex justify-center text-white font-semibold">
          070-5157-3000
        </div>
        <div className="flex justify-center gap-[15px] text-dark-gray-400 text-12pxr mt-[8px]">
          <span>상담가능시간</span>
          <span>평일 09:00 ~ 18:00 / 점심시간 12:30~13:30</span>
        </div>
        <div className="flex justify-center mt-[19px] gap-[7px]">
          <button
            className="flex w-full justify-center items-center gap-[9px] text-white text-11pxr border border-dark-gray-400 rounded-lg py-[8px] hover:bg-black-100"
            onClick={() => {
              router.push("/product/customer-service/faq");
            }}
          >
            FAQ
          </button>
          <a
            href={ADMIN_EMAIL}
            className="flex w-full justify-center items-center gap-[9px] text-white text-11pxr border border-dark-gray-400 rounded-lg py-[8px] hover:bg-black-100"
          >
            1:1고객상담
          </a>
        </div>
      </div>
    </div>
  );
};
export default MobileFooter;
