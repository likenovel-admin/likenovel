"use client";
import MyBoardLayout from "@/components/customer-service/CustomerServiceLayout";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return <MyBoardLayout>{children}</MyBoardLayout>;
};

export default Layout;
