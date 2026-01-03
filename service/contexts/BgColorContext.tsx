"use client";
import { createContext, ReactNode, useContext, useState } from "react";

interface BgColorContextType {
  bgColor: string;
  setBgColor: React.Dispatch<React.SetStateAction<string>>;
}

const BgColorContext = createContext<BgColorContextType | undefined>(undefined);

export const BgColorProvider = ({ children }: { children: ReactNode }) => {
  const [bgColor, setBgColor] = useState<string>("white");

  return (
    <BgColorContext.Provider value={{ bgColor, setBgColor }}>
      {children}
    </BgColorContext.Provider>
  );
};

export const useBgColor = () => {
  const context = useContext(BgColorContext);
  if (!context) {
    throw new Error("useBgColor must be used within a BgColorProvider");
  }
  return context;
};
