import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mobileGlobalNavSource = readFileSync(
  new URL("./MobileGlobalNav.tsx", import.meta.url),
  "utf8"
);

assert.match(
  mobileGlobalNavSource,
  /className="flex gap-12pxr min-\[360px\]:gap-20pxr"/,
  "Mobile global nav should use compact spacing only below 360px"
);

const navLabelClassNames = Array.from(
  mobileGlobalNavSource.matchAll(/<span className="([^"]+)">/g),
  (match) => match[1]
);

assert.equal(
  navLabelClassNames.length,
  5,
  "Mobile global nav should keep all five labels in the layout contract"
);

for (const className of navLabelClassNames) {
  assert.match(
    className,
    /\binline-flex\b/,
    "Every mobile global nav label should use an inline flex row"
  );
  assert.match(
    className,
    /\bshrink-0\b/,
    "Every mobile global nav label should resist shrinking"
  );
  assert.match(
    className,
    /\bwhitespace-nowrap\b/,
    "Every mobile global nav label should stay on one line"
  );
  assert.match(
    className,
    /\btext-14pxr\b/,
    "Every mobile global nav label should use compact type below 360px"
  );
  assert.match(
    className,
    /\bmin-\[360px\]:text-16pxr\b/,
    "Every mobile global nav label should preserve the existing type at 360px and above"
  );
}
