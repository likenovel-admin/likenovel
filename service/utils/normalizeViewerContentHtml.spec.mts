import assert from "node:assert/strict";
import { normalizeViewerContentHtml } from "./normalizeViewerContentHtml.ts";

{
  const normalized = normalizeViewerContentHtml(
    '<p>문장 하나<br/></p><p><br/></p><p>문장 둘<br></p>'
  );

  assert.equal(normalized, "<p>문장 하나</p><p><br></p><p>문장 둘</p>");
}

{
  const normalized = normalizeViewerContentHtml(
    '<p>첫 줄<br/>둘째 줄</p><p>다음 문단<br class="ProseMirror-trailingBreak"></p>'
  );

  assert.equal(normalized, "<p>첫 줄</p><p>둘째 줄</p><p>다음 문단</p>");
}

{
  const normalized = normalizeViewerContentHtml("<p></p><p>&nbsp;</p>");

  assert.equal(normalized, "<p><br></p><p><br></p>");
}

{
  const normalized = normalizeViewerContentHtml(
    "<p><br/>문장 하나</p><p><br><br/>문장 둘</p>"
  );

  assert.equal(
    normalized,
    "<p><br></p><p>문장 하나</p><p><br></p><p><br></p><p>문장 둘</p>"
  );
}

{
  const normalized = normalizeViewerContentHtml(
    "<p>“대사 하나”<br>“대사 둘”<br></p><p><br>서술 문단</p>"
  );

  assert.equal(
    normalized,
    "<p>“대사 하나”</p><p>“대사 둘”</p><p><br></p><p>서술 문단</p>"
  );
}

{
  const normalized = normalizeViewerContentHtml(
    "<p><strong>강조 첫 줄<br>강조 둘째 줄</strong></p>"
  );

  assert.equal(normalized, "<p><strong>강조 첫 줄<br>강조 둘째 줄</strong></p>");
}
