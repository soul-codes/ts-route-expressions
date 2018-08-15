export type RouteRefName = string;

export function routeCapture<TRef extends RouteRefName>(
  refName: TRef,
  leadingName?: string
): RouteCapture<TRef> {
  const expr = {
    type: "capture" as "capture",
    refName,
    leadingName,
    isOptional: false as false
  };
  return { ...expr, optional: () => ({ ...expr, isOptional: true }) };
}

export function routeAlternate<
  TRef extends RouteRefName,
  TAlternatives extends RouteExpressionHash<AlternativeRouteExpression>
>(
  refName: TRef,
  alternatives: TAlternatives
): RouteAlternative<TRef, TAlternatives> {
  const expr = {
    type: "alternative" as "alternative",
    refName,
    alternatives,
    isOptional: false as false
  };
  return { ...expr, optional: () => ({ ...expr, isOptional: true }) };
}

type $RefHash<T extends RouteExpression> = T extends { refName: infer R }
  ? (R extends string
      ? { [key in R]: T }
      : T extends RouteFragments<infer TRefs> ? TRefs : {})
  : {};

export interface RouteFragmentFunction {
  <
    A extends TopLevelRouteExpression,
    B extends TopLevelRouteExpression = A,
    C extends TopLevelRouteExpression = B,
    D extends TopLevelRouteExpression = C,
    E extends TopLevelRouteExpression = D,
    F extends TopLevelRouteExpression = E,
    G extends TopLevelRouteExpression = F,
    H extends TopLevelRouteExpression = G,
    I extends TopLevelRouteExpression = H,
    J extends TopLevelRouteExpression = I,
    K extends TopLevelRouteExpression = J
  >(
    a?: A,
    b?: B,
    c?: C,
    d?: D,
    e?: E,
    f?: F,
    g?: G,
    h?: H,
    i?: I,
    j?: J,
    k?: K
  ): RouteFragments<
    $RefHash<A> &
      $RefHash<B> &
      $RefHash<C> &
      $RefHash<D> &
      $RefHash<E> &
      $RefHash<F> &
      $RefHash<G> &
      $RefHash<H> &
      $RefHash<I> &
      $RefHash<J> &
      $RefHash<K> & {}
  >;
}

export const routeFragments: RouteFragmentFunction = function(
  a,
  b,
  c,
  d,
  e,
  f,
  g,
  h,
  i,
  j,
  k
) {
  const expr = {
    type: "fragments" as "fragments",
    fragments: [a, b, c, d, e, f, g, h, i, j, k].filter(
      Boolean
    ) as RouteExpression[],
    refs: null as any,
    isOptional: false as false
  };

  return {
    ...expr,
    optional: <TRef extends RouteRefName>(refName: TRef) => ({
      ...expr,
      isOptional: true as true,
      refName
    })
  };
};

export type TopLevelRouteExpression =
  | string
  | RouteCapture<any>
  | OptionalRouteCapture<any>
  | RouteAlternative<any, any>
  | OptionalRouteAlternative<any, any>
  | OptionalRouteFragments<any, any>;

export type AlternativeRouteExpression =
  | string
  | RouteCapture<any>
  | OptionalRouteCapture<any>
  | RouteFragments<any>;

export type RouteExpression =
  | string
  | RouteCapture<any>
  | OptionalRouteCapture<any>
  | RouteAlternative<any, any>
  | OptionalRouteAlternative<any, any>
  | RouteFragments<any>
  | OptionalRouteFragments<any, any>;

interface BaseRouteCapture<TRef extends RouteRefName> {
  type: "capture";
  refName: TRef;
  leadingName?: string;
}

export interface RouteCapture<TRef extends RouteRefName>
  extends BaseRouteCapture<TRef> {
  optional(): OptionalRouteCapture<TRef>;
  isOptional: false;
}

export interface OptionalRouteCapture<TRef extends RouteRefName>
  extends BaseRouteCapture<TRef> {
  isOptional: true;
}

interface BaseRouteAlternative<
  TRef extends RouteRefName,
  TAlternatives extends RouteExpressionHash
> {
  type: "alternative";
  refName: TRef;
  alternatives: TAlternatives;
}

export interface RouteAlternative<
  TRef extends RouteRefName,
  TAlternatives extends RouteExpressionHash
> extends BaseRouteAlternative<TRef, TAlternatives> {
  optional(): OptionalRouteAlternative<TRef, TAlternatives>;
  isOptional: false;
}

export interface OptionalRouteAlternative<
  TRef extends RouteRefName,
  TAlternatives extends RouteExpressionHash
> extends BaseRouteAlternative<TRef, TAlternatives> {
  isOptional: true;
}

interface BaseRouteFragments<TRefs extends RouteExpressionHash> {
  type: "fragments";
  fragments: RouteExpression[];
  refs: TRefs;
}

export interface RouteFragments<TRefs extends RouteExpressionHash>
  extends BaseRouteFragments<TRefs> {
  optional<TRef extends RouteRefName>(
    refName: TRef
  ): OptionalRouteFragments<TRef, TRefs>;
  isOptional: false;
}

export interface OptionalRouteFragments<
  TRef extends RouteRefName,
  TRefs extends RouteExpressionHash
> extends BaseRouteFragments<TRefs> {
  refName: TRef;
  isOptional: true;
}

export type RouteExpressionHash<T extends RouteExpression = RouteExpression> = {
  [refName: string]: T;
};
