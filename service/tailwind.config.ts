import { range } from "es-toolkit";
import type { Config } from "tailwindcss";

const pxToRem = (px: number, base = 16) => `${px / base}rem`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /*
       * 1px부터 100px까지의 간격을 rem 단위로 재정의합니다.
       * - 10pxr: 10px를 rem 단위로 변환한 값
       */
      spacing: {
        ...range(1, 100).reduce((acc: { [key: string]: string }, px) => {
          acc[`${px}pxr`] = pxToRem(px);
          return acc;
        }, {}),
      },
      fontSize: {
        ...range(1, 100).reduce((acc: { [key: string]: string }, px) => {
          acc[`${px}pxr`] = pxToRem(px);
          return acc;
        }, {}),
      },
      fontFamily: {
        "Pretendard Variable": ["Pretendard Variable", "sans-serif"],
        "nanum-myeongjo": ["NanumMyeongjo", "serif"],
        "maru-buri": ["MaruBuri", "cursive"],
      },
      screens: {
        "2md": "875px",
      },
      colors: {
        "primary-100": "#176BF2",
        "primary-200": "#0456D9",
        "black-100": "#111317",
        "black-200": "#191A1F",
        "dark-gray-100": "#B3B7C3",
        "dark-gray-200": "#A7ABB6",
        "dark-gray-300": "#81848D",
        "dark-gray-400": "#6B6E76",
        "dark-gray-500": "#4D5159",
        "dark-gray-600": "#354544",
        "dark-gray-700": "#292C33",
        "light-gray-100": "#f5f5f5",
        "light-gray-200": "#F0F2F6",
        "light-gray-300": "#E4E4E4",
        "light-gray-400": "#E5E8EF",
        "light-gray-500": "#D9DDE4",
        "light-gray-600": "#C7CCD7",
        "red-100": "#FF2703",
        "red-200": "#F22C01",
        "blue-100": "#D4F0F9",
        "blue-200": "#C0E9F6",
        "blue-300": "#84D5F0",
        "blue-400": "#43C2EB",
        "blue-500": "#0CA9DC",
        "green-100": "#06B92E",
        "light-theme-bg": "#F9F8F8",
        "dark-theme-bg": "#292C32",
        "green-theme-bg": "#C7D5C4",
        "blue-theme-bg": "#C3CAD2",
        "deactivate-color": "#9EA4AF",
      },
      animation: {
        fadeUp: "fadeUp 0.3s ease-in-out forwards",
        fadeIn: "fadeIn 0.3s ease-in-out forwards",
        slideInFromLeft: "slideInFromLeft 0.5s ease-in-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateX(0)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInFromLeft: {
          "0%": { transform: "translateX(-30%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      outline: ["focus"],
    },
  },
  plugins: [
    require("@tailwindcss/line-clamp"),
    require("tailwind-scrollbar"),
    require("@tailwindcss/typography"),
  ],
};
export default config;
