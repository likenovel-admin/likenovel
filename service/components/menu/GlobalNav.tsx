import { useGetChatUnReadCount } from "@/app/api/query/message";
import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import useGiftBoxStore from "@/store/giftboxStore";
import useSearchModalStore from "@/store/searchModalStore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdultToggle from "./AdultToggle";
import AlarmMenu from "./AlarmMenu";
import GlobalMenu from "./GlobalMenu";
import MenuIcon from "./MenuIcon";
import MobileGlobalNav from "./MobileGlobalNav";
import Gift from "/public/images/gift.svg";
import LogoIcon from "/public/images/logos/logo-icon.svg";
import Logo from "/public/images/logos/logo.svg";
import Message from "/public/images/message.svg";
import Pen from "/public/images/pen.svg";
import Search from "/public/images/search.svg";
const GlobalNav = () => {
  const { user } = useAuthStore((state) => ({ user: state.user }));
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, setIsOpen, setScrolled } = useSearchModalStore();
  const [isVisible, setIsVisible] = useState(true);
  const { setConfirm } = useConfirmStore();
  const { hasNew, setHasNew } = useGiftBoxStore();

  const { data: unreadCountData } = useGetChatUnReadCount(!!user?.userId);

  const handleLoginNeeded = () => {
    setConfirm({
      content: "이 콘텐츠를 보시려면 로그인이 필요합니다.",
      confirmText: "로그인하기",
      onConfirm: () => {
        const currentUrl = encodeURIComponent(pathname);
        window.location.href = `/login?redirect=${currentUrl}`;
      },
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsVisible(false);
        setScrolled(true);
      } else {
        setIsVisible(true);
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [setScrolled]);

  return (
    <div className="relative">
      <div className="md:hidden">
        <MobileGlobalNav isVisible={isVisible} />
      </div>
      {/* TODO: 추후 상단바 알림 추가 후 주석 풀어서 적용 
      이 로직을 아래 div에 추가해야합니다.  
      ${isVisible ? "h-[100px]" : "h-[66px]"}  */}
      <div
        className={`hidden fixed top-0 left-0 md:flex flex-col justify-between bg-white z-50 w-full border border-b-light-gray-300 px-60pxr md:px-20pxr lg:px-60pxr`}
      >
        {/* TODO: 추후 상단바 알림 추가 후 주석 풀어서 적용 */}
        {/* {isVisible && (
          <div className="w-full max-w-[1120px] mx-auto flex justify-end mt-17pxr">
            <span className="text-14pxr text-primary-100 font-semibold">
              님이 업로드
            </span>
            <span className="text-14pxr text-dark-gray-500">를 했습니다.</span>
          </div>
        )} */}
        <div className="w-full max-w-[1120px] mx-auto h-[66px] flex items-center justify-between">
          <div className="flex lg:gap-67pxr md:gap-35pxr">
            <button
              className="flex items-center gap-13pxr"
              onClick={() => router.push("/")}
            >
              <div className="mb-[16px]">
                <LogoIcon alt="likenovel icon" className="w-28pxr h-33pxr" />
              </div>
              <div className="block md:hidden lg:block">
                <Logo alt="likenovel logo" className="w-132pxr h-18pxr" />
              </div>
            </button>
            <div className="flex gap-30pxr">
              <button onClick={() => router.push("/product/top50/free-top")}>
                <MenuIcon
                  menu={
                    <span className="text-20pxr font-bold  hover:text-dark-gray-400">
                      TOP50
                    </span>
                  }
                  dotColor="blue"
                  isDotActive
                />
              </button>
              <button onClick={() => router.push("/product/free/normal")}>
                <MenuIcon
                  menu={
                    <span className="text-20pxr font-bold hover:text-dark-gray-400">
                      무료
                    </span>
                  }
                  dotColor="blue"
                />
              </button>
              <button onClick={() => router.push("/product/paid")}>
                <MenuIcon
                  menu={
                    <span className="text-20pxr font-bold hover:text-dark-gray-400">
                      유료
                    </span>
                  }
                  dotColor="blue"
                />
              </button>
              <button
                onClick={() => {
                  if (!user?.userRole) {
                    handleLoginNeeded();
                    return;
                  }
                  router.push("/product/preference");
                }}
              >
                <MenuIcon
                  menu={
                    <span className="text-20pxr font-bold hover:text-dark-gray-400">
                      선호작
                    </span>
                  }
                  dotColor="blue"
                />
              </button>
            </div>
          </div>
          <div className="flex">
            <div className="flex items-center gap-20pxr">
              <AdultToggle />
              {user?.isAdult && (
                <div className="border h-[14px] border-l-light-gray-200" />
              )}
              <button
                className="hover:text-dark-gray-400"
                onClick={() => setIsOpen(!isOpen)}
              >
                <Search
                  className={`w-[20px] h-[20px] ${
                    isOpen ? "text-primary-100" : ""
                  }`}
                />
              </button>
              <AlarmMenu />
              <button
                className="hover:text-dark-gray-400"
                onClick={() => {
                  if (!user?.userRole) {
                    handleLoginNeeded();
                    return;
                  }
                  router.push("/product/message");
                }}
              >
                <MenuIcon
                  menu={<Message className="w-[25px] h-[20px]" />}
                  dotColor="red"
                  isDotActive={
                    !!unreadCountData?.unreadCount &&
                    unreadCountData.unreadCount > 0
                  }
                />
              </button>
              <button
                className="hover:text-dark-gray-400"
                onClick={() => {
                  if (!user?.userRole) {
                    handleLoginNeeded();
                    return;
                  }
                  router.push("/product/present");
                  setHasNew(false);
                }}
              >
                <MenuIcon menu={<Gift />} dotColor="red" isDotActive={hasNew} />
              </button>
              <GlobalMenu />
            </div>
            <div className="ml-27pxr">
              <button
                className="flex justify-center items-center w-[79px] h-[36px] gap-1 rounded-xl border border-dark-gray-100 hover:bg-light-gray-100"
                onClick={() => {
                  if (!user?.userRole) {
                    handleLoginNeeded();
                    return;
                  }
                  router.push("/product/author");
                }}
              >
                <Pen />
                <span className="text-14pxr">글쓰기</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GlobalNav;
