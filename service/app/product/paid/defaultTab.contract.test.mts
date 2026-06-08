import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

assert.match(
  source,
  /const \[activeTab, setActiveTab\] = useState\("ongoing"\);/,
  "Paid page should default to the ongoing tab"
);
assert.match(
  source,
  /\{activeTab === "ongoing" \?\s*\(\s*<Ongoing \/>/,
  "Paid page should render Ongoing when the active tab is ongoing"
);
assert.match(
  source,
  /\{ label: "연재중", value: "ongoing" \}/,
  "Paid page should expose the ongoing tab"
);
assert.match(
  source,
  /\{ label: "연재완결", value: "end" \}/,
  "Paid page should keep the completed serialization tab"
);
