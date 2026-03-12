import { useSignOut } from "@/app/api/auth";
import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import useMediaDevice from "@/hooks/useMediaDevice";
import useOutsideListener from "@/hooks/useOutsideListener";
import useAuthStore from "@/store/authStore";
import useToastStore from "@/store/toastStore";
import { IRole } from "@/types";
import { getUser } from "@/utils/getUser";
import { setLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../common/Button";
import RoundBadge from "../common/RoundBadge";
import Spinner from "../common/Spinner";
import UserNickname from "../common/UserNickname";
import AdultToggle from "./AdultToggle";
import AlarmMenu from "./AlarmMenu";
import MenuIcon from "./MenuIcon";
import { moveToPartnerSettlementWithRelay } from "@/utils/partnerRelay";
import ArrowRight from "/public/images/arrow-right-small.svg";
import Close from "/public/images/close.svg";
import Gift from "/public/images/gift.svg";
import List from "/public/images/list.svg";
import Person from "/public/images/person.svg";

const GlobalMenu = () => {
  const router = useRouter();
  const pathname = usePathname();
  const device = useMediaDevice();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore((state) => ({ user: state.user }));
  const { isAuthenticated } = useAuthStore();
  useEffect(() => {
    setIsOpen(false);
  }, [device]);

  return (
    <div className="relative flex justify-center items-center">
      <button
        className="hover:text-dark-gray-400"
        onClick={() => {
          // if (isAuthenticated) {
          if (user?.userRole) {
            setIsOpen(true);
          } else {
            // Save current page before redirecting to login
            const currentPath = window.location.pathname + window.location.search;
            setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);

            const currentUrl = encodeURIComponent(pathname);
            if (device !== "desktop" && device !== "tablet") {
              window.location.href = `/login?redirect=${currentUrl}`;
            } else {
              router.push(`/login?modal=open&redirect=${currentUrl}`, {
                scroll: false,
              });
            }
          }
        }}
      >
        <div className="hidden md:contents">
          <MenuIcon menu={<Person />} dotColor="red" />
        </div>
        <div className="md:hidden contents">
          <MenuIcon menu={<List />} dotColor="red" isDotActive />
        </div>
      </button>
      <GlobalMenuModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

const GlobalMenuModal = ({ isOpen, setIsOpen, onClose }: CommonModalProps) => {
  const router = useRouter();
  const user = getUser();
  const { setToast } = useToastStore();
  const [animationOpen, setAnimationOpen] = useState(false);
  const [modalRef, setModalRef] = useState<HTMLDivElement | null>(null);
  const { refreshToken, signOut } = useAuthStore();
  const { mutateAsync, isPending } = useSignOut();
  const { data: userInfo } = useSelectUserInfo(user?.userId ?? 0);

  const handleSignOut = async () => {
    try {
      await mutateAsync(refreshToken as string);
    } catch (error) {
      // 백엔드 signout 실패해도 로컬 토큰은 반드시 정리
    } finally {
      signOut();
      window.location.href = "/login";
    }
  };

  const handleCloseModal = () => {
    setAnimationOpen(false);

    if (modalRef) {
      modalRef.addEventListener(
        "transitionend",
        () => {
          onClose();
        },
        { once: true }
      );
    }
  };

  useOutsideListener({
    content: modalRef,
    onClose: handleCloseModal,
  });

  useEffect(() => {
    setTimeout(() => {
      setAnimationOpen(isOpen);
    }, 100);
  }, [isOpen]);
  return isOpen ? (
    <div className="md:contents fixed top-0 right-0 w-screen h-screen bg-black/50 z-[9999]">
      <div
        ref={setModalRef}
        className={`transition-all duration-300 absolute top-0 right-0 h-screen ${
          animationOpen
            ? "w-[85vw] md:w-auto md:max-h-[calc(100vh-140px)]"
            : "w-0 md:w-auto md:max-h-0"
        }
        flex flex-col
        md:h-auto
        md:absolute md:top-[40px] md:right-[-20px] md:rounded-[20px] md:border md:border-light-gray-400 md:shadow-xl overflow-hidden bg-white`}
      >
        <div className="flex justify-end p-4">
          <div className="flex md:hidden items-center gap-3 mr-3">
            <AdultToggle />
            <button
              className="hover:text-dark-gray-400"
              onClick={() => {
                router.push("/product/present");
                setIsOpen(false);
              }}
            >
              <MenuIcon menu={<Gift />} dotColor="red" />
            </button>
            <AlarmMenu />
          </div>
          <button onClick={handleCloseModal} className="">
            <Close className="w-[15px] h-[15px]" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="w-full md:w-[410px] px-5 pb-5 border-b-8">
            <div className="w-full flex items-center justify-between">
              <div
                className="flex gap-4 cursor-pointer"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/product/mypage/home");
                }}
              >
                <img
                  src={userInfo?.data.userProfileImagePath ?? ""}
                  alt="프로필"
                  width={60}
                  height={60}
                  className="md:w-[60px] w-[40px] md:h-[60px] h-[40px] rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <div className="flex items-center md:gap-5pxr gap-2">
                    <UserNickname
                      userNickname={userInfo?.data?.userNickname ?? ""}
                      userEventLevelBadge={
                        userInfo?.data?.userEventLevelBadgeImagePath
                      }
                      textStyle="md:text-22pxr text-16pxr font-bold"
                      badgeStyle="w-[12px] h-[12px] md:w-[16px] md:h-[16px]"
                    />
                    {(userInfo?.data?.userRole as IRole) !== "user" &&
                      (userInfo?.data?.userRole as IRole) !== "enter" && (
                        <RoundBadge
                          type={
                            userInfo?.data?.userRole as Exclude<
                              IRole,
                              "user" | "enter" | "admin"
                            >
                          }
                        />
                      )}
                  </div>
                  <p className="text-11pxr md:text-14pxr text-gray-400">
                    {userInfo?.data?.email}
                  </p>
                </div>
              </div>
              {/* <ProfileMenu /> */}
            </div>
            <button
              className="md:hidden w-full text-16pxr font-medium flex items-center gap-3 border-t pt-5 mt-5"
              onClick={() => {
                router.push("/product/author");
                setIsOpen(false);
              }}
            >
              <Image
                src={"/images/write.svg"}
                width={18}
                height={18}
                alt="글쓰기"
              />
              글쓰기
            </button>
          </div>
          <div className="w-w-[410px] px-5 py-2 md:py-5 flex justify-between items-center border-b-8 md:border-b">
            <div className="flex flex-col">
              <span className="text-14pxr md:text-13pxr text-gray-600">
                보유캐시
              </span>
              <div className="flex md:gap-2 flex-col md:flex-row items-start md:items-center ">
                <div className="flex items-center gap-2">
                  <Image
                    src="/images/coin-yellow.svg"
                    alt="코인"
                    width={20}
                    height={20}
                  />
                  <span className="text-20pxr font-semibold">
                    {userInfo?.data?.totalCash ?? 0}
                  </span>
                </div>
                <div className="flex md:items-center gap-2">
                  <Image
                    src="/images/discount.svg"
                    alt="할인"
                    width={23}
                    height={19}
                    className="md:ml-2"
                  />
                  <span className="text-14pxr text-gray-600">
                    대여권 {userInfo?.data?.totalTicket ?? 0}장
                  </span>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                router.push("/product/mypage/cash");
              }}
            >
              캐쉬충전
            </Button>
          </div>
          <div className="flex gap-4 mx-6 py-5 justify-evenly border-b">
            <MenuItem
              icon="/images/favorite.svg"
              iconWidth={19}
              iconHeight={23}
              text="선호작"
              onClick={() => {
                router.push("/product/preference");
                setIsOpen(false);
              }}
            />
            <MenuItem
              icon="/images/promotions.svg"
              iconWidth={25}
              iconHeight={25}
              text="프로모션"
              onClick={() => {
                router.push("/product/promotion");
                setIsOpen(false);
              }}
            />
            <MenuItem
              icon="/images/review.svg"
              iconWidth={24}
              iconHeight={23}
              text="리뷰홍보"
              onClick={() => {
                router.push("/product/review");
                setIsOpen(false);
              }}
            />
            <MenuItem
              icon="/images/quest.svg"
              iconWidth={28}
              iconHeight={23}
              text="퀘스트"
              onClick={() => {
                router.push("/product/quest");
                setIsOpen(false);
              }}
            />
          </div>
          <div className="flex flex-col px-6 py-7 gap-3">
            <StatItem
              icon="/images/test/fire.svg"
              label="관심 유지수"
              value={userInfo?.data?.totalInterestSustainCount ?? 0}
              iconWidth={16}
              iconHeight={21}
            />
            <StatItem
              icon="/images/check2.svg"
              label="인기 적중"
              value={userInfo?.data?.totalVoteWinCount ?? 0}
              value2={userInfo?.data?.totalVoteRound ?? 0}
              iconWidth={22}
              iconHeight={22}
            />
            <StatItem
              icon="/images/paper.svg"
              label="총 읽은 작품 수"
              value={userInfo?.data?.totalReadProductCount ?? 0}
              iconWidth={20}
              iconHeight={22}
            />
            <StatItem
              icon="/images/document.svg"
              label="연재한 작품 수"
              value={userInfo?.data?.totalWrittenProductCount ?? 0}
              iconWidth={20}
              iconHeight={22}
            />
          </div>
          <div className="flex flex-col p-2.5 bg-light-gray-100">
            <button
              className="p-4 bg-white rounded-lg flex justify-between items-center"
              onClick={() => {
                void moveToPartnerSettlementWithRelay();
              }}
            >
              <div className="flex gap-3">
                <Image
                  src="/images/chart.svg"
                  alt="차트"
                  width={23}
                  height={22}
                />
                <span className="text-16pxr font-medium">정산/통계</span>
              </div>
              <div>
                <ArrowRight className="text-gray-400" />
              </div>
            </button>
          </div>
          <div className="px-7 pt-8 pb-9 text-16pxr font-medium flex flex-col md:grid md:grid-cols-2 gap-4">
            <button
              className="w-fit"
              onClick={() => {
                router.push("/product/mypage/profile");
              }}
            >
              프로필관리
            </button>
            <button
              className="w-fit"
              onClick={() => {
                router.push("/product/mypage/comment");
                setIsOpen(false);
              }}
            >
              내 댓글
            </button>
            <button
              className="w-fit"
              onClick={() => {
                router.push("/product/preference/last-viewed");
                setIsOpen(false);
              }}
            >
              최근 본 작품
            </button>
            <button
              className="w-fit"
              onClick={() => {
                router.push("/product/mypage/alarm");
                setIsOpen(false);
              }}
            >
              알림설정
            </button>
            <button
              className="w-fit"
              onClick={() => {
                router.push("/product/customer-service/notice");
                setIsOpen(false);
              }}
            >
              고객센터
            </button>
          </div>
          <button
            className="flex w-full justify-center items-center py-4 text-14pxr font-medium text-gray-500 border-t"
            disabled={isPending}
            onClick={() => {
              handleSignOut();
            }}
          >
            {isPending ? <Spinner size={20} /> : "로그아웃"}
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

