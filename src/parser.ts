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

export default function parse<
  T extends RouteFragments<RouteExpressionHash | {}>
>(text: string, route: T) {
  const split = text.split("/").filter(Boolean);
  return innerParse(split, route);
}

function innerParse<T extends RouteFragments<RouteExpressionHash>>(
  text: string[],
  route: T
): null | RouteExpressionResult<T> {
  const result = parseFragments(text, route, { i: 0 });
  return (result || null) as RouteExpressionResult<T> | null;
}

function parseExpression(
  text: string[],
  expression: RouteExpression,
  state: MatchState
) {
  if (typeof expression === "string") {
    return parseStatic(text, expression, state);
  } else if (expression.type === "capture") {
    return parseCapture(text, expression, state);
  } else if (expression.type === "alternative") {
    return parseAlternative(text, expression, state);
  } else if (expression.type === "fragments") {
    return expression.isOptional
      ? parseFragments(text, expression, state)
      : parseFragments(text, expression, state);
  }
  return false;
}

function parseStatic(text: string[], expression: string, state: MatchState) {
  if (expression !== text[state.i]) return false;
  state.i++;
  return {};
}

function parseCapture(
  text: string[],
  expression: RouteCapture<RouteRefName> | OptionalRouteCapture<RouteRefName>,
  state: MatchState
): { [refName: string]: CaptureResult } | false {
  const size = expression.leadingName ? 2 : 1;
  if (state.i + size > text.length)
    return expression.isOptional ? { [expression.refName]: null } : false;
  if (expression.leadingName && text[state.i] !== expression.leadingName)
    return { [expression.refName]: null };

  const result = text[state.i + size - 1];
  state.i += size;
  return { [expression.refName]: result };
}

function parseAlternative(
  test: string[],
  expression:
    | RouteAlternative<RouteRefName, RouteExpressionHash>
    | OptionalRouteAlternative<RouteRefName, RouteExpressionHash>,
  state: MatchState
): { [refName: string]: AlternativeResult } | false {
  const { alternatives } = expression;
  for (let key in alternatives) {
    const alternative = alternatives[key];
    const tryState = { ...state };
    const result = parseExpression(test, alternative, tryState);
    if (result === false) continue;

    Object.assign(state, tryState);
    return {
      [expression.refName]: {
        result: key,
        data: result
      }
    };
  }
  return expression.isOptional ? { [expression.refName]: null } : false;
}

function parseFragments(
  text: string[],
  expression: OptionalRouteFragments<RouteRefName, RouteExpressionHash>,
  state: MatchState
): { [refName: string]: GenericHashResult } | false;
function parseFragments(
  text: string[],
  expression: RouteFragments<RouteExpressionHash>,
  state: MatchState
): GenericHashResult | false;
function parseFragments(
  text: string[],
  expression:
    | OptionalRouteFragments<RouteRefName, RouteExpressionHash>
    | RouteFragments<RouteExpressionHash>,
  state: MatchState
): { [refName: string]: GenericHashResult } | GenericHashResult | false {
  const { fragments } = expression;
  const results: GenericHashResult = Object.create(null);
  const tryState = { ...state };

  for (let i = 0, length = fragments.length; i < length; i++) {
    const fragment = fragments[i];
    const result = parseExpression(text, fragment, tryState);
    if (result === false)
      return expression.isOptional ? { [expression.refName]: null } : false;

    Object.assign(results, result);
  }

  if (tryState.i !== text.length) return false;
  Object.assign(state, tryState);
  return expression.isOptional ? { [expression.refName]: results } : results;
}
interface MatchState {
  i: number;
}

type RouteExpressionHashResult<TRefHash extends RouteExpressionHash> = {
  [key in keyof TRefHash]: RouteExpressionResult<TRefHash[key]>
};

export type RouteExpressionResult<
  TExpression extends RouteExpression | RouteFragments<any>
> = TExpression extends RouteCapture<any>
  ? string
  : TExpression extends OptionalRouteCapture<any>
    ? string | null
    : TExpression extends RouteAlternative<any, infer TAlternatives>
      ? AlternativeResults<TAlternatives>
      : TExpression extends OptionalRouteAlternative<any, infer TAlternatives>
        ? AlternativeResults<TAlternatives> | null
        : TExpression extends OptionalRouteFragments<any, infer TSubRefs>
          ? RouteExpressionHashResult<TSubRefs> | null
          : TExpression extends OptionalRouteFragments<any, any>
            ? any | null
            : TExpression extends RouteFragments<infer TSubRefs>
              ? RouteExpressionHashResult<TSubRefs>
              : TExpression extends RouteFragments<{}> ? any : never;

type AlternativeResults<T extends RouteExpressionHash> = $UnionIntersections<
  $AlternativeResults<T>
>;
type $AlternativeResults<T extends RouteExpressionHash> = {
  [key in keyof T]: {
    result: key;
    data: T[key] extends RouteExpression
      ? RouteExpressionResult<T[key]>
      : never;
  }
};
type $UnionIntersections<T> = T[keyof T];

export type StaticResult = true;
export type CaptureResult = string | null;
export type AlternativeResult = {
  result: RouteRefName;
  data: GenericHashResult;
} | null;
export type GenericHashResult = {
  [key: string]:
    | GenericHashResult
    | CaptureResult
    | AlternativeResult
    | StaticResult;
} | null;
