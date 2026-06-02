import assert from "node:assert/strict";
import { recoverPlainTextFromClipboardHtml } from "./clipboardPlainTextRecovery.ts";

{
  const html =
    '<font>첫 줄\n</font><font>\n</font><font>둘째 줄\n</font>';

  assert.equal(
    recoverPlainTextFromClipboardHtml(html, "첫 줄\n둘째 줄"),
    "첫 줄\n\n둘째 줄"
  );
}

{
  const html =
    '<font>첫 줄\n</font><font>\n</font><font>둘째 줄\n</font>';

  assert.equal(
    recoverPlainTextFromClipboardHtml(html, "첫 줄\n\n둘째 줄"),
    null
  );
}

{
  const html =
    '<font>첫 줄\n</font><font>\n</font><font>다른 줄\n</font>';

  assert.equal(
    recoverPlainTextFromClipboardHtml(html, "첫 줄\n둘째 줄"),
    null
  );
}

{
  const html =
    '<font>&lt;시스템&gt; &amp; 문장\n</font><font>\n</font><font>둘째&nbsp;줄</font>';

  assert.equal(
    recoverPlainTextFromClipboardHtml(html, "<시스템> & 문장\n둘째 줄"),
    "<시스템> & 문장\n\n둘째 줄"
  );
}

{
  const html =
    '<p style="text-align: left">첫 줄</p><p style="text-align: justify">둘째 줄</p>';

  assert.equal(
    recoverPlainTextFromClipboardHtml(html, ""),
    "첫 줄\n\n둘째 줄"
  );
}

{
  const html = "<p>첫 줄</p><p><br></p><p>둘째 줄</p>";

  assert.equal(
    recoverPlainTextFromClipboardHtml(html, ""),
    "첫 줄\n\n둘째 줄"
  );
}

{
  const html =
    '<p style="text-align: left">첫 줄</p><p style="text-align: justify">둘째 줄</p>';

  assert.equal(
    recoverPlainTextFromClipboardHtml(html, "첫 줄\n둘째 줄"),
    "첫 줄\n\n둘째 줄"
  );
}

{
  const html = "<p>첫 줄<br>이어진 줄</p><p>둘째 줄</p>";

  assert.equal(
    recoverPlainTextFromClipboardHtml(html, ""),
    "첫 줄\n이어진 줄\n\n둘째 줄"
  );
}
