"use client";
import { BgColorProvider, useBgColor } from "@/contexts/BgColorContext";
import GNBProvider from "@/hooks/useGNB";

export default function ProductLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GNBProvider>
      <BgColorProvider>
        <ContentWrapper>{children}</ContentWrapper>
      </BgColorProvider>
    </GNBProvider>
  );
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { bgColor } = useBgColor();
  return (
    <div
      className={`relative min-h-screen ${
        bgColor !== "bg-white" ? `${bgColor}` : ""
      } pt-[130px] md:pt-[115px] pb-[94px]`}
    >
      {children}
    </div>
  );
}
