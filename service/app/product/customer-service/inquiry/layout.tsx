"use client";

import MyBoardLayout from "@/components/customer-service/CustomerServiceLayout";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <MyBoardLayout className="mb-[-95px] md:mb-0"> {children}</MyBoardLayout>
  );
};

export default Layout;
