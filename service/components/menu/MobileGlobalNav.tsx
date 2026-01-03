import useConfirmStore from "@/store/confirmStore";
import useSearchModalStore from "@/store/searchModalStore";
import { getUser } from "@/utils/getUser";
import { usePathname, useRouter } from "next/navigation";
import AlarmMenu from "./AlarmMenu";
import GlobalMenu from "./GlobalMenu";
import MenuIcon from "./MenuIcon";
import LogoIcon from "/public/images/logos/logo-icon.svg";
import Logo from "/public/images/logos/logo.svg";
import Search from "/public/images/search.svg";
interface Props {
  isVisible: boolean;
}
const MobileGlobalNav = ({ isVisible }: Props) => {
  const user = getUser();
  const router = useRouter();
  const pathname = usePathname();
  const { setConfirm } = useConfirmStore();
  const { isOpen, setIsOpen } = useSearchModalStore();

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

  return (
    <div
      className={`fixed top-0 left-0 flex flex-col bg-white z-50 w-full border border-b-light-gray-300 ${
        isVisible ? "h-[118px]" : "h-[50px]"
      }  gap-28pxr px-16pxr`}
    >
      {isVisible && (
        <div className="flex justify-between mt-28pxr">
          <button
            className="flex items-center gap-7pxr"
            onClick={() => {
              router.push("/");
            }}
          >
            <div className="mb-[8px]">
              <LogoIcon alt="likenovel icon" className="w-15pxr h-20pxr" />
            </div>
            <div className="block md:hidden lg:block">
              <Logo alt="likenovel logo" className="w-80pxr h-15pxr" />
            </div>
          </button>
          <div className="flex gap-18pxr">
            <button
              className="hover:text-dark-gray-400"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Search className="w-[20px] h-[20px]" />
            </button>
            <AlarmMenu />
            <GlobalMenu />
          </div>
        </div>
      )}
      <div
        className={`flex ${
          isVisible ? "" : "items-center h-[50px] justify-between"
        } `}
      >
        <div className={`flex gap-20pxr`}>
          <button
            onClick={() => {
              router.push("/product/top50/free-top");
            }}
          >
            <MenuIcon
              menu={
                <span className="text-16pxr font-bold  hover:text-dark-gray-400 min-w-[55px]">
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
                <span className="text-16pxr font-bold hover:text-dark-gray-400 min-w-[30px]">
                  무료
                </span>
              }
              dotColor="blue"
            />
          </button>
          <button onClick={() => router.push("/product/paid")}>
            <MenuIcon
              menu={
                <span className="text-16pxr font-bold hover:text-dark-gray-400 min-w-[30px]">
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
                <span className="text-16pxr font-bold hover:text-dark-gray-400 min-w-[45px]">
                  선호작
                </span>
              }
              dotColor="blue"
            />
          </button>
        </div>
        {!isVisible && (
          <div className="flex gap-18pxr">
            <button
              className="hover:text-dark-gray-400"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Search className="w-[20px] h-[20px]" />
            </button>
            <AlarmMenu />
            <GlobalMenu />
          </div>
        )}
      </div>
    </div>
  );
};
export default MobileGlobalNav;
