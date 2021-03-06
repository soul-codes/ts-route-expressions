import { routeFragments, routeAlternate, routeCapture } from "./expressions";

export const r = Object.assign(routeFragments, {
  oneOf: routeAlternate,
  param: routeCapture
});

export { default as parse, RouteExpressionResult } from "./parser";
export { default as assemble } from "./assembler";
