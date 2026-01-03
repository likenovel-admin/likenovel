import { ADMIN_EMAIL } from "@/constants/common";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useMemo } from "react";
import Tab from "../common/Tab";

const CustomerServiceLayout = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  const pathName = usePathname();
  const router = useRouter();
  const tabName = useMemo(() => {
    const pathDiv = pathName.split("/");
    return pathDiv.pop();
  }, [pathName]);

  const handleTabChange = (value: string) => {
    if (value === "inquiry") {
      // Open email client for 1:1 inquiry
      window.location.href = ADMIN_EMAIL;
    } else {
      router.push(`/product/customer-service/${value}`);
    }
  };

  return (
    <div
      className={`flex-col md:mx-auto px-4 md:px-0 w-full max-w-[1120px] mx-auto ${className}`}
    >
      <div className="pt-4 pb-6">
        <Tab
          tabs={[
            {
              label: "공지사항",
              value: "notice",
            },
            {
              label: "자주묻는 질문",
              value: "faq",
            },
            {
              label: "1:1문의",
              value: "inquiry",
            },
          ]}
          style="black"
          // onTabChange={(value) => {
          //   router.push(`/product/customer-service/${value}`);
          // }}
          onTabChange={handleTabChange}
          activeTab={tabName ?? "notice"}
        />
      </div>
      {children}
    </div>
  );
};

export default CustomerServiceLayout;
