import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readSource = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const querySource = readSource("../../app/api/query/event/index.ts");
const eventListSource = readSource("./EventList.tsx");

assert.match(
  querySource,
  /queryKey:\s*\["selectEvents",\s*close_yn\]/,
  "Progress and ended events must use separate query cache keys"
);

assert.doesNotMatch(
  eventListSource,
  /\brefetch\b/,
  "Tab changes must rely on the query key instead of a manual refetch"
);

assert.doesNotMatch(
  eventListSource,
  /\bisFetching\b/,
  "Background refetches must not replace the event grid with a full spinner"
);

assert.match(
  eventListSource,
  /\{isLoading\s*\?\s*\(/,
  "Only the initial event request should show the full loading state"
);

assert.ok(
  eventListSource.includes(
    'sizes="(max-width: 767px) 50vw, (max-width: 1120px) 25vw, 280px"'
  ),
  "Event thumbnails must declare their responsive rendered width"
);
