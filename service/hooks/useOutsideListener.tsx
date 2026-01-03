import { useEffect } from "react";

const useOutsideListener = ({
  content,
  onClose,
  enable = true,
}: {
  content: any;
  onClose: () => void;
  enable?: boolean;
}) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (content && !content.contains(event.target as Node) && enable) {
        console.log("handleClickOutside", enable);
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [content]);
};

export default useOutsideListener;
