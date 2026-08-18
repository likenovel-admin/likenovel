"use client";

import { usePasswordReset } from "@/app/api/auth";
import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import useToastStore from "@/store/toastStore";
import { getStateAndReDirectUri } from "@/utils/getStateAndRedirectUri";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Button from "../common/Button";
import Input from "../form/input";

interface IPasswordForm {
  password: string;
  confirm_password: string;
}

const UpdateMyInfoPassword = () => {
  const { data: userInfo } = useSelectUserInfo();
  const resetPassword = usePasswordReset();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const {
    handleSubmit,
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<IPasswordForm>();

  // Setup postMessage listener for NICE authentication completion
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

  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr";
  const inputTextClassName =
    "text-14pxr md:text-16pxr h-40pxr md:h-44pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-11pxr";

  const validatePassword = (password: string) => {
    if (
      password.length < 8 ||
      !/[a-zA-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[!@#$%^&*]/.test(password)
    ) {
      return "패스워드는 최소 8자 이상, 영문, 특문, 숫자를 모두 포함해야합니다.";
    }
    return true;
  };

  const onSubmit = async (formData: IPasswordForm) => {
    if (resetPassword.isPending) return;

    const requestData = {
      email: userInfo?.data?.email,
      password: formData.password,
    };

    await resetPassword.mutateAsync(requestData, {
      onSuccess: () => {
        setToast({
          message: "비밀번호가 성공적으로 변경되었습니다.",
          type: "success",
        });
        reset();
      },
      onError: (error: any) => {
        setToast({
          message:
            error?.response?.data?.message || "비밀번호 변경에 실패했습니다.",
          type: "error",
        });
      },
    });
  };

  const getUpdatedState = (
    state: string,
    birthDate: string,
    gender: string
  ) => {
    const prefix = state.charAt(0);
    const updatedState = `${prefix}-${birthDate}-${gender}-likenovel`;
    return updatedState;
  };

  const onGoogleLogin = async () => {
    const { state, redirectUri } = getStateAndReDirectUri(
      "google",
      false,
      true
    );
    const updatedState = getUpdatedState(state, "1900-01-01", "M");
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${updatedState}&scope=email%20profile`;
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 md:w-[555px] md:px-8 md:py-9 md:border md:rounded-3xl"
    >
      <Input
        label="이메일 주소"
        value={userInfo?.data?.email || ""}
        readOnly
        labelStyle={labelClassName}
        inputStyle={inputTextClassName}
      />
      <div className="flex flex-col gap-2">
        <Input
          type="password"
          maxLength={20}
          label="새 비밀번호"
          placeholder="비밀번호를 입력하세요"
          labelStyle={labelClassName}
          inputStyle={inputTextClassName}
          {...register("password", {
            required: "패스워드를 입력해주세요.",
            validate: validatePassword,
          })}
          errorText={errors.password?.message}
          isError={!!errors.password}
        />
        <Input
          type="password"
          maxLength={20}
          placeholder="비밀번호를 다시 한번 더 입력하세요"
          labelStyle={labelClassName}
          inputStyle={inputTextClassName}
          {...register("confirm_password", {
            required: "패스워드를 확인해주세요.",
            validate: (value) => {
              const password = watch("password");
              if (!value) return "패스워드를 확인해주세요.";
              if (value !== password) return "비밀번호가 일치하지 않습니다.";
              return true;
            },
          })}
          errorText={errors.confirm_password?.message}
          isError={!!errors.confirm_password}
        />
        {!errors.confirm_password &&
          watch("confirm_password") &&
          watch("password") === watch("confirm_password") && (
            <p className="text-12pxr md:text-14pxr text-primary-100 mt-1">
              비밀번호가 일치합니다.
            </p>
          )}
      </div>

      <div className="text-12pxr mt-10 mx-auto md:hidden">
        연결된 간편 로그인
      </div>
      <div className="hidden md:flex border-t mt-6"></div>
      {/* <div className="relative flex justify-center items-end w-full h-[70px] gap-16pxr">
        <SocialLoginButton provider={"naver"} isSignIn={true} />
        <SocialLoginButton provider={"kakao"} isSignIn={true} />
        <SocialLoginButton
          provider={"google"}
          isSignIn={true}
          onGoogleClick={onGoogleLogin}
        />
        <SocialLoginButton provider={"apple"} isSignIn={true} />
      </div> */}

      {/* NICE 표준창 호출시 필요한 데이터 전송을 위한 form */}
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

      <div className="w-full mt-7 gap-2 flex flex-col md:flex-row">
        {userInfo?.data?.identityYn === "N" && (
          <Button
            type="button"
            className="w-full"
            variant="black"
            size="xl"
            onClick={onClickCertify}
          >
            본인인증
          </Button>
        )}
        <Button
          type="submit"
          className="w-full"
          size="xl"
          isLoading={resetPassword.isPending}
          disabled={resetPassword.isPending}
        >
          확인
        </Button>
      </div>
    </form>
  );
};

export default UpdateMyInfoPassword;
