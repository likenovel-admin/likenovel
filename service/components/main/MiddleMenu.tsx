import useConfirmStore from "@/store/confirmStore";
import { getUser } from "@/utils/getUser";
import { usePathname, useRouter } from "next/navigation";
import Coin from "/public/images/coin.svg";
import Event from "/public/images/event.svg";
import Favorite from "/public/images/favorite.svg";
import ProtagonistChat from "/public/images/protagonist-chat.svg";
import Promotion from "/public/images/promotions.svg";
import Quest from "/public/images/quest.svg";
import Sale from "/public/images/sale.svg";
const MiddleMenu = () => {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();
  const { setConfirm } = useConfirmStore();

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

  const menuList = [
    {
      icon: Favorite,
      text: "선호작",
      onClick: () => {
        if (!user?.userRole) {
          handleLoginNeeded();
          return;
        }
        router.push("/product/preference");
      },
      style: "w-[17px] md:w-[24px]",
    },
    {
      icon: Promotion,
      text: "프로모션",
      onClick: () => {
        router.push("/product/promotion");
      },
      style: "w-[20px] md:w-[32px]",
    },
    {
      icon: Coin,
      text: "코인충전",
      onClick: () => {
        if (!user?.userRole) {
          handleLoginNeeded();
          return;
        }
        router.push("/product/mypage/cash");
      },
      style: "w-[20px] md:w-[30px]",
    },
    {
      icon: ProtagonistChat,
      text: "주인공챗",
      onClick: () => {
        router.push("/product/character-chat");
      },
      style: "w-[19px] md:w-[30px]",
    },
    {
      icon: Quest,
      text: "퀘스트",
      onClick: () => {
        if (!user?.userRole) {
          handleLoginNeeded();
          return;
        }
        router.push("/product/quest");
      },
      style: "w-[20px] md:w-[34px]",
    },
  ];
  return (
    <div className="flex justify-center items-end gap-20pxr w-full h-[90px] md:h-[120px] overflow-hidden">
      <div className="hidden md:flex flex-col">
        <button
          className="flex justify-center items-center w-[110px] h-[76px]"
          onClick={() => {
            router.push("/product/event");
          }}
        >
          <Event />
        </button>
        <span className="text-14pxr text-center mt-10pxr">이벤트</span>
      </div>
      <div className="flex gap-20pxr md:gap-34pxr">
        {menuList.map((menu) => (
          <div className="relative flex flex-col" key={menu.text}>
            {menu.text === "코인충전" && (
              <div className="absolute z-1 top-[-10px] left-5 md:left-10 w-[29px] h-[18px] md:w-[36px] md:h-[22px]">
                <Sale />
              </div>
            )}
            <button
              className="flex justify-center items-center w-[51px] h-[51px] md:w-[76px] md:h-[76px] bg-light-gray-100 hover:bg-light-gray-300 rounded-full"
              onClick={menu.onClick}
            >
              <menu.icon className={menu.style} />
            </button>
            <span className="text-11pxr md:text-14pxr text-center mt-10pxr">
              {menu.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default MiddleMenu;
