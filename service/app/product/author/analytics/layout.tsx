import TabLayout from "@/components/authorHome/TabLayout";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return <TabLayout activeTab="analytics">{children}</TabLayout>;
};

export default Layout;
