"use client";

import { useLoginIn } from "@/api/auth";
import FullPageLoader from "@/components/common/FullPageLoader";
import { ErrorMessages } from "@/constants/errorMessages";
import { ErrorCodes } from "@/enums/errorCodes";
import { showAlert } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthenticate";
import { useProfileStore } from "@/store/useProfileStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

type FormData = {
  email: string;
  password: string;
  rememberEmail: boolean;
};

const REMEMBERED_EMAIL_KEY = "cms.login.rememberedEmail";

export default function LoginPage() {
  const route = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
      rememberEmail: true,
    },
  });
  const login = useLoginIn();
  const { setProfile } = useProfileStore();
  const { setIsAuthenticated } = useAuthStore();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (!rememberedEmail) return;

    setValue("email", rememberedEmail);
  }, [setValue]);

  const onSubmit = async (formData: FormData) => {
    if (login.isPending) {
      return;
    }

    const email = formData.email.trim();

    login.mutate(
      { email, password: formData.password, keep_signin_yn: "Y" },
      {
        onSuccess: (data) => {
          if (data.data.auth && formData.rememberEmail) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
          } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          }
          setIsAuthenticated(true);
          setProfile({
            id: data.data.auth.userId,
          });
          route.push("/statistics/site");
        },
        onError: (err: any) => {
          showAlert(
            "오류",
            err?.code ? ErrorMessages[err?.code as ErrorCodes] : err?.message,
            "확인"
          );
          console.log("err", err?.code);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block mb-1 font-medium">이메일</label>
            <input
              type="email"
              autoComplete="email"
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-300"}`}
              placeholder="이메일을 입력하세요"
              {...register("email", {
                required: "이메일을 입력해주세요",
                pattern: {
                  value: /.+@.+\..+/,
                  message: "유효한 이메일 주소를 입력해주세요",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message as string}
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">비밀번호</label>
            <input
              type="password"
              autoComplete="current-password"
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-500" : "border-gray-300"}`}
              placeholder="비밀번호를 입력하세요"
              {...register("password", {
                required: "비밀번호를 입력해주세요",
                minLength: {
                  value: 6,
                  message: "비밀번호는 최소 6자 이상이어야 합니다",
                },
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message as string}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register("rememberEmail")}
            />
            이메일 저장
          </label>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
      <FullPageLoader isLoading={login.isPending} />
    </div>
  );
}
