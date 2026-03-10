import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import React from "react";
import { useProfile } from "@/hooks/useProfile";

interface PageHeaderProps {
  title: string;
  parent?: string;
  child?: string;
}

// Mapping parent name to first menu URL
const parentUrlMap: Record<string, string> = {
  "작품요약": "/discover-products",
  "작품 관리": "/products",
  "통계 분석": "/statistics",
  "매출 및 정산": "/sales/products",
  "후원 및 기타 수익": "/donations",
  "발굴 통계": "/discover-products",
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  parent,
  child,
}) => {
  const { userProfile } = useProfile();

  // Get parent URL based on parent name
  const parentUrl = parent ? parentUrlMap[parent] || "#" : "#";

  return (
    <header className="flex  shrink-0 items-center gap-2 px-4 py-11">
      <div>
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={parentUrl}>{parent}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{child}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
      </div>
      <div className="ml-auto flex items-center rounded-full bg-white shadow px-6 py-2">
        <span className="mr-2 text-gray-700">
          {userProfile?.nickname || ""}
        </span>
        {userProfile?.profile_image_path ? (
          <img
            src={userProfile?.profile_image_path + ""}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300" />
        )}
      </div>
    </header>
  );
};

export default PageHeader;
