'use client'
import {useEffect, useState} from "react";

export const useWindowScroll = () => {
    const [scroll, setScroll] = useState({
        scrollX: 0,
        scrollY: 0,
        scrollDirection: "none",
    });

    useEffect(() => {
        const handleScroll = () => {
            setScroll({
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                scrollDirection: "none",
            });
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return scroll;
}
