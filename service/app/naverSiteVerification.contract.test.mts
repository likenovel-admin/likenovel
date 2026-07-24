import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const metadataSource = readFileSync(
  new URL("../utils/siteSeoMetadata.ts", import.meta.url),
  "utf8",
);
const prodWorkflowSource = readFileSync(
  new URL("../../.github/workflows/docker-prod.yml", import.meta.url),
  "utf8",
);
const devWorkflowSource = readFileSync(
  new URL("../../.github/workflows/docker-dev.yml", import.meta.url),
  "utf8",
);

assert.match(
  metadataSource,
  /process\.env\.NAVER_SITE_VERIFICATION\?\.trim\(\)/,
  "root metadata should read and trim the optional Naver verification value",
);
assert.match(
  metadataSource,
  /"naver-site-verification": naverSiteVerification/,
  "root metadata should emit the Naver verification meta name",
);
assert.match(
  prodWorkflowSource,
  /NAVER_SITE_VERIFICATION:\s*\$\{\{\s*secrets\.NAVER_SITE_VERIFICATION\s*\}\}/,
  "prod build should receive the Naver verification secret",
);
assert.match(
  prodWorkflowSource,
  /if \[ -n "\$NAVER_SITE_VERIFICATION" \]/,
  "prod build should append the value only when configured",
);
assert.doesNotMatch(
  devWorkflowSource,
  /NAVER_SITE_VERIFICATION/,
  "dev build must not receive or expose the production verification value",
);
