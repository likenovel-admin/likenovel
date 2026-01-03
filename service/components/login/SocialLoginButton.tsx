import { RecentSignInTypeBubble } from "@/components/common/MessageBubble";
import { ISocialLoginProvider } from "@/types";
import { getStateAndReDirectUri } from "@/utils/getStateAndRedirectUri";
import Image from "next/image";

interface Props {
  provider: ISocialLoginProvider;
  isSignIn?: boolean;
  isKeepSignIn?: boolean;
  type?: "button" | "submit";
  isAgreeToAD?: boolean;
  isRecentSingIn?: boolean;
  onGoogleClick?: () => void;
  onAppleClick?: () => void;
  disabled?: boolean;
}

const SocialLoginButton = ({
  provider,
  isKeepSignIn = false,
  isSignIn = true,
  type = "button",
  isAgreeToAD = false,
  isRecentSingIn = false,
  onGoogleClick,
  onAppleClick,
  disabled = false,
}: Props) => {
  const naverLogin = (isKeepSignIn: boolean) => {
    const { state, redirectUri } = getStateAndReDirectUri(
      "naver",
      isKeepSignIn,
      isSignIn,
      isAgreeToAD
    );
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&state=${state}&redirect_uri=${redirectUri}`;
  };

  const kakaoLogin = (isKeepSignIn: boolean) => {
    const { state, redirectUri } = getStateAndReDirectUri(
      "kakao",
      isKeepSignIn,
      isSignIn,
      isAgreeToAD
    );
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
  };

  const socialIcons = (): string => {
    if (provider === "naver") {
      return "/images/naver.png";
    } else if (provider === "kakao") {
      return "/images/kakao.png";
    } else if (provider === "google") {
      return "/images/google.png";
    } else if (provider === "apple") {
      if (isSignIn) {
        return "/images/apple.png";
      } else {
        return "/images/apple-black.png";
      }
    } else {
      return "";
    }
  };

  const baseButtonStyle =
    "flex items-center justify-center rounded-[10px] relative";
  const signInButtonStyle = "w-[52px] h-[52px] rounded-full";
  const signUpButtonStyle = "w-[90px] h-[40px]";

  const naverButtonStyle = "bg-[#03C75A] text-white hover:bg-[#02a14a]";
  const kakaoButtonStyle = "bg-[#FEE500] text-black hover:bg-[#e6cc00]";
  const googleButtonStyle = "bg-light-gray-100 text-black hover:bg-gray-200";
  const appleButtonStyle = "bg-black text-white hover:bg-gray-700";

  const buttonStyle = (provider: ISocialLoginProvider, isSignIn: boolean) => {
    if (isSignIn) {
      if (provider === "kakao") {
        return signInButtonStyle + " " + kakaoButtonStyle;
      } else if (provider === "naver") {
        return signInButtonStyle + " " + naverButtonStyle;
      } else if (provider === "google") {
        return signInButtonStyle + " " + googleButtonStyle;
      } else if (provider === "apple") {
        return signInButtonStyle + " " + appleButtonStyle;
      }
    } else {
      if (provider === "naver") {
        return (
          "w-full h-[46px] md:h-[54px] text-14pxr md:text-16pxr " +
          naverButtonStyle
        );
      } else if (provider === "kakao") {
        return signUpButtonStyle + " ";
      } else if (provider === "google") {
        return signUpButtonStyle + " ";
      } else if (provider === "apple") {
        return signUpButtonStyle + " ";
      }
    }
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={() =>
        provider === "naver"
          ? naverLogin(isKeepSignIn)
          : provider === "kakao"
          ? kakaoLogin(isKeepSignIn)
          : provider === "google"
          ? onGoogleClick && onGoogleClick()
          : onAppleClick && onAppleClick()
      }
      className={`${baseButtonStyle} ${buttonStyle(provider, isSignIn)} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {isRecentSingIn && (
        <div className="absolute w-[73px] h-[29px] top-[-22px] left-[59%] translate-x-[-50%]">
          <RecentSignInTypeBubble>최근 로그인</RecentSignInTypeBubble>
        </div>
      )}
      {isSignIn ? (
        <Image
          src={socialIcons()}
          alt={provider}
          className={`${
            provider === "apple"
              ? "w-[25px] h-[25px] mt-[-5px]"
              : provider === "naver"
              ? "w-[20px] h-[20px]"
              : "w-[25px] h-[25px]"
          }`}
          width={25}
          height={25}
        />
      ) : (
        <div className="flex items-center gap-2">
          <Image
            src={socialIcons()}
            alt={provider}
            className={`${
              provider === "naver"
                ? "w-[18px] h-[18px]"
                : provider === "apple"
                ? "w-[19px] h-[23px] mt-[-3px]"
                : "w-[20px] h-[20px]"
            }`}
            width={25}
            height={25}
          />
          <span
            className={`${
              provider === "naver" ? "font-semibold" : "text-14pxr"
            }`}
          >
            {provider === "naver"
              ? "네이버 계정으로 3초만에 가입하기"
              : provider === "kakao"
              ? "카카오"
              : provider === "google"
              ? "구글"
              : "애플"}
          </span>
        </div>
      )}
    </button>
  );
};
export default SocialLoginButton;
