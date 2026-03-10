"use client";
import {
  usePasswordReset,
  usePublicPasswordReset,
} from "@/app/api/auth";
import Button from "@/components/common/Button";
import Input from "@/components/form/input";
import HeaderFindId from "@/components/menu/HeaderFindId";
import useMediaDevice from "@/hooks/useMediaDevice";
import useToastStore from "@/store/toastStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import LogoIcon from "/public/images/logos/logo-icon.svg";
import Logo from "/public/images/logos/logo.svg";

export interface IResetForm {
  password: string;
  confirm_password: string;
}

export default function Page() {
  const device = useMediaDevice();
  const router = useRouter();
  const searchParams = useSearchParams();
  const methods = useForm<IResetForm>();
  const resetPassword = usePasswordReset();
  const publicResetPassword = usePublicPasswordReset();
  const { setToast } = useToastStore();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const {
    handleSubmit,
    register,
    control,
    watch,
    formState: { errors },
  } = methods;

  // Get email and token from query params
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");
    if (!emailParam) {
      setToast({
        message: "이메일 정보가 없습니다. 다시 시도해주세요.",
        type: "error",
      });
      router.push("/find-password");
      return;
    }
    setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);
  }, [searchParams, router, setToast]);

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

  const isLoading = resetPassword.isPending || publicResetPassword.isPending;

  const onSubmit = async (formData: IResetForm) => {
    if (isLoading) return;

    if (!email) {
      setToast({
        message: "이메일 정보가 없습니다.",
        type: "error",
      });
      return;
    }

    const onSuccess = () => {
      setToast({
        message: "비밀번호가 성공적으로 변경되었습니다.",
        type: "success",
      });
      router.push("/");
    };

    const onError = (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        "비밀번호 재설정에 실패했습니다. 다시 시도해주세요.";
      setToast({
        message: errorMessage,
        type: "error",
      });
    };

    if (token) {
      // 이메일 인증 링크를 통한 재설정
      await publicResetPassword.mutateAsync(
        { email, token, password: formData.password },
        { onSuccess, onError }
      );
    } else {
      // 기존 NICE 본인인증을 통한 재설정
      await resetPassword.mutateAsync(
        { email, password: formData.password },
        { onSuccess, onError }
      );
    }
  };

  return device === "desktop" ? (
    <div className="min-h-screen flex justify-center items-center bg-[#F9FAFB]">
      <section className="w-full max-w-md">
        <div className="mx-auto rounded-[40px] bg-white w-[500px] h-[575px]">
          <div className="px-[61px] pt-[76px] pb-[91px] text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <button
                className="flex justify-center items-end"
                onClick={() => {
                  router.push("/");
                }}
              >
                <LogoIcon className="w-[30px] h-[38px]" />
                <Logo className="w-[150px] h-[20px]" />
              </button>
            </div>
            {/* Title & helper */}
            <p className="mt-[62px] w-full text-xl font-bold tracking-[-2%] text-[#111317]">
              비밀번호 재설정
            </p>
            <p className="mt-[12px] font-normal text-sm leading-[21px] text-[#4D5159] tracking-[-2%]">
              새로 사용할 비밀번호를 입력해주세요.
            </p>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full mt-[47px]"
            >
              <div className="flex flex-col gap-5pxr">
                <Input
                  type="password"
                  maxLength={20}
                  label="새 비밀번호"
                  labelStyle="text-14pxr font-semibold text-left tracking-[-2%]"
                  gap="gap-8pxr"
                  inputStyle="w-full h-[44px]"
                  placeholder="비밀번호를 입력하세요"
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
                  inputStyle="w-full h-[44px]"
                  placeholder="비밀번호를 다시한번 더 입력하세요"
                  {...register("confirm_password", {
                    required: "패스워드를 확인해주세요.",
                    validate: (value) =>
                      value === watch("password") ||
                      "비밀번호가 일치하지 않습니다.",
                  })}
                  errorText={errors.confirm_password?.message}
                  isError={!!errors.confirm_password}
                />
              </div>
              <div className="w-full mt-32pxr">
                <Button
                  size="xl"
                  type="submit"
                  className="w-full h-[54px] rounded-[10px] !bg-[#111317] text-white"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  확인
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  ) : (
    <div className="min-h-screen flex flex-col items-center bg-[#F9FAFB] px-[20px]">
      <div className="w-full flex flex-col flex-1 text-center">
        {/* Top bar */}
        <HeaderFindId />

        {/* Title & helper */}
        <p className="mt-[62px] w-full text-xl font-bold tracking-[-2%] text-[#111317]">
          비밀번호 재설정
        </p>
        <p className="mt-[12px] font-normal text-sm leading-[21px] text-[#4D5159] tracking-[-2%]">
          새로 사용할 비밀번호를 입력해주세요.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full flex flex-col flex-1 mt-[47px]"
        >
          <div className="flex flex-col gap-5pxr">
            <Input
              type="password"
              maxLength={20}
              label="새 비밀번호"
              labelStyle="text-14pxr font-semibold text-left tracking-[-2%]"
              gap="gap-8pxr"
              inputStyle="w-full h-[54px] !rounded-[10px]"
              placeholder="비밀번호를 입력하세요"
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
              inputStyle="w-full h-[54px] !rounded-[10px]"
              placeholder="비밀번호를 다시한번 더 입력하세요"
              {...register("confirm_password", {
                required: "패스워드를 확인해주세요.",
                validate: (value) =>
                  value === watch("password") ||
                  "비밀번호가 일치하지 않습니다.",
              })}
              errorText={errors.confirm_password?.message}
              isError={!!errors.confirm_password}
            />
          </div>

          {/* Button */}
          <div className="w-full mt-auto mb-6">
            <Button
              size="xl"
              type="submit"
              className="w-full h-[54px] rounded-[10px] !bg-[#111317] text-white"
              isLoading={isLoading}
              disabled={isLoading}
            >
              확인
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
