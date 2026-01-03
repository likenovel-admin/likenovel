"use client";

import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import Button from "@/components/common/Button";
import useToastStore from "@/store/toastStore";
import { getLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";

const UpdateMyInfoSocial = () => {
  const { data: userInfo } = useSelectUserInfo();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();

  const recentSignInType = getLocalStorage(STORAGE_KEYS.RECENT_SIGN_IN_TYPE);
  console.log("recentSignInType", recentSignInType);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        console.log(
          "[UpdateMyInfoPassword] ⚠️ Ignoring message from unknown origin:",
          event.origin
        );
        return;
      }

      // Check if this is NICE auth complete message
      if (event.data?.type === "NICE_AUTH_COMPLETE") {
        console.log(
          "[UpdateMyInfoPassword] ✅ Received NICE_AUTH_COMPLETE message from popup"
        );
        console.log(
          "[UpdateMyInfoPassword] Refetching user info to check identityYn status"
        );

        // Refetch user info to update identityYn status
        queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });

        // Show toast based on success/error
        if (event.data.success) {
          setToast({
            message: "본인인증이 완료되었습니다.",
            type: "success",
          });
        } else if (event.data.error) {
          setToast({
            message: event.data.error,
            type: "error",
          });
        }

        console.log("[UpdateMyInfoPassword] ✅ Flow completed");
      }
    };

    // Add message listener
    console.log(
      "[UpdateMyInfoPassword] Setting up message listener for NICE auth"
    );
    window.addEventListener("message", handleMessage);

    // Cleanup on unmount
    return () => {
      console.log("[UpdateMyInfoPassword] Removing message listener");
      window.removeEventListener("message", handleMessage);
    };
  }, [queryClient, setToast]);

  // 휴대폰 인증 버튼 클릭시 실행되는 함수, NICE 표준창 호출
  const onClickCertify = async () => {
    console.log("[UpdateMyInfoPassword] 1. Starting NICE authentication flow");

    // Step 1: Get NICE token from backend
    console.log(
      "[UpdateMyInfoPassword] 2. Requesting NICE token from /api/query/mypage"
    );
    const token_data = await axios
      .post(`/api/query/mypage`)
      .then((response) => {
        console.log(
          "[UpdateMyInfoPassword] 3. ✅ NICE token received successfully"
        );
        return response.data;
      })
      .catch((error) => {
        console.error(
          "[UpdateMyInfoPassword] 3. ❌ Failed to get NICE token:",
          error
        );
        setToast({
          message: "본인인증 요청 중 오류가 발생했습니다.",
          type: "error",
        });
        return null;
      });

    if (!token_data?.data) {
      console.log("[UpdateMyInfoPassword] ❌ No token data received, aborting");
      return;
    }

    const { encData, integrityValue, tokenVersionId } = token_data.data;
    console.log("[UpdateMyInfoPassword] 4. Token data extracted:", {
      hasEncData: !!encData,
      hasIntegrityValue: !!integrityValue,
      tokenVersionId,
    });

    // Step 2: Prepare and open NICE popup
    console.log("[UpdateMyInfoPassword] 5. Preparing NICE popup");
    const form = document.getElementById("form") as HTMLFormElement;
    if (!form) {
      console.error("[UpdateMyInfoPassword] ❌ Form element not found");
      return;
    }

    const left = screen.width / 2 - 500 / 2;
    const top = screen.height / 2 - 800 / 2;
    const option = `status=no, menubar=no, toolbar=no, resizable=no, width=500, height=600, left=${left}, top=${top}`;

    console.log("[UpdateMyInfoPassword] 6. Opening NICE popup window");
    const popup = window.open("", "nicePopup", option);

    if (!popup) {
      console.error(
        "[UpdateMyInfoPassword] ❌ Failed to open popup (blocked by browser?)"
      );
      setToast({
        message: "팝업이 차단되었습니다. 팝업 차단을 해제해주세요.",
        type: "error",
      });
      return;
    }

    // Step 3: Submit form to NICE
    form.target = "nicePopup";
    form.enc_data.value = encData;
    form.token_version_id.value = tokenVersionId;
    form.integrity_value.value = integrityValue;

    console.log("[UpdateMyInfoPassword] 7. Submitting form to NICE");
    form.submit();
    console.log(
      "[UpdateMyInfoPassword] 8. Form submitted, waiting for user authentication..."
    );
    console.log(
      "[UpdateMyInfoPassword] 9. postMessage listener is already set up via useEffect - no need to add here"
    );
  };

  return (
    <>
      <div className="p-2 md:p-5 border rounded-xl h-fit bg-gray-100 w-full md:rounded-b-none">
        <div className=" gap-2 shadow-md h-[295px] bg-white rounded-xl flex items-center justify-center flex-col">
          {userInfo?.data && (
            <>
              <div
                className={`w-56pxr h-56pxr flex items-center justify-center rounded-full ${
                  recentSignInType === "naver"
                    ? "bg-[#03C75A]"
                    : recentSignInType === "kakao"
                    ? "bg-[#FEE500]"
                    : recentSignInType === "google"
                    ? "bg-white border"
                    : recentSignInType === "apple"
                    ? "bg-black"
                    : "bg-gray-200"
                }`}
              >
                <img
                  src={
                    recentSignInType === "naver"
                      ? "/images/naver.png"
                      : recentSignInType === "kakao"
                      ? "/images/kakao.png"
                      : recentSignInType === "google"
                      ? "/images/google.png"
                      : recentSignInType === "apple"
                      ? "/images/apple.png"
                      : "/images/user-icon.png"
                  }
                  width={19}
                  height={19}
                  alt={recentSignInType || "user"}
                />
              </div>
              <span className="text-18pxr font-normal">
                {userInfo.data.email || "이메일 없음"}
              </span>
              <span className="text-14pxr font-normal text-dark-gray-300">
                {recentSignInType === "naver"
                  ? "네이버 간편로그인으로 사용 중입니다."
                  : recentSignInType === "kakao"
                  ? "카카오 간편로그인으로 사용 중입니다."
                  : recentSignInType === "google"
                  ? "구글 간편로그인으로 사용 중입니다."
                  : recentSignInType === "apple"
                  ? "애플 간편로그인으로 사용 중입니다."
                  : recentSignInType === "likenovel"
                  ? "라이크노벨 계정으로 사용 중입니다."
                  : "간편로그인으로 사용 중입니다."}
              </span>
            </>
          )}
        </div>
      </div>
      {/* <div className="w-full bg-white border border-t-0 rounded-b-xl pt-[25px] pb-[33px] hidden md:flex justify-center">
        <Button className="w-[220px]" variant="black" size="xl">
          본인인증
        </Button>
      </div> */}

      <div className="sticky bottom-0 w-full bg-white mt-8 rounded-t-lg shadow-xl pt-4 flex gap-2 md:relative md:flex justify-center md:rounded-b-xl md:shadow-none md:border md:border-t-0 md:mt-0 md:rounded-t-none">
        {/*표준창 호출시 필요한 데이터 전송을 위한 form*/}
        <form
          name="form"
          id="form"
          action="https://nice.checkplus.co.kr/CheckPlusSafeModel/service.cb"
        >
          <input type="hidden" id="m" name="m" value="service" />
          <input
            type="hidden"
            id="token_version_id"
            name="token_version_id"
            value=""
          />
          <input type="hidden" id="enc_data" name="enc_data" />
          <input type="hidden" id="integrity_value" name="integrity_value" />
        </form>
        {userInfo?.data?.identityYn === "N" && (
          <Button
            className="w-full mb-3 h-[40px] md:w-[220px]"
            variant="black"
            size="xl"
            onClick={onClickCertify}
          >
            본인인증
          </Button>
        )}
        {/* <Button className="w-full mb-3 h-[40px] md:hidden " size="xl">
          확인
        </Button> */}
      </div>
    </>
  );
};

export default UpdateMyInfoSocial;
