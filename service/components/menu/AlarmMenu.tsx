import useMediaDevice from "@/hooks/useMediaDevice";
import useAlarmStore from "@/store/alarmStore";
import useConfirmStore from "@/store/confirmStore";
import { getUser } from "@/utils/getUser";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import NotificationContainer from "../notification/NotificationContainer";
import MenuIcon from "./MenuIcon";
import Alarm from "/public/images/alarm.svg";
const AlarmMenu = () => {
  const user = getUser();
  const { setConfirm } = useConfirmStore();
  const [isOpen, setIsOpen] = useState(false);
  const { hasNew } = useAlarmStore();
  const [modalRef, setModalRef] = useState<HTMLDivElement | null>(null);
  const device = useMediaDevice();
  const router = useRouter();
  const pathname = usePathname();
  // useOutsideListener({
  //   content: modalRef,
  //   onClose: () => setIsOpen(false),
  // });

  const handleMouseEnter = () => {
    if (user?.userRole && (device === "desktop" || device === "tablet")) {
      setIsOpen(true);
    }
  };

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
      className="relative flex items-center md"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="hover:text-dark-gray-400"
        onClick={() => {
          if (!user?.userRole) {
            handleLoginNeeded();
            return;
          }
          router.push("/product/notification");
        }}
      >
        <MenuIcon menu={<Alarm />} dotColor="red" isDotActive={hasNew} />
      </button>
      {isOpen && (
        <div
          // ref={setModalRef}
          className="hidden md:block md:absolute md:top-[20px] md:left-[-190px] w-fit z-50"
        >
          <NotificationContainer />
        </div>
      )}
    </div>
  );
};

export default AlarmMenu;
