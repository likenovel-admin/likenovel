"use client";
import LastPageNotice from "@/components/common/LastPageNotice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MobileFooter from "./MobileFooter";
import Arrow from "/public/images/footer-arrow.svg";
import Logo from "/public/images/logos/footer-logo.svg";
const Footer = () => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);
  return (
    <div className="w-full">
      <LastPageNotice />
      <div className="w-full h-[270px] md:h-[392px] bg-black-200">
        {/* TODO 최신 공지 표시 추가 */}
        {isMobile ? (
          <MobileFooter />
        ) : (
          <div className="flex w-full justify-between px-60pxr">
            <div className="flex flex-col mt-[43px]">
              <div className="mb-[32px]">
                <Logo />
              </div>
              <div className="flex items-center gap-[20px]">
                <button
                  className="text-white text-15pxr hover:underline"
                  onClick={() => {
                    router.push("/product/agree/terms");
                  }}
                >
                  이용약관
                </button>
                <div className="h-[10px] border-l-dark-gray-500 border-l-2 border-t-0 border-r-0 border-b-0" />
                <button
                  className="text-white text-15pxr hover:underline"
                  onClick={() => {
                    router.push("/product/agree/privacy");
                  }}
                >
                  개인정보취급방침
                </button>
                <div className="h-[10px] border-l-dark-gray-500 border-l-2 border-t-0 border-r-0 border-b-0" />
                <button
                  className="text-white text-15pxr hover:underline"
                  onClick={() => {
                    router.push("/product/customer-service/notice");
                  }}
                >
                  고객센터
                </button>
              </div>
              <div className="flex mt-[21px] gap-[15px] text-dark-gray-200 text-14pxr">
                <span>라이크노벨</span> <span>대표 : 이홍산</span>
                <span>사업자 등록 번호 : 327-24-00954</span>
              </div>
              <div className="flex flex-wrap text-dark-gray-200 text-14pxr">
                <span className="mr-[15px]">
                  통신판매업신고 : 2020-성남분당C-0039
                </span>
                <span className="min-w-[200px]">
                  이메일 : admin@likenovel.net
                </span>
              </div>
              <span className="text-dark-gray-200 text-14pxr">
                경기도 용인시 기흥구 공세로 150-29, B01-J207호(공세동, 테라스가
                든)
              </span>
              <div className="mt-[17px] text-dark-gray-200 text-14pxr">
                © 2026 라이크노벨
              </div>
            </div>
            <div className="flex flex-col mt-[40px]">
              <span className="text-white">고객센터</span>
              <div className="text-white mt-[19px] text-28pxr">
                admin@likenovel.net
              </div>
              <div className="flex gap-[15px] text-dark-gray-400 text-13pxr mt-[12px]">
                <span>상담가능시간</span>
                <span>평일 09:00 ~ 18:00 / 점심시간 12:30~13:30</span>
              </div>
              <div className="flex mt-[19px] gap-[7px]">
                <button
                  className="flex justify-center items-center gap-[9px] text-white text-14pxr border border-dark-gray-400 rounded-lg px-[22px] py-[8px] hover:bg-black-100"
                  onClick={() => {
                    router.push("/product/customer-service/faq");
                  }}
                >
                  FAQ
                  <Arrow />
                </button>
                <a
                  href="/product/customer-service/inquiry"
                  className="flex justify-center items-center gap-[9px] text-white text-14pxr border border-dark-gray-400 rounded-lg px-[22px] py-[8px] hover:bg-black-100"
                >
                  1:1고객상담
                  <Arrow />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Footer;
