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

assert.match(
  modalSource,
  /fixed z-50 flex inset-0 bg-black\/50 justify-center items-center p-4/,
  "Desktop login overlay should center the modal with a viewport gutter"
);
assert.match(
  modalSource,
  /w-full max-w-\[440px\] max-h-\[calc\(100vh-2rem\)\]/,
  "Desktop login modal should use the compact responsive shell"
);
assert.doesNotMatch(modalSource, /w-\[640px\]|max-h-\[700px\]|m-\[15px\]/);
assert.match(
  modalSource,
  /modal\.scrollTop \+ modal\.clientHeight >= modal\.scrollHeight - 1/,
  "Short mobile overflow must remain scrollable until the actual bottom"
);
assert.doesNotMatch(
  modalSource,
  /modal\.scrollHeight - \(modal\.scrollTop \+ 100\) <= modal\.clientHeight/,
  "A fixed bottom tolerance must not block short mobile overflow"
);

assert.match(
  loginSource,
  /pageType === "modal"[\s\S]*\? "px-24pxr md:px-32pxr py-20pxr"[\s\S]*: "h-screen justify-center md:justify-start min-w-\[300px\] max-w-\[700px\] px-16pxr md:px-90pxr"/,
  "Only the modal login should receive responsive compact padding while full-page layouts remain unchanged"
);
assert.match(
  loginSource,
  /pageType === "modal"\s*\? "flex flex-col items-start gap-8pxr min-\[360px\]:flex-row min-\[360px\]:items-center min-\[360px\]:justify-between"\s*: "flex items-center justify-between"/,
  "Only very narrow modal controls should stack while full-page login stays unchanged"
);
assert.match(loginSource, /pageType === "modal" \? "mb-32pxr mt-8pxr"/);
assert.match(loginSource, /pageType === "modal" \? "mt-24pxr" : "mt-37pxr"/);
assert.match(loginSource, /pageType === "modal" \? "mt-32pxr" : "mt-50pxr"/);
assert.match(
  loginSource,
  /pageType === "modal"\s*\? "mt-24pxr flex-col gap-4pxr min-\[360px\]:flex-row min-\[360px\]:gap-0"\s*: "mt-30pxr"/,
  "Very narrow modal signup copy should stack without changing full-page login"
);
assert.match(
  loginSource,
  /pageType === "modal"\s*\? "ml-0 min-\[360px\]:ml-5pxr"\s*: "ml-5pxr"/,
  "Modal signup link spacing should follow the responsive footer layout"
);
assert.doesNotMatch(loginSource, /max-h\[700px\]/);

assert.match(loginSource, /inputStyle="w-full h-\[52px\]"/);
assert.match(loginSource, /className="w-full h-\[50px\]"/);
