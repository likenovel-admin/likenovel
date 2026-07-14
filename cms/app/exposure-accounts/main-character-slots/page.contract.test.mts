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
  /queryParams:\s*\{\s*search_word:\s*"",\s*limit:\s*100\s*\}/,
  "CMS should load the full product list without requiring a search submission"
);
assert.match(
  pageSource,
  /aria-pressed=\{selectedProduct\?\.productId === product\.productId\}/,
  "CMS should expose products as a directly selectable list"
);
assert.match(
  pageSource,
  /aria-pressed=\{characterScopeKey === item\.scopeKey\}/,
  "CMS should expose the selected product's characters as a directly selectable list"
);
assert.doesNotMatch(
  pageSource,
  /character-product-search/,
  "CMS should not gate product selection behind the legacy search form"
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
