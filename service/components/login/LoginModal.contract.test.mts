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
  loginSource,
  /pageType === "modal"[\s\S]*\? "px-32pxr py-20pxr"[\s\S]*: "h-screen justify-center md:justify-start min-w-\[300px\] max-w-\[700px\] px-16pxr md:px-90pxr"/,
  "Only the modal login should receive compact padding while full-page layouts remain unchanged"
);
assert.match(loginSource, /pageType === "modal" \? "mb-32pxr mt-8pxr"/);
assert.match(loginSource, /pageType === "modal" \? "mt-24pxr" : "mt-37pxr"/);
assert.match(loginSource, /pageType === "modal" \? "mt-32pxr" : "mt-50pxr"/);
assert.match(loginSource, /pageType === "modal" \? "mt-24pxr" : "mt-30pxr"/);
assert.doesNotMatch(loginSource, /max-h\[700px\]/);

assert.match(loginSource, /inputStyle="w-full h-\[52px\]"/);
assert.match(loginSource, /className="w-full h-\[50px\]"/);
