import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const serviceRoot = existsSync("service/components/login/index.tsx")
  ? "service"
  : ".";
const modalSource = readFileSync(
  `${serviceRoot}/app/@modal/(.)login/page.tsx`,
  "utf8"
);
const loginSource = readFileSync(
  `${serviceRoot}/components/login/index.tsx`,
  "utf8"
);
const socialButtonSource = readFileSync(
  `${serviceRoot}/components/login/SocialLoginButton.tsx`,
  "utf8"
);
const signupSource = readFileSync(
  `${serviceRoot}/app/sign-up/page.tsx`,
  "utf8"
);

const assertOrdered = (
  source: string,
  first: string,
  second: string,
  message: string
) => {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);

  assert.notEqual(firstIndex, -1, `Missing expected marker: ${first}`);
  assert.notEqual(secondIndex, -1, `Missing expected marker: ${second}`);
  assert.ok(firstIndex < secondIndex, message);
};

assert.match(
  modalSource,
  /fixed inset-0 z-50 flex items-center justify-center bg-black\/50 p-4/,
  "Desktop login overlay should center the modal with a viewport gutter"
);
assert.match(
  modalSource,
  /w-full max-w-\[440px\] max-h-\[calc\(100dvh-2rem\)\] overflow-y-auto overscroll-contain/,
  "Desktop login modal should use the compact responsive shell"
);
assert.doesNotMatch(modalSource, /w-\[640px\]|max-h-\[700px\]|m-\[15px\]/);
assert.match(modalSource, /document\.body\.style\.overflow = "hidden"/);
assert.match(modalSource, /document\.body\.style\.overflow = previousOverflow/);
assert.match(modalSource, /event\.key === "Escape"/);
assert.match(modalSource, /role="dialog"/);
assert.match(modalSource, /aria-modal="true"/);
assert.match(modalSource, /useRef<HTMLDivElement>\(null\)/);
assert.match(modalSource, /document\.activeElement instanceof HTMLElement/);
assert.doesNotMatch(modalSource, /\[isOpen, searchParams\]/);
assert.match(modalSource, /event\.key !== "Tab"/);
assert.match(modalSource, /dialog\.querySelectorAll<HTMLElement>/);
assert.match(modalSource, /previouslyFocusedElementRef\.current/);
assert.match(modalSource, /previouslyFocusedElement\.focus\(\)/);
assert.doesNotMatch(modalSource, /addEventListener\("wheel"/);

assert.match(
  loginSource,
  /pageType === "modal"[\s\S]*\? "px-24pxr pb-16pxr pt-0 md:px-32pxr"[\s\S]*: "h-screen justify-center md:justify-start min-w-\[300px\] max-w-\[700px\] px-16pxr md:px-90pxr"/,
  "Only the modal login should receive responsive compact padding while full-page layouts remain unchanged"
);
assert.match(
  loginSource,
  /pageType === "modal"\s*\? "flex flex-col items-start gap-8pxr min-\[360px\]:flex-row min-\[360px\]:items-center min-\[360px\]:justify-between"\s*: "flex items-center justify-between"/,
  "Only very narrow modal controls should stack while full-page login stays unchanged"
);
assert.match(loginSource, /pageType === "modal" \? "mb-18pxr"/);
assert.match(loginSource, /pageType === "modal" \? "mt-18pxr" : "mt-37pxr"/);
assert.match(
  loginSource,
  /pageType === "modal"\s*\? "mt-18pxr flex-col gap-4pxr min-\[360px\]:flex-row min-\[360px\]:gap-0"\s*: "mt-30pxr"/,
  "Very narrow modal signup copy should stack without changing full-page login"
);
assert.match(
  loginSource,
  /pageType === "modal"\s*\? "ml-0 min-\[360px\]:ml-5pxr"\s*: "ml-5pxr"/,
  "Modal signup link spacing should follow the responsive footer layout"
);
assert.doesNotMatch(loginSource, /max-h\[700px\]/);

assert.match(loginSource, /autoFocus=\{pageType === "modal"\}/);
assert.match(loginSource, /label="이메일"/);
assert.match(loginSource, /이메일 또는 비밀번호를 확인해주세요/);
assertOrdered(
  loginSource,
  "<form",
  "SNS로 계속하기",
  "Email login must appear before social login"
);
assertOrdered(
  signupSource,
  "이메일로 가입하기",
  'provider={"kakao"}',
  "Email signup must appear before social signup"
);
assert.match(
  signupSource,
  /type="submit"[\s\S]*?disabled=\{isSubmitDisabled\}[\s\S]*?이메일로 가입하기/,
  "Email signup must preserve required-consent disabled semantics"
);
assert.match(
  signupSource,
  /agree\.agreeToTerms && agree\.agreeToAge && agree\.agreeToPrivacy/,
  "Only the three required consents should enable signup"
);

for (const source of [loginSource, signupSource]) {
  assertOrdered(source, 'provider={"kakao"}', 'provider={"naver"}', "Kakao first");
  assertOrdered(source, 'provider={"naver"}', 'provider={"google"}', "Google last");

  for (const provider of ["kakao", "naver", "google"]) {
    assert.match(
      source,
      new RegExp(`provider=\\{\"${provider}\"\\}[\\s\\S]*?fullWidth`),
      `${provider} must remain full width`
    );
  }
}

for (const provider of ["kakao", "naver", "google"]) {
  assert.match(
    loginSource,
    new RegExp(
      `provider=\\{\"${provider}\"\\}[\\s\\S]*?isRecentSingIn=\\{recentLoginType === \"${provider}\"\\}`
    ),
    `${provider} recent-login badge must stay on its own button`
  );
}

assert.match(socialButtonSource, /fullWidth\?: boolean/);
assert.match(socialButtonSource, /카카오톡으로 계속하기/);
assert.match(socialButtonSource, /네이버로 계속하기/);
assert.match(socialButtonSource, /구글로 계속하기/);
assert.match(socialButtonSource, /right-10pxr top-1\/2/);
