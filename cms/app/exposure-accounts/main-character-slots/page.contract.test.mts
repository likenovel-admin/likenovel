import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const apiSource = readFileSync(
  new URL("../../../api/mainCharacterSlot/index.ts", import.meta.url),
  "utf8"
);

assert.match(
  apiSource,
  /\/v1\/query\/admins\/main-character-slots\/products\/\$\{productId\}\/characters/,
  "CMS should load the selected product's strict slot roster"
);
assert.match(
  apiSource,
  /\/v1\/command\/admins\/main-character-slots\/publish-now/,
  "CMS should support immediate publication without replacing another card"
);
assert.match(
  pageSource,
  /group_type:\s*"character"/,
  "Character portraits should use the character upload group"
);
assert.match(
  pageSource,
  /character_scope_key:\s*characterScopeKey/,
  "The selected canonical character scope should be sent to the backend"
);
assert.doesNotMatch(
  pageSource,
  /character_name\s*:/,
  "CMS must not override the roster display name"
);
