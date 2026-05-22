import assert from "node:assert/strict";
import { formatPercentMetric } from "./formatProductMetric.ts";

assert.equal(
  formatPercentMetric(0),
  "집계중",
  "numeric zero should be rendered as aggregation in progress"
);

assert.equal(
  formatPercentMetric(null),
  "-",
  "null should remain missing data"
);

assert.equal(
  formatPercentMetric(undefined),
  "-",
  "undefined should remain missing data"
);

assert.equal(formatPercentMetric(26.74), "26.7%");
