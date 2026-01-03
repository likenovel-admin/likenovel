import { useGetAdminDetail } from "@/api/auth";
import { useProfileStore } from "@/store/useProfileStore";
import React from "react";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
  const { profile } = useProfileStore();
  const { data } = useGetAdminDetail(profile?.id || 0);

  return (
    <header className="flex  shrink-0 items-center gap-2 px-4 py-11">
      <div className="flex items-center gap-2 px-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {children && (
        <div className="flex-1 flex justify-end items-center">{children}</div>
      )}
      <div className="ml-auto flex items-center rounded-full bg-white shadow px-6 py-2">
        <span className="mr-2 text-gray-700">
          {data && data?.length > 0 ? data[0]?.nickname : ""}
        </span>
        {data && data?.length > 0 && data[0]?.profile_image_path ? (
          <img
            src={data[0]?.profile_image_path + ""}
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
