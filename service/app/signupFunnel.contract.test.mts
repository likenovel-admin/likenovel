import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = existsSync("service/app/sign-up/page.tsx") ? "service" : ".";
const signupSource = readFileSync(`${root}/app/sign-up/page.tsx`, "utf8");
const socialButtonSource = readFileSync(`${root}/components/login/SocialLoginButton.tsx`, "utf8");
const authApiSource = readFileSync(`${root}/app/api/auth/index.ts`, "utf8");
const storageRelaySource = readFileSync(`${root}/app/storage-relay/page.tsx`, "utf8");
const emailSignupSource = readFileSync(`${root}/app/sign-up/email/page.tsx`, "utf8");

assert.doesNotMatch(
  signupSource,
  /<SocialLoginButton[\s\S]{0,400}disabled=\{isSubmitDisabled\}/,
  "Signup social buttons must remain enabled before terms agreement"
);

assert.match(
  signupSource,
  /onRedirectRequest=\{handleSocialRedirectRequest\}/,
  "Signup social buttons should route missing agreement through the terms UI"
);

assert.match(
  socialButtonSource,
  /onRedirectRequest\(continueRedirect\)/,
  "Social login button should expose its existing provider redirect as a continuation"
);

assert.match(
  signupSource,
  /서비스 이용을 위해 약관에 동의해 주세요[\s\S]*전체 동의[\s\S]*필수 약관에 동의해주세요[\s\S]*동의하고 계속하기/,
  "Terms sheet should contain the required agreement copy and guarded CTA"
);

assert.match(
  signupSource,
  /<ModalContainer[\s\S]*isOpen=\{openSocialTerms\}[\s\S]*<BottomSheetContainer[\s\S]*isOpen=\{openSocialTerms\}/,
  "Terms agreement should use a modal on larger screens and a bottom sheet on mobile"
);

assert.match(
  authApiSource,
  /\/v1\/command\/auth\/signup\/social\/complete/,
  "Social pending signup should call the dedicated completion API"
);

assert.match(
  signupSource,
  /social_pending[\s\S]*거의 다 왔어요[\s\S]*계정 인증 완료[\s\S]*동의하고 시작하기/,
  "Social pending mode should show provider confirmation and the completion CTA"
);

assert.match(
  signupSource,
  /new URLSearchParams\(\{[\s\S]*sns_id:[\s\S]*temp_issued_key:[\s\S]*keep_signin_yn:/,
  "Social completion should reuse the existing storage-relay parameter contract"
);

assert.match(
  signupSource,
  /인증 세션이 만료되었습니다\. 다시 시도해 주세요\.[\s\S]*router\.replace\("\/sign-up"\)/,
  "Expired social sessions should show a toast and return to ordinary signup"
);

assert.match(
  signupSource,
  /axios\.isAxiosError[\s\S]*response\?\.status === 409[\s\S]*response\.data\?\.message[\s\S]*setToast\(\{[\s\S]*message: serverMessage[\s\S]*\/login\?modal=open/,
  "Existing-email conflicts should show the server message and lead to login"
);

assert.match(
  signupSource,
  /response\?\.status === 409[\s\S]*\/login\?modal=open[\s\S]*return;[\s\S]*인증 세션이 만료되었습니다/,
  "Existing-email conflicts should return before the ordinary-signup fallback"
);

assert.match(
  storageRelaySource,
  /getLocalStorage<string>\([\s\S]*STORAGE_KEYS\.PREVIOUS_PAGE[\s\S]*removeLocalStorage\(STORAGE_KEYS\.PREVIOUS_PAGE\)[\s\S]*router\.push\(previousPage\)/,
  "Storage relay should return completed social signup to the preserved page"
);

assert.doesNotMatch(
  signupSource,
  /\/sign-up\/social\?provider=google/,
  "Google signup should not route through the removed demographic page"
);

assert.match(
  signupSource,
  /9999-12-31-U-likenovel[\s\S]*accounts\.google\.com\/o\/oauth2\/v2\/auth/,
  "Google signup should start OAuth directly with the missing-demographic sentinel"
);

assert.match(
  emailSignupSource,
  /birthDate:\s*""/,
  "Email signup birthdate should start empty"
);

assert.match(
  emailSignupSource,
  /onBlur:\s*\(event\) => scheduleEmailCheck\(event\.target\.value\)/,
  "Email duplicate checking should start automatically on blur"
);

assert.match(
  emailSignupSource,
  /emailCheckTimerRef\.current = setTimeout\([\s\S]*}, 300\)/,
  "Email duplicate checking should debounce the blur request for 300ms"
);

assert.match(
  emailSignupSource,
  /!\/\[\\W_\]\/\.test\(password\)/,
  "Email signup password validation should accept the backend special-character range"
);

assert.doesNotMatch(
  emailSignupSource,
  /!\/\[!@#\$%\^&\*\]\/\.test\(password\)/,
  "Email signup must not retain the old eight-character special-character whitelist"
);

assert.match(
  emailSignupSource,
  /이메일 중복 확인 중\.\.\.[\s\S]*사용 가능한 이메일입니다\.[\s\S]*additionalText=/,
  "Email field should expose pending and available inline states with its existing right slot"
);
