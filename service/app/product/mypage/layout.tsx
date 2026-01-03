"use client";
import Tab from "@/components/common/Tab";
import HeaderContent from "@/components/mypage/HeaderContent";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useMemo } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  const pathName = usePathname();
  const router = useRouter();
  const tabName = useMemo(() => {
    const pathDiv = pathName.split("/");
    return pathDiv.pop();
  }, [pathName]);
  return (
    <div className="w-full h-auto">
      <div className="flex flex-col w-full max-w-[1120px] mx-auto">
        <HeaderContent />
        <Tab
          style="underline"
          tabs={[
            { label: "마이페이지 홈", value: "home" },
            { label: "프로필 관리", value: "profile" },
            { label: "내 정보 수정", value: "info" },
            { label: "캐시", value: "cash" },
            { label: "내 댓글", value: "comment" },
            { label: "보낸 제안", value: "proposal" },
            { label: "알림 설정", value: "alarm" },
          ]}
          onTabChange={(value) => {
            router.push(`/product/mypage/${value}`);
          }}
          activeTab={tabName ?? "home"}
        />
        {children}
      </div>
    </div>
  );
};

export default Layout;
