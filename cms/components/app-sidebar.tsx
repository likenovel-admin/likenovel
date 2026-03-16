"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  LogOut,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { url } from "inspector";
import { clearLocalStorage, confirm } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthenticate";
import { access } from "fs";
import { useProfileStore } from "@/store/useProfileStore";

/*import DashboardMenuIcon from "@/public/dashboard-menu-icon.svg"*/

const data = {
  user: {
    name: "라이크노벨 관리자",
    email: "m@example.com",
    /*avatar: "/avatars/shadcn.jpg",*/
  },
  navMain: (pathname: string) => [
    {
      title: "파트너 페이지 바로가기",
      url: "#",
    },
    {
      title: "Statistics",
      url: "/statistics/site",
      isActive: pathname.includes("/statistics"),
      items: [
        {
          title: "Site",
          url: "/statistics/site",
        },
        {
          title: "Payment",
          url: "/statistics/payment",
        },
        {
          title: "회원별 소비 내역",
          url: "/statistics/consumption-by-user",
        },
      ],
    },
    {
      title: "회원 관리",
      url: "/users",
      isActive: pathname.includes("/users"),
      items: [
        {
          title: "회원 목록",
          url: "/users",
        },
        {
          title: "자격 신청 관리",
          url: "/users/apply-of-qualification",
        },
        {
          title: "뱃지 관리",
          url: "/users/badge",
        },
      ],
    },
    {
      title: "작품 관리",
      url: "/products/apply-of-advancement",
      isActive: pathname.includes("/products"),
      items: [
        {
          title: "승급 신청 관리",
          url: "/products/apply-of-advancement",
        },
        {
          title: "리뷰/댓글/공지 관리",
          url: "/products/review-comment-notice",
        },
        {
          title: "테마 키워드 관리",
          url: "/products/theme-keyword",
        },
        {
          title: "유통작품관리",
          url: "/products/distribution",
        },
        {
          title: "작품 블라인드",
          url: "/products/blind",
        },
        {
          title: "작품 평가",
          url: "/products/product-evaluation",
        },
        {
          title: "AI 작품 메타정보",
          url: "/products/ai-metadata",
        },
        {
          title: "AI 온보딩 작품",
          url: "/products/ai-onboarding",
        },
      ],
    },
    {
      title: "노출구좌 관리",
      url: "/exposure-accounts/publisher-promotion",
      isActive: pathname.includes("/exposure-accounts"),
      items: [
        {
          title: "출판사 프로모션 구좌 관리",
          url: "/exposure-accounts/publisher-promotion",
        },
        {
          title: "알고리즘 추천구좌 관리",
          url: "/exposure-accounts/algorithm-recommend",
        },
        {
          title: "직접 추천구좌 관리",
          url: "/exposure-accounts/direct-recommend",
        },
      ],
    },
    {
      title: "작품별 프로모션 관리",
      url: "/promotions/self",
      isActive: pathname.includes("/promotions"),
      items: [
        {
          title: "직접 프로모션",
          url: "/promotions/self",
        },
        {
          title: "신청 프로모션",
          url: "/promotions/apply-of-promotion",
        },
        {
          title: "선물함",
          url: "/promotions/gift-box",
        },
      ],
    },
    {
      title: "메시지 관리",
      url: "/messages",
      isActive: pathname.includes("/messages"),
      items: [
        {
          title: "메시지 내역",
          url: "/messages",
        },
        {
          title: "푸시 메시지 관리",
          url: "/messages/push",
        },
      ],
    },
    {
      title: "이벤트 및 퀘스트",
      url: "/events",
      isActive: pathname.includes("/events") || pathname.includes("/quests"),
      items: [
        {
          title: "이벤트 관리",
          url: "/events",
        },
        {
          title: "퀘스트 관리",
          url: "/quests",
        },
      ],
    },
    {
      title: "기타",
      url: "/banners",
      isActive:
        pathname.includes("/banners") ||
        pathname.includes("/popups") ||
        pathname.includes("/notices") ||
        pathname.includes("/faqs") ||
        pathname.includes("/adjust-ratio"),
      items: [
        {
          title: "배너 및 팝업 관리",
          url: "/banners",
        },
        {
          title: "공지/FAQ",
          url: "/notices",
        },
        {
          title: "비율 조정",
          url: "/adjust-ratio",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setIsAuthenticated } = useAuthStore();
  const { profile } = useProfileStore();

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

  const handleOpenPartner = () => {
    const otherWindow = window.open(
      process.env.NEXT_PUBLIC_PARTNER_SITE_URL,
      "_blank"
    );
    otherWindow?.postMessage(
      {
        sharedState: {
          accessToken: localStorage.getItem("token"),
          refreshToken: localStorage.getItem("refreshToken"),
          id: profile?.id,
        },
      },
      process.env.NEXT_PUBLIC_PARTNER_SITE_URL || ""
    );
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
                    <div className="side-cms">CMS</div>
                  </a>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-7">
        <NavMain items={data.navMain(pathname)} />
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
        <button
          onClick={handleOpenPartner}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-blue-500 hover:bg-blue-600-600 text-white font-semibold transition"
        >
          파트너 페이지 바로가기
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
