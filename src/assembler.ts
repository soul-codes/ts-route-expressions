import {
  RouteExpressionHash,
  RouteFragments,
  RouteExpression,
  OptionalRouteCapture,
  RouteCapture,
  RouteRefName,
  OptionalRouteAlternative,
  RouteAlternative,
  OptionalRouteFragments
} from "./expressions";
import {
  RouteExpressionResult,
  GenericHashResult,
  CaptureResult,
  AlternativeResult,
  StaticResult
} from "./parser";

export default function assemble<
  T extends RouteFragments<RouteExpressionHash | {}>
>(route: T, data: RouteExpressionResult<T>) {
  return innerAssemble(data, route);
}

function innerAssemble<T extends RouteFragments<RouteExpressionHash>>(
  data: GenericHashResult,
  route: T
): string {
  return assembleFragments(data, route).join("/");
}

function assembleExpression(
  data: CaptureResult | AlternativeResult | GenericHashResult | StaticResult,
  expression: RouteExpression
) {
  if (typeof expression === "string") {
    return assembleStatic(expression);
  } else if (expression.type === "capture") {
    return assembleCapture(data as CaptureResult, expression);
  } else if (expression.type === "alternative") {
    return assembleAlternative(data as AlternativeResult, expression);
  } else if (expression.type === "fragments") {
    return assembleFragments(data as GenericHashResult, expression);
  }
  throw Error("never get here");
}

function assembleStatic(expression: string) {
  return [expression];
}

function assembleCapture(
  data: CaptureResult,
  expression: RouteCapture<RouteRefName> | OptionalRouteCapture<RouteRefName>
): string[] {
  const { refName, leadingName, isOptional } = expression;
  if (!data) {
    if (isOptional) return [];
    throw Error("Missing substitution at " + refName);
  }

  return leadingName ? [leadingName, data] : [data];
}

function assembleAlternative(
  data: AlternativeResult,
  expression:
    | RouteAlternative<RouteRefName, RouteExpressionHash>
    | OptionalRouteAlternative<RouteRefName, RouteExpressionHash>
): string[] {
  const { refName, alternatives, isOptional } = expression;

  if (!data) {
    if (isOptional) return [];
    throw Error("Missing route option at " + refName);
  }
  if (!Object.prototype.hasOwnProperty.call(alternatives, data.result))
    throw Error(
      "Route alternative " + data.result + " not found for " + refName
    );

  return assembleExpression(data.data, alternatives[data.result]);
}

function assembleFragments(
  data: GenericHashResult,
  expression:
    | OptionalRouteFragments<RouteRefName, RouteExpressionHash>
    | RouteFragments<RouteExpressionHash>
): string[] {
  if (!data && expression.isOptional) return [];
  const result: string[] = [];
  const { fragments } = expression;

  for (let i = 0, length = fragments.length; i < length; i++) {
    const fragment = fragments[i];
    if (typeof fragment === "string") {
      result.push(...assembleExpression(null, fragment));
    } else {
      if (!data) {
        throw Error(
          "Expected data for route fragments containing alternatives and params."
        );
      }
      result.push(
        ...assembleExpression(
          typeof fragment !== "string" &&
          (fragment.isOptional ||
            fragment.type === "alternative" ||
            fragment.type === "capture")
            ? data[fragment.refName]
            : {},
          fragment
        )
      );
    }
  }
  return result;
}
