import assert from "node:assert/strict";
import React from "react";

import { RouteAwareErrorBoundary } from "./useErrorBoundary.tsx";

const child = React.createElement("span", null, "content");
const productsBoundary = RouteAwareErrorBoundary({
  pathname: "/products",
  children: child,
});
const loginBoundary = RouteAwareErrorBoundary({
  pathname: "/login",
  children: child,
});

assert.ok(React.isValidElement(productsBoundary));
assert.ok(React.isValidElement(loginBoundary));
assert.deepEqual(productsBoundary.props.resetKeys, ["/products"]);
assert.deepEqual(loginBoundary.props.resetKeys, ["/login"]);
assert.notDeepEqual(
  productsBoundary.props.resetKeys,
  loginBoundary.props.resetKeys,
);
