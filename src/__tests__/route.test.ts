import { r, parse, assemble } from "..";
import { RouteExpressionResult } from "../parser";

describe("route parsing", () => {
  test("empty route", () => {
    const route = r();
    expect(parse("", route)).toEqual({});
    expect(parse("anything", route)).toEqual(null);
  });

  test("static route", () => {
    const route = r("portal");
    expect(parse("portal", route)).toEqual({});
    expect(parse("/portal", route)).toEqual({});
    expect(parse("portal/", route)).toEqual({});
    expect(parse("/portal/", route)).toEqual({});
    expect(parse("portal/blah", route)).toBe(null);
    expect(parse("froofty", route)).toBe(null);
  });

  test("param route", () => {
    const route = r("static", r.param("myParam"));
    expect(parse("static/hello", route)).toEqual({ myParam: "hello" });
    expect(parse("static/hello/", route)).toEqual({ myParam: "hello" });
    expect(parse("static/", route)).toEqual(null);
    expect(parse("static", route)).toEqual(null);
    expect(parse("static/hello/notExpected", route)).toEqual(null);
    expect(parse("hello", route)).toEqual(null);
  });

  test("optional param route", () => {
    const route = r("static", r.param("myParam").optional());
    expect(parse("static/hello", route)).toEqual({ myParam: "hello" });
    expect(parse("static/hello/", route)).toEqual({ myParam: "hello" });
    expect(parse("static/", route)).toEqual({ myParam: null });
    expect(parse("static", route)).toEqual({ myParam: null });
    expect(parse("static/hello/notExpected", route)).toEqual(null);
    expect(parse("hello", route)).toEqual(null);
  });

  test("alternative routes", () => {
    const route = r(
      "static",
      r.oneOf("choice", {
        foo: r("my-foo"),
        bar: r("my-bar", r.param("bar-param")),
        baz: r("my-baz", r.param("baz-param").optional())
      })
    );

    expect(parse("static/my-foo", route)).toEqual({
      choice: { result: "foo", data: {} }
    });
    expect(parse("static/my-bar/1234", route)).toEqual({
      choice: { result: "bar", data: { "bar-param": "1234" } }
    });
    expect(parse("static/my-bar", route)).toBe(null);
    expect(parse("static/my-baz/1234", route)).toEqual({
      choice: { result: "baz", data: { "baz-param": "1234" } }
    });
    expect(parse("static/my-baz", route)).toEqual({
      choice: { result: "baz", data: { "baz-param": null } }
    });
    expect(parse("static", route)).toBe(null);
  });

  test("optional alternative route", () => {
    const route = r(
      "static",
      r
        .oneOf("choice", {
          foo: r("my-foo"),
          bar: r("my-bar", r.param("bar-param"))
        })
        .optional()
    );

    expect(parse("static/my-foo", route)).toEqual({
      choice: { result: "foo", data: {} }
    });
    expect(parse("static/my-bar/1234", route)).toEqual({
      choice: { result: "bar", data: { "bar-param": "1234" } }
    });
    expect(parse("static/my-bar", route)).toBe(null);
    expect(parse("static", route)).toEqual({ choice: null });
  });

  test("optional route fragment", () => {
    const route = r("static", r("maybe").optional("my-optional"));
    expect(parse("static", route)).toEqual({ "my-optional": null });
    expect(parse("static/maybe", route)).toEqual({ "my-optional": {} });
    expect(parse("static/something-else", route)).toBe(null);
    expect(parse("maybe", route)).toBe(null);
  });
});

describe("route asembly", () => {
  test("empty route", () => {
    const route = r();
    expect(assemble(route, {})).toBe("");
    expect(assemble(route, null)).toBe("");
    expect(assemble(route, true)).toBe("");
    expect(assemble(route, false)).toBe("");
  });

  test("static route", () => {
    const route = r("portal");
    expect(assemble(route, {})).toBe("portal");
    expect(assemble(route, null)).toBe("portal");
    expect(assemble(route, true)).toBe("portal");
    expect(assemble(route, false)).toBe("portal");
  });

  test("param route", () => {
    const route = r("static", r.param("myParam"));
    expect(assemble(route, { myParam: "hello" })).toBe("static/hello");
  });

  test("optional param route", () => {
    const route = r("static", r.param("myParam").optional());
    expect(assemble(route, { myParam: "hello" })).toBe("static/hello");
    expect(assemble(route, { myParam: null })).toBe("static");
  });

  test("alternative routes", () => {
    const route = r(
      "static",
      r.oneOf("choice", {
        foo: r("my-foo"),
        bar: r("my-bar", r.param("bar-param")),
        baz: r("my-baz", r.param("baz-param").optional())
      })
    );

    expect(assemble(route, { choice: { result: "foo", data: {} } })).toEqual(
      "static/my-foo"
    );

    expect(
      assemble(route, {
        choice: { result: "bar", data: { "bar-param": "1234" } }
      })
    ).toBe("static/my-bar/1234");

    expect(
      assemble(route, {
        choice: { result: "baz", data: { "baz-param": "1234" } }
      })
    ).toBe("static/my-baz/1234");

    expect(
      assemble(route, {
        choice: { result: "baz", data: { "baz-param": null } }
      })
    ).toBe("static/my-baz");
  });

  test("optional alternative route", () => {
    const route = r(
      "static",
      r
        .oneOf("choice", {
          foo: r("my-foo"),
          bar: r("my-bar", r.param("bar-param"))
        })
        .optional()
    );

    expect(assemble(route, { choice: { result: "foo", data: {} } })).toEqual(
      "static/my-foo"
    );

    expect(
      assemble(route, {
        choice: { result: "bar", data: { "bar-param": "1234" } }
      })
    ).toBe("static/my-bar/1234");

    expect(assemble(route, { choice: null })).toBe("static");
    expect(assemble(route, { choice: null })).toBe("static");
  });

  test("optional route fragment", () => {
    const route = r("static", r("maybe").optional("my-optional"));
    expect(assemble(route, { "my-optional": {} })).toBe("static/maybe");
    expect(assemble(route, { "my-optional": true })).toBe("static/maybe");

    expect(assemble(route, { "my-optional": false })).toBe("static");
    expect(assemble(route, { "my-optional": null })).toBe("static");
    expect(assemble(route, { "my-optional": void 0 })).toBe("static");
  });
});
