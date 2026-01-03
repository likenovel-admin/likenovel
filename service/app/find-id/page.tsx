"use client";
import HeaderFindId from "@/components/menu/HeaderFindId";
import useMediaDevice from "@/hooks/useMediaDevice";
import axios from "axios";
import { useRouter } from "next/navigation";
import LogoIcon from "/public/images/logos/logo-icon.svg";
import Logo from "/public/images/logos/logo.svg";

export default function Page() {
  const device = useMediaDevice();
  const router = useRouter();

  const handleFindId = async () => {
    console.log("onClickCertify - Find ID");

    const token_data = await axios
      .post(`/api/auth/find-id`)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.error(error);
      });

    console.log("token_data:", token_data);

    const form = document.getElementById("form") as HTMLFormElement;
    const left = screen.width / 2 - 500 / 2;
    const top = screen.height / 2 - 800 / 2;
    const option = `status=no, menubar=no, toolbar=no, resizable=no, width=500, height=600, left=${left}, top=${top}`;

    if (form && token_data.data) {
      const { encData, integrityValue, tokenVersionId } = token_data.data;
      console.log(">>>>>>>", encData, integrityValue, tokenVersionId);

      window.open("", "nicePopup", option);

      form.target = "nicePopup";
      form.enc_data.value = encData;
      form.token_version_id.value = tokenVersionId;
      form.integrity_value.value = integrityValue;
      form.submit();
    }
  };

  return device === "desktop" ? (
    <div className="min-h-screen flex justify-center items-center bg-[#F9FAFB]">
      <section className="w-full max-w-md">
        <div className="mx-auto rounded-[40px] bg-white w-[500px] h-[458px]">
          <div className="px-[100px] py-[76px] text-center">
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
            <h1 className="mt-[41px] text-xl font-bold tracking-[-2%]">
              아이디 찾기
            </h1>
            <p className="mt-[12px] font-normal text-sm leading-[21px] text-[#4D5159] tracking-[-2%]">
              아이디를 찾기 위해 본인인증이 필요합니다.
              <br />
              본인 인증을 해주세요.
            </p>

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
              <input
                type="hidden"
                id="integrity_value"
                name="integrity_value"
              />
            </form>

            {/* CTA */}
            <button
              type="button"
              className="mt-[41px] w-[300px] h-[54px] rounded-[10px] bg-[#111317] px-4 py-3 text-base font-semibold tracking-[-2%] text-white transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
              onClick={handleFindId}
            >
              휴대폰 본인 인증 하기
            </button>

            {/* Links */}
            <div className="mt-[16px] flex gap-[10px] justify-center">
              <span className="text-sm font-normal text-[#111317] tracking-[-2%]">
                비밀번호를 잊으셨나요?
              </span>
              <a
                href="/find-password"
                className="text-sm font-medium text-[#111317] underline underline-offset-2 hover:opacity-80"
              >
                비밀번호 찾기
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  ) : (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F9FAFB] px-[20px]">
      {/* Top bar */}
      <HeaderFindId />

      {/* Content */}
      <div className="flex-1 text-center">
        <h1 className="mt-[90px] text-2xl font-bold tracking-[-2%] text-[#111317]">
          아이디 찾기
        </h1>
        <p className="mt-[12px] text-base tracking-[-2%] text-[#4D5159]">
          아이디를 찾기 위해 본인확인이 필요합니다.
          <br />
          본인 인증을 해주세요.
        </p>
      </div>

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

      {/* Bottom CTA */}
      <div className="mb-[60px] w-full">
        <button
          type="button"
          onClick={handleFindId}
          className="w-full rounded-2xl bg-[#111317] py-4 text-white text-base font-semibold tracking-[-0.02em] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
        >
          휴대폰 본인 인증 하기
        </button>

        <p className="mt-[30px] flex gap-[17px] justify-center text-sm text-[#111317] tracking-[-0.02em]">
          아직도 라이크노벨 회원이 아니세요?
          <a
            href="/find-password"
            className="font-medium underline underline-offset-2"
          >
            회원가입
          </a>
        </p>
      </div>
    </div>
  );
}
