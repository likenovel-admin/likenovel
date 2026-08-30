import Link from "next/link";
import React from "react";
import Check from "/public/images/check.svg";

interface TabProps {
  tabs: CommonSelectItem[];
  style:
    | "black"
    | "white"
    | "check"
    | "basic"
    | "underline"
    | "halfSquare"
    | "overline"; // activeTab 기준 스타일
  activeTab: string;
  onTabChange: (value: string) => void;
}

const Tab: React.FC<TabProps> = ({ tabs, style, activeTab, onTabChange }) => {
  const blackStyle = (value: string) => {
    return activeTab === value
      ? "bg-black-100 text-white md:font-semibold"
      : "bg-white text-dark-gray-500 font-medium hover:bg-light-gray-200 hover:text-black-100 transition-colors";
  };
  const whiteStyle = (value: string) => {
    return activeTab === value
      ? "bg-white text-black-100 md:font-semibold"
      : "bg-black-100 text-dark-gray-100 font-medium hover:bg-dark-gray-600 hover:text-white transition-colors";
  };
  const basicStyle = (value: string, index: number) => {
    return activeTab === value
      ? `text-black-100 ${index === 0 ? "pl-0" : ""}`
      : `text-dark-gray-100 px-23pxr hover:text-dark-gray-300 transition-colors ${
          index === 0 ? "pl-0" : ""
        }`;
  };
  const underlineStyle = (value: string) => {
    return activeTab === value
      ? `text-black-100 font-semibold border-b-black-100 border-b-[2px]`
      : `text-dark-gray-400 hover:text-dark-gray-600 transition-colors border-b-light-gray-300 border-b-[1px]`;
  };
  const halfSquareStyle = (value: string) => {
    return activeTab === value
      ? `text-black-100 border border-t-black-100 border-b-0 border-r-black-100 border-l-black-100 font-semibold`
      : `text-dark-gray-400 hover:text-dark-gray-600 transition-colors border border-b-black-100`;
  };

  const overlineStyle = (value: string) => {
    return activeTab === value
      ? `text-black-100 border-t font-semibold`
      : `text-dark-gray-200 hover:text-dark-gray-600 transition-colors border bg-light-gray-100`;
  };

  const renderTab = () => {
    if (style === "check") {
      return (
        <div className="flex gap-7pxr md:gap-14pxr">
          {tabs.map((tab, index) => (
            <div key={tab.value} className="flex items-center">
              <button
                onClick={() => onTabChange(tab.value)}
                className={`flex items-center text-12pxr md:text-14pxr ${
                  activeTab === tab.value
                    ? "text-black-100 font-semibold"
                    : "text-dark-gray-300 hover:text-dark-gray-600 transition-colors"
                }`}
              >
                {activeTab === tab.value && (
                  <Check className="w-[10px] md:w-[12px] h-[8px] text-black-100 mr-6pxr" />
                )}
                {tab.label}
              </button>
              {index !== tabs.length - 1 && (
                <div className="border h-[10px] border-l-light-gray-300 border-r-0 ml-7pxr md:ml-14pxr" />
              )}
            </div>
          ))}
        </div>
      );
    } else if (style === "basic") {
      return (
        <div className="flex gap-1">
          {tabs.map((tab, index) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`py-[7px] md:py-[10px] text-17pxr md:text-24pxr font-bold ${basicStyle(
                tab.value,
                index
              )}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      );
    } else if (style === "underline") {
      return (
        <div className="flex w-full overflow-x-auto snap-x scrollbar-none">
          {tabs.map((tab, index) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`flex-grow h-[50px] min-w-[94px] snap-start text-14pxr md:text-17pxr border border-t-0 border-l-0 border-r-0 ${underlineStyle(
                tab.value
              )}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      );
    } else if (style === "halfSquare") {
      return (
        <div className="flex w-full">
          {tabs.map((tab, index) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`flex-grow h-[50px] text-14pxr md:text-17pxr rounded-t-[12px] ${halfSquareStyle(
                tab.value
              )}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      );
    } else if (style === "overline") {
      return (
        <div className="flex w-full overflow-x-auto snap-x scrollbar-none">
          {tabs.map((tab, index) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`flex-grow h-[50px] min-w-[94px] flex-1 border-t-black-100 snap-start text-14pxr md:text-17pxr ${overlineStyle(
                tab.value
              )}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      );
    } else {
      return (
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const className = `px-[13px] md:px-[22px] py-[7px] md:py-[10px] rounded-full text-13pxr md:text-16pxr font-medium ${
                style === "black"
                  ? blackStyle(tab.value)
                  : whiteStyle(tab.value)
              }`;

            return tab.href ? (
              <Link
                key={tab.value}
                href={tab.href}
                aria-current={activeTab === tab.value ? "page" : undefined}
                className={className}
              >
                {tab.label}
              </Link>
            ) : (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={className}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      );
    }
  };

  return <>{renderTab()}</>;
};

export default Tab;
