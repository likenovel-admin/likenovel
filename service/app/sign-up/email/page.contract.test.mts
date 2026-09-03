import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const birthdateSelector = readFileSync(
  new URL("../../../components/signUp/BirthdateSelector.tsx", import.meta.url),
  "utf8"
);

assert.match(
  source,
  /defaultValues:\s*\{[\s\S]*?birthDate:\s*""/,
  "Email signup must not preselect a birthdate"
);
assert.doesNotMatch(
  source,
  /birthDate:\s*"1980-01-01"/,
  "Email signup must not submit the historical placeholder birthdate"
);
assert.match(
  source,
  /name="birthDate"[\s\S]*?required:\s*"생년월일을 입력해주세요\."/,
  "Email signup must keep birthdate selection required"
);
assert.match(
  source,
  /useForm<IForm>\(\{[\s\S]*?shouldFocusError:\s*true/,
  "Email signup must focus the first invalid field"
);
assert.match(
  source,
  /<BirthdateSelector[\s\S]*?focusRef=\{field\.ref\}/,
  "Email signup must connect birthdate validation focus to its selector"
);
assert.match(
  birthdateSelector,
  /isError[\s\S]*?border-red-100/,
  "Birthdate selects must show a red border when validation fails"
);
assert.match(
  birthdateSelector,
  /aria-invalid=\{isError\}/,
  "Birthdate validation state must be exposed to assistive technology"
);
