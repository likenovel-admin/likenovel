'use client'
import {useEffect, useState} from "react";

export const useWindowScroll = () => {
    const [windowSize, setWindowSize] = useState({
        winWidth: 0,
        winHeight: 0,
    });

    useEffect(() => {
        const handleWindowResizing = () => {
            setWindowSize({
                winWidth: window.innerWidth,
                winHeight: window.innerHeight,
            });
        }

        window.addEventListener("resize", handleWindowResizing);
        handleWindowResizing();

        return () => window.removeEventListener("resize", handleWindowResizing);
    }, []);

    return windowSize
}
