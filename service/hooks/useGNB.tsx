"use client";

import Footer from "@/components/menu/Footer";
import GlobalNav from "@/components/menu/GlobalNav";
import { PropsWithChildren } from "react";

const GNBProvider = ({ children }: PropsWithChildren) => {
  return (
    <>
      <GlobalNav />
      {children}
      <Footer />
    </>
  );
};
export default GNBProvider;
