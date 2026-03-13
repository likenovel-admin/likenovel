"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  Frame,
  LifeBuoy,
  LogOut,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthenticate";
import { clearLocalStorage, confirm } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

/*import DashboardMenuIcon from "@/public/dashboard-menu-icon.svg"*/

const data = {
  user: {
    name: "라이크노벨 작가",
    email: "m@example.com",
    /*avatar: "/avatars/shadcn.jpg",*/
  },
  navMainBase: (pathname: string) => [
    {
      title: "작품 관리",
      url: "/products",
      icon: Bot,
      isActive: pathname.includes("/products"),
      items: [
        {
          title: "작품 리스트",
          url: "/products",
        },
        {
          title: "작품 업로드",
          url: "/products/upload",
        },
      ],
    },
    {
      title: "통계 분석",
      url: "/statistics",
      icon: BookOpen,
      isActive: pathname.includes("/statistics"),
      items: [
        {
          title: "작품별 통계",
          url: "/statistics",
        },
        {
          title: "회차별 통계",
          url: "/statistics/by-episode",
        },
        {
          title: "장바구니 분석",
          url: "/statistics/cart",
        },
        {
          title: "시간별 유입 분석",
          url: "/statistics/by-time",
        },
      ],
    },
    {
      title: "매출 및 정산",
      url: "/sales/products",
      icon: SquareTerminal,
      isActive:
        pathname.includes("/sales") ||
        pathname.includes("/adjustments/monthly") ||
        pathname.includes("/adjustments/deduction-of-deposit"),
      items: [
        {
          title: "작품별 월매출",
          url: "/sales/products",
        },
        {
          title: "회차별 매출",
          url: "/sales/episodes",
        },
        {
          title: "일별 이용권 상세",
          url: "/sales/daily-pass",
        },
        {
          title: "월별 정산",
          url: "/adjustments/monthly",
        },
        {
          title: "선계약금 차감 조회",
          url: "/adjustments/deduction-of-deposit",
        },
      ],
    },
    {
      title: "후원 및 기타 수익",
      url: "/donations",
      icon: SquareTerminal,
      isActive:
        pathname.includes("/donations") ||
        pathname.includes("/other-incomes") ||
        pathname.includes("/adjustments/donations-and-other-incomes"),
      items: [
        {
          title: "후원 내역",
          url: "/donations",
        },
        {
          title: "기타 수익내역",
          url: "/other-incomes",
        },
        {
          title: "후원 및 기타 정산",
          url: "/adjustments/donations-and-other-incomes",
        },
      ],
    },
    // {
    //   title: "독자 프로파일",
    //   url: "#",
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: "인구통계 분석",
    //       url: "#",
    //     },
    //     {
    //       title: "장바구니 분석",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "고객센터",
    //   url: "#",
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: "공지사항",
    //       url: "#",
    //     },
    //     {
    //       title: "자주 묻는 질문",
    //       url: "#",
    //     },
    //   ],
    // },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setIsAuthenticated } = useAuthStore();
  const { roleType } = useProfile();
  const isSummaryMode =
    pathname.startsWith("/discover-products") &&
    searchParams.get("mode") === "summary";

  const navMain = React.useMemo(() => {
    const baseItems = data.navMainBase(pathname);

    if (roleType === "author") {
      const authorItems = baseItems.map((item) =>
        item.url === "/products"
          ? {
              ...item,
              items: (item.items || []).filter(
                (subItem) => subItem.url !== "/products/upload"
              ),
            }
          : item
      );

      return [
        {
          title: "작품요약",
          url: "/discover-products",
          icon: SquareTerminal,
          isActive: pathname.startsWith("/discover-products"),
        },
        ...authorItems,
      ];
    }

    if (roleType === "admin" || roleType === "CP") {
      const items =
        roleType === "CP"
          ? [
              {
                title: "작품요약",
                url: "/discover-products?mode=summary",
                icon: SquareTerminal,
                isActive: isSummaryMode,
              },
              ...baseItems,
            ]
          : baseItems;

      return [
        ...items,
        {
          title: "발굴 통계",
          url: "/discover-products",
          icon: SquareTerminal,
          isActive: pathname.startsWith("/discover-products") && !isSummaryMode,
        },
      ];
    }

    return baseItems;
  }, [isSummaryMode, pathname, roleType, searchParams]);

  const handleLogout = async () => {
    const result = await confirm({
      title: "로그아웃 하시겠습니까?",
      text: "로그아웃 후 다시 로그인해야 합니다.",
      confirm: "로그아웃",
      cancel: "취소",
    });
    if (result.isConfirmed) {
      clearLocalStorage();
      setIsAuthenticated(false);
      window.location.href = "/login";
    }
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="border-b border-[#E7E9EE]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="h-36 flex-col">
                <div className="pt-7">
                  <a href="#" key="1">
                    <svg
                      width="171"
                      height="33"
                      viewBox="0 0 172 33"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M39.0518 32.6325V15.4102H42.8853V28.9696H50.3248V32.6439H39.0518V32.6325Z"
                        fill="#171A1E"
                      />
                      <path
                        d="M52.0765 32.6325V15.4102H55.9669V32.6325H52.0765Z"
                        fill="#171A1E"
                      />
                      <path
                        d="M64.7374 25.8528L62.7922 28.0141V32.6325H58.9587V15.4102H62.7922V22.6563L69.0828 15.4102H74.1335L67.422 22.8724L74.1563 32.6439H69.3672L64.7261 25.8641L64.7374 25.8528Z"
                        fill="#171A1E"
                      />
                      <path
                        d="M75.5439 32.6325V15.4102H86.4529V19.0275H79.3774V22.3036H85.7932V25.6821H79.3774V28.9924H86.4757V32.6325H75.5439Z"
                        fill="#171A1E"
                      />
                      <path
                        d="M104.893 32.6325L97.7943 21.314V32.6325H93.9835V15.4102H98.6474L105.109 25.8869V15.4102H108.942V32.6325H104.881H104.893Z"
                        fill="#171A1E"
                      />
                      <path
                        d="M119.908 15.0469C124.743 15.0469 128.849 18.5732 128.849 24.0334C128.849 29.4936 124.743 32.9972 119.908 32.9972C115.073 32.9972 110.944 29.4709 110.944 24.0334C110.944 18.596 115.051 15.0469 119.908 15.0469ZM119.908 29.2092C122.285 29.2092 124.868 27.6053 124.868 24.0107C124.868 20.4161 122.297 18.7894 119.908 18.7894C117.519 18.7894 114.926 20.4161 114.926 24.0107C114.926 27.6053 117.496 29.2092 119.908 29.2092Z"
                        fill="#171A1E"
                      />
                      <path
                        d="M141.123 15.4102H145.207L138.916 32.6325H134.958L128.644 15.4102H132.876L137.028 27.5363L141.134 15.4102H141.123Z"
                        fill="#171A1E"
                      />
                      <path
                        d="M146.583 32.6325V15.4102H157.492V19.0275H150.417V22.3036H156.832V25.6821H150.417V28.9924H157.515V32.6325H146.583Z"
                        fill="#171A1E"
                      />
                      <path
                        d="M160.018 32.6325V15.4102H163.862V28.9696H171.302V32.6439H160.029L160.018 32.6325Z"
                        fill="#171A1E"
                      />
                      <path
                        d="M26.2885 12.7656H0V33.0024H26.2885V12.7656Z"
                        fill="#0456D9"
                      />
                      <path
                        d="M19.9183 24.2056L0 32.9987V12.7619L19.9183 3.96875V24.2056Z"
                        fill="#0CA9DC"
                      />
                      <path
                        d="M13.2865 20.2368L0 33V12.7632L13.2865 0V20.2368Z"
                        fill="#57D6FF"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-7">
        <NavMain items={navMain} />
        {/*<NavProjects projects={data.projects}/>
          <NavSecondary items={data.navSecondary} className="mt-auto"/>*/}
      </SidebarContent>
      <SidebarFooter className="border-t border-[#E7E9EE] p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold transition"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
