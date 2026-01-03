"use client";
import Login from "@/components/login";
import useMediaDevice from "@/hooks/useMediaDevice";

export default function LoginPage() {
  const device = useMediaDevice();
  return (
    <div className="flex justify-center">
      <Login
        pageType={
          device !== "desktop" && device !== "tablet" ? "mobile" : "desktop"
        }
      />
    </div>
  );
}
