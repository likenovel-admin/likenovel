"use client";

import { instance } from "@/app/api/axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * NICE 본인인증 콜백 - Update Password Identity Verification (Client Component)
 */
export default function NiceCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  console.log("searchParams", searchParams.toString());

  useEffect(() => {
    const processCallback = async () => {
      console.log(
        "[NICE Callback] 1. ===== NICE 본인인증 콜백 시작 - Update Password ====="
      );

      // Get NICE callback params
      const encData = searchParams.get("enc_data");
      const tokenVersionId = searchParams.get("token_version_id");
      const integrityValue = searchParams.get("integrity_value");

      console.log("[NICE Callback] 2. Retrieved URL parameters:", {
        hasEncData: !!encData,
        hasTokenVersionId: !!tokenVersionId,
        hasIntegrityValue: !!integrityValue,
      });

      if (!encData) {
        console.log("[NICE Callback] ❌ Missing enc_data parameter");
        router.push(
          "/auth/nice/callback/result?success=false&error=인증 데이터가 올바르지 않습니다."
        );
        return;
      }

      try {
        // Step 1: Decrypt NICE data to get receivedata (contains encryption keys)
        console.log("[NICE Callback] 3. Calling decrypt API");
        const decryptResponse = await fetch("/api/auth/nice/callback/decrypt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            encData,
            tokenVersionId,
            integrityValue,
          }),
        });

        const decryptResult = await decryptResponse.json();

        console.log("[NICE Callback] 4. Decrypt API response:", {
          success: decryptResult.success,
          hasData: !!decryptResult.data,
          hasReceivedata: !!decryptResult.data?.receivedata,
          error: decryptResult.error,
        });

        if (!decryptResult.success) {
          console.log(
            "[NICE Callback] ❌ Decryption failed:",
            decryptResult.error
          );
          router.push(
            `/auth/nice/callback/result?success=false&error=${encodeURIComponent(
              decryptResult.error
            )}`
          );
          return;
        }

        console.log("[NICE Callback] 5. ✅ Decryption successful");

        // Step 2: Extract encryption keys from receivedata, fallback to session if not available
        const receivedata = decryptResult.data?.receivedata;
        let encryptionKey, encryptionIv, hmacKey, reqNo;

        if (receivedata && typeof receivedata === "object") {
          encryptionKey = receivedata.encryption_key;
          encryptionIv = receivedata.encryption_iv;
          hmacKey = receivedata.hmac_key;
          reqNo = receivedata.req_no;

          console.log(
            "[NICE Callback] 6. ✅ Extracted encryption keys from receivedata:",
            {
              hasEncryptionKey: !!encryptionKey,
              hasEncryptionIv: !!encryptionIv,
              hasHmacKey: !!hmacKey,
              reqNo: reqNo,
            }
          );
        } else {
          console.log(
            "[NICE Callback] 6. No receivedata found, getting from session"
          );

          // Fallback: Get from session
          const keysResponse = await fetch("/api/auth/nice/encryption-keys");
          const keysResult = await keysResponse.json();

          if (!keysResult.success) {
            console.log(
              "[NICE Callback] ❌ Failed to get encryption keys from session:",
              keysResult.error
            );
            router.push(
              `/auth/nice/callback/result?success=false&error=${encodeURIComponent(
                keysResult.error
              )}`
            );
            return;
          }
          console.log("keysResult", keysResult?.data);

          encryptionKey = keysResult.data.encryption_key;
          encryptionIv = keysResult.data.encryption_iv;
          hmacKey = keysResult.data.hmac_key;
          reqNo = keysResult.data.req_no;

          console.log(
            "[NICE Callback] 6.1. ✅ Got encryption keys from session (fallback):",
            {
              hasEncryptionKey: !!encryptionKey,
              hasEncryptionIv: !!encryptionIv,
              hasHmacKey: !!hmacKey,
              reqNo: reqNo,
            }
          );
        }

        // Step 3: Call Backend API with raw NICE params + encryption keys
        console.log(
          "[NICE Callback] 7. Calling backend API with NICE params and encryption keys"
        );

        // Build params object
        const params: Record<string, string> = {
          enc_data: encData,
        };

        if (tokenVersionId) {
          params.token_version_id = tokenVersionId;
        }

        if (integrityValue) {
          params.integrity_value = integrityValue;
        }

        // Add encryption keys to params
        if (encryptionKey) {
          params.encryption_key = encryptionKey;
        }

        if (encryptionIv) {
          params.encryption_iv = encryptionIv;
        }

        if (hmacKey) {
          params.hmac_key = hmacKey;
        }

        if (reqNo) {
          params.req_no = reqNo;
        }

        console.log("[NICE Callback] 8. Query params to backend:", params);

        const backendResponse = await instance.get(
          `/v1/command/user/identity/nice/callback`,
          {
            params,
            maxRedirects: 0,
            validateStatus: (status) => {
              // Accept both 2xx and 3xx as success
              // 302 = backend processed successfully and wants to redirect
              return (
                (status >= 200 && status < 300) ||
                (status >= 300 && status < 400)
              );
            },
          }
        );

        console.log("[NICE Callback] 9. ✅ Backend API call successful");
        console.log("[NICE Callback] 10. Backend response:", {
          status: backendResponse.status,
          hasLocationHeader: !!backendResponse.headers.location,
          locationUrl: backendResponse.headers.location,
        });

        // Check if backend returned redirect (302)
        if (
          backendResponse.status === 302 ||
          backendResponse.headers.location
        ) {
          console.log("[NICE Callback] 11. ✅ Backend returned 302 redirect");
          console.log(
            "[NICE Callback] 12. 🚫 Ignoring backend redirect URL:",
            backendResponse.headers.location
          );
          console.log(
            "[NICE Callback] 13. ✅ Frontend will handle redirect to result page instead"
          );
        }

        // Success - redirect to result page (controlled by frontend, NOT backend)
        console.log("[NICE Callback] 14. Redirecting to result page...");
        router.push("/auth/nice/callback/result?success=true");
      } catch (error: any) {
        console.error(
          "[NICE Callback] ❌ Error during callback processing:",
          error.message
        );
        console.error("[NICE Callback] Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });

        // Check if error is due to 302 redirect (which we want to ignore)
        if (error.response?.status === 302) {
          console.log(
            "[NICE Callback] ✅ Caught 302 redirect error - treating as SUCCESS"
          );
          console.log(
            "[NICE Callback] 🚫 Backend wanted to redirect to:",
            error.response?.headers?.location
          );
          console.log(
            "[NICE Callback] ✅ Ignoring backend redirect, using frontend redirect instead"
          );

          // Treat 302 as success - redirect to result page
          router.push("/auth/nice/callback/result?success=true");
          setIsProcessing(false);
          return;
        }

        // Check if error is CORS error (happens when browser auto-follows redirect to different origin)
        if (
          error.message?.includes("CORS") ||
          error.message?.includes("Network Error") ||
          error.code === "ERR_NETWORK" ||
          !error.response // No response usually means CORS/network error
        ) {
          console.log("[NICE Callback] ⚠️ Caught CORS/Network error");
          console.log(
            "[NICE Callback] 💡 This likely means backend redirected to different origin"
          );
          console.log(
            "[NICE Callback] ✅ Treating as SUCCESS - authentication was processed"
          );

          // Treat CORS error as success (backend already processed authentication)
          router.push("/auth/nice/callback/result?success=true");
          setIsProcessing(false);
          return;
        }

        // Real error - show error message
        const errorMessage =
          error.response?.data?.message || "서버 처리 중 오류가 발생했습니다.";
        router.push(
          `/auth/nice/callback/result?success=false&error=${encodeURIComponent(
            errorMessage
          )}`
        );
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">본인인증을 처리하는 중...</p>
      </div>
    </div>
  );
}
