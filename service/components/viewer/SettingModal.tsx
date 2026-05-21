import useViewStore from "@/store/viewerStore";
import { useRef } from "react";
import SettingLevel from "./SettingLevel";
import Check from "/public/images/check.svg";
import Refresh from "/public/images/refresh.svg";

const SettingModal = () => {
  const { settings, setSettings, resetSettings } = useViewStore((state) => ({
    settings: state.settings,
    setSettings: state.setSettings,
    resetSettings: state.resetSettings,
  }));
  const refreshButtonRef = useRef<HTMLButtonElement>(null);

  const handleLabelClick = () => {
    if (refreshButtonRef.current) {
      refreshButtonRef.current.click();
    }
  };

  const handleFontChange = (fontFamily: "고딕" | "명조체" | "마루부리" | "조선궁서" | "나눔고딕" | "본고딕" | "KoPub돋움") => {
    setSettings({ fontFamily });
  };

  const handleThemeChange = (theme: "light" | "dark" | "green" | "blue") => {
    setSettings({ theme });
  };

  const isCoverVisible = !settings.hideImageCover;

  const themeCheck = (theme: string) => {
    if (settings.theme === theme) {
      return (
        <Check
          className="w-[16px] h-[11px]"
          color={
            settings.theme === "dark"
              ? "var(--dark-theme-content)"
              : "var(--foreground-rgb)"
          }
        />
      );
    }
  };
  return (
    <>
      <div className="mx-6 mt-10pxr">
        <h1 className="mt-[-10px] font-bold text-22pxr">설정</h1>
        <div className="flex justify-between  mt-[37px] mb-[19px]">
          <span className="font-semibold ">폰트종류</span>
          <div className="flex gap-[19px]">
            <button onClick={() => handleFontChange("고딕")}>
              <span
                className={`${
                  settings.fontFamily === "고딕"
                    ? "underline"
                    : "text-deactivate-color"
                }`}
              >
                고딕
              </span>
            </button>
            <button onClick={() => handleFontChange("명조체")}>
              <span
                className={`font-nanum-myeongjo ${
                  settings.fontFamily === "명조체"
                    ? "underline"
                    : "text-deactivate-color"
                }`}
              >
                명조체
              </span>
            </button>
            <button onClick={() => handleFontChange("마루부리")}>
              <span
                className={`font-maru-buri ${
                  settings.fontFamily === "마루부리"
                    ? "underline"
                    : "text-deactivate-color"
                }`}
              >
                마루부리
              </span>
            </button>
            <button onClick={() => handleFontChange("조선궁서")}>
              <span
                className={`${
                  settings.fontFamily === "조선궁서"
                    ? "underline"
                    : "text-deactivate-color"
                }`}
                style={{ fontFamily: "JoseonPalace" }}
              >
                조선궁서
              </span>
            </button>
            <button onClick={() => handleFontChange("나눔고딕")}>
              <span
                className={`${
                  settings.fontFamily === "나눔고딕"
                    ? "underline"
                    : "text-deactivate-color"
                }`}
                style={{ fontFamily: "NanumGothic" }}
              >
                나눔고딕
              </span>
            </button>
            <button onClick={() => handleFontChange("본고딕")}>
              <span
                className={`${
                  settings.fontFamily === "본고딕"
                    ? "underline"
                    : "text-deactivate-color"
                }`}
                style={{ fontFamily: "NotoSansKR" }}
              >
                본고딕
              </span>
            </button>
            <button onClick={() => handleFontChange("KoPub돋움")}>
              <span
                className={`${
                  settings.fontFamily === "KoPub돋움"
                    ? "underline"
                    : "text-deactivate-color"
                }`}
                style={{ fontFamily: "KoPubDotum" }}
              >
                KoPub돋움
              </span>
            </button>
          </div>
        </div>
        <div className="border border-b border-light-gray-200 w-[348px] mb-[12px]" />
        <div className="flex justify-between items-center">
          <span className="font-semibold">테마</span>
          <div className="flex gap-12pxr">
            <button
              className="flex justify-center items-center w-[36px] h-[36px] rounded-full bg-light-theme-bg border border-light-gray-400"
              onClick={() => handleThemeChange("light")}
            >
              {themeCheck("light")}
            </button>
            <button
              className="flex justify-center items-center w-[36px] h-[36px] rounded-full bg-dark-theme-bg border border-[#080A0D]"
              onClick={() => handleThemeChange("dark")}
            >
              {themeCheck("dark")}
            </button>
            <button
              className="flex justify-center items-center w-[36px] h-[36px] rounded-full bg-green-theme-bg border border-[#B7C3B4]"
              onClick={() => handleThemeChange("green")}
            >
              {themeCheck("green")}
            </button>
            <button
              className="flex justify-center items-center w-[36px] h-[36px] rounded-full bg-blue-theme-bg border border-[#BAC0C8]"
              onClick={() => handleThemeChange("blue")}
            >
              {themeCheck("blue")}
            </button>
          </div>
        </div>
        <div className="border border-b border-light-gray-200 w-[348px] my-[12px]" />
        <div className="flex justify-between items-center">
          <span className="font-semibold">폰트크기</span>
          <SettingLevel
            count={settings.fontSize}
            setCount={(size) => setSettings({ fontSize: size })}
            maximum={10}
          />
        </div>
        <div className="border border-b border-light-gray-200 w-[348px] my-[12px]" />
        <div className="flex justify-between items-center">
          <span className="font-semibold">자간</span>
          <SettingLevel
            count={settings.letterSpacing}
            setCount={(size) => setSettings({ letterSpacing: size })}
          />
        </div>
        <div className="border border-b border-light-gray-200 w-[348px] my-[12px]" />
        <div className="flex justify-between items-center">
          <span className="font-semibold">행간</span>
          <SettingLevel
            count={settings.lineHeight}
            setCount={(size) => setSettings({ lineHeight: size })}
          />
        </div>
        <div className="border border-b border-light-gray-200 w-[348px] my-[12px]" />
        <div className="flex justify-between items-center">
          <span className="font-semibold">좌우여백</span>
          <SettingLevel
            count={settings.marginSize}
            setCount={(size) => setSettings({ marginSize: size })}
          />
        </div>
        <div className="border border-b border-light-gray-200 w-[348px] my-[12px]" />
        <div className="flex justify-between items-center">
          <span className="font-semibold">들여쓰기</span>
          <button
            onClick={() => setSettings({ useParagraphIndent: !settings.useParagraphIndent })}
            className={`w-[44px] h-[24px] rounded-full transition-colors duration-200 ${
              settings.useParagraphIndent ? "bg-[#4C63FF]" : "bg-[#D1D5DB]"
            } relative`}
          >
            <span
              className={`block w-[20px] h-[20px] rounded-full bg-white shadow transition-transform duration-200 ${
                settings.useParagraphIndent ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
        </div>
        <div className="border border-b border-light-gray-200 w-[348px] my-[12px]" />
        <div className="flex justify-between items-center">
          <span className="font-semibold">표지 표시</span>
          <button
            type="button"
            aria-pressed={isCoverVisible}
            aria-label={isCoverVisible ? "표지 숨기기" : "표지 표시"}
            onClick={() => setSettings({ hideImageCover: isCoverVisible })}
            className={`w-[44px] h-[24px] rounded-full transition-colors duration-200 ${
              isCoverVisible ? "bg-[#4C63FF]" : "bg-[#D1D5DB]"
            } relative`}
          >
            <span
              className={`block w-[20px] h-[20px] rounded-full bg-white shadow transition-transform duration-200 ${
                isCoverVisible ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
        </div>
      </div>
      <div className="border border-b border-light-gray-200 w-[402px] my-[12px]" />
      <div className="flex justify-center items-center gap-6pxr mb-24pxr">
        <span
          className="text-dark-gray-400 cursor-pointer"
          onClick={() => {
            handleLabelClick();
            resetSettings();
          }}
        >
          보기설정 초기화
        </span>
        <button ref={refreshButtonRef}>
          <Refresh />
        </button>
      </div>
    </>
  );
};
export default SettingModal;
