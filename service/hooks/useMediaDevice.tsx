"use client";
import { useEffect, useMemo, useState } from "react";

export const screenWidth = {
  mobile: 768,
  miniTablet: 875,
  tablet: 1024,
  desktop: 1200,
};

const getWindowDimensions = () => {
  const { innerWidth: width, innerHeight: height } =
    typeof window !== "undefined" ? window : { innerWidth: 0, innerHeight: 0 };
  return {
    width,
    height,
  };
};

/*
이 훅을 사용하는 컴포넌트에서는 경우에 따라 아래와 같이 null일 때의 처리를 해주셔야 합니다. 
만약 null일 때의 처리를 하지 않으면 window 객체를 받아오기 전 상태에서 모바일 사이즈의 화면이 렌더링 되는 현상이 발생합니다. (초기 width 값이 0이기 때문)
if (device === null) {
    return null;
}
*/
const useMediaDevice = () => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isClient, setIsClient] = useState(false);

  const device = useMemo(() => {
    if (windowDimensions.width === 0) {
      return null;
    }
    if (windowDimensions.width > screenWidth.tablet) {
      return "desktop";
    }
    if (
      windowDimensions.width <= screenWidth.tablet &&
      windowDimensions.width >= screenWidth.miniTablet
    ) {
      return "tablet";
    }
    if (
      windowDimensions.width < screenWidth.miniTablet &&
      windowDimensions.width >= screenWidth.mobile
    ) {
      return "miniTablet";
    }
    if (windowDimensions.width < screenWidth.mobile) {
      return "mobile";
    }
  }, [windowDimensions.width]);

  useEffect(() => {
    setIsClient(true);
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    if (isClient) {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      window.addEventListener("resize", handleResize);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [isClient]);

  return device;
};
export default useMediaDevice;