const MenuItem = ({
  icon,
  text,
  iconWidth,
  iconHeight,
  onClick,
}: {
  icon: string;
  text: string;
  iconWidth: number;
  iconHeight: number;
  onClick?: () => void;
}) => {
  return (
    <div
      className="flex flex-col justify-center items-center cursor-pointer"
      onClick={onClick}
    >
      <div className="md:w-12 md:h-12 contents md:flex rounded-full items-center justify-center bg-light-gray-100 hover:bg-light-gray-300">
        <Image src={icon} alt="아이콘" width={iconWidth} height={iconHeight} />
      </div>
      <span className="text-14pxr text-gray-600">{text}</span>
    </div>
  );
};

const StatItem = ({
  icon,
  label,
  value,
  iconWidth,
  iconHeight,
  value2,
}: {
  icon: string;
  label: string;
  value: number;
  value2?: number;
  iconWidth: number;
  iconHeight: number;
}) => {
  return (
    <article className="flex justify-between items-center">
      <div className="flex gap-2">
        <div className="w-[22px] flex justify-center items-center">
          <Image
            src={icon}
            alt="아이콘"
            width={iconWidth}
            height={iconHeight}
          />
        </div>
        <span className="text-16pxr font-medium">{label}</span>
      </div>
      <span className="text-16pxr text-gray-500">
        {value}
        {(value2 as number) >= 0 && (
          <span className="text-dark-gray-100"> / {value2}</span>
        )}
      </span>
    </article>
  );
};

export default GlobalMenu;
