"use strict";

const { response, ok, created, badRequest, notFound, internalError } = require("../src/utils/response");

describe("response helpers", () => {
  it("ok returns 200 with JSON body", () => {
    const res = ok({ message: "success" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ message: "success" });
    expect(res.headers["Content-Type"]).toBe("application/json");
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("created returns 201", () => {
    const res = created({ fileId: "abc" });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).fileId).toBe("abc");
  });

  it("badRequest returns 400 with error field", () => {
    const res = badRequest("bad input");
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("bad input");
  });

  it("notFound returns 404", () => {
    const res = notFound("not here");
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toBe("not here");
  });

  it("internalError returns 500", () => {
    const res = internalError("boom");
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("boom");
  });

  it("accepts a pre-serialised string body", () => {
    const res = response(200, "plain string");
    expect(res.body).toBe("plain string");
  });
});
