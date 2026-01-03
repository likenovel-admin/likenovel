import TabLayout from "@/components/authorHome/TabLayout";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return <TabLayout activeTab="promotion">{children}</TabLayout>;
};

export default Layout;
