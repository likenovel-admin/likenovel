"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Client component to close popup
 */
export default function NiceCallbackResult() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const processResult = async () => {
      console.log("[NICE Callback Result] 1. ===== Processing NICE callback result =====");

      try {
        const success = searchParams.get("success") === "true";
        const error = searchParams.get("error") || "";

        console.log("[NICE Callback Result] 2. ✅ Result received from URL params:", {
          success,
          hasError: !!error,
          errorMessage: error
        });

        // Close popup - notify parent to refetch user info
        if (window.opener) {
          console.log("[NICE Callback Result] 3. ✅ Popup window detected");

          // Send message to parent window to invalidate queries
          console.log("[NICE Callback Result] 4. Notifying parent window to refetch user data");
          window.opener.postMessage(
            {
              type: 'NICE_AUTH_COMPLETE',
              success: success,
              error: error
            },
            window.location.origin
          );

          console.log("[NICE Callback Result] 5. Closing popup");
          // Give parent time to process message before closing
          setTimeout(() => {
            window.close();
          }, 100);
        } else {
          console.log("[NICE Callback Result] 3. No opener window detected");
          console.log("[NICE Callback Result] 4. Redirecting current window to mypage");
          window.location.href = "/product/mypage/user/edit";
        }
      } catch (error: any) {
        console.error("[NICE Callback Result] ❌ Error processing result:", error.message);
        // Fallback
        if (window.opener) {
          console.log("[NICE Callback Result] Fallback: Closing popup");
          window.close();
        } else {
          console.log("[NICE Callback Result] Fallback: Redirecting to mypage");
          window.location.href = "/product/mypage/user/edit";
        }
      }
    };

    processResult();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">본인인증 결과를 처리하는 중...</p>
      </div>
    </div>
  );
}
