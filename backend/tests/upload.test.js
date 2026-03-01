"use strict";

// ── Mock AWS modules before requiring the handler ──────────────────────────
jest.mock("../src/utils/dynamodb");
jest.mock("../src/utils/s3");

const { putFileMetadata } = require("../src/utils/dynamodb");
const { buildS3Key, getUploadPresignedUrl } = require("../src/utils/s3");
const { handler } = require("../src/handlers/upload");

const PRESIGNED_URL = "https://s3.example.com/presigned-put";

beforeEach(() => {
  jest.resetAllMocks();
  process.env.PRESIGNED_URL_TTL = "900";
  process.env.FILES_TABLE = "test-table";
  process.env.FILES_BUCKET = "test-bucket";

  buildS3Key.mockReturnValue("proj1/pdf/uuid/file.pdf");
  getUploadPresignedUrl.mockResolvedValue(PRESIGNED_URL);
  putFileMetadata.mockResolvedValue();
});

const makeEvent = (overrides = {}) => ({
  pathParameters: { projectId: "proj1" },
  body: JSON.stringify({ fileName: "blueprint.pdf", size: 1024 }),
  requestContext: { authorizer: { claims: { sub: "user-123" } } },
  ...overrides,
});

describe("upload handler", () => {
  it("returns 201 with uploadUrl for a valid request", async () => {
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.uploadUrl).toBe(PRESIGNED_URL);
    expect(body.fileId).toBeDefined();
    expect(body.expiresIn).toBe(900);
  });

  it("stores metadata in DynamoDB", async () => {
    await handler(makeEvent());
    expect(putFileMetadata).toHaveBeenCalledTimes(1);
    const stored = putFileMetadata.mock.calls[0][0];
    expect(stored.projectId).toBe("proj1");
    expect(stored.fileName).toBe("blueprint.pdf");
    expect(stored.fileExtension).toBe("pdf");
    expect(stored.uploadedBy).toBe("user-123");
  });

  it("returns 400 for a missing projectId", async () => {
    const res = await handler({ ...makeEvent(), pathParameters: {} });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for an unsupported file type", async () => {
    const res = await handler(
      makeEvent({ body: JSON.stringify({ fileName: "hack.sh", size: 1024 }) })
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/unsupported file type/i);
  });

  it("returns 400 for an invalid file size", async () => {
    const res = await handler(
      makeEvent({ body: JSON.stringify({ fileName: "plan.pdf", size: -5 }) })
    );
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for malformed JSON body", async () => {
    const res = await handler(makeEvent({ body: "not-json" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 500 when DynamoDB throws", async () => {
    putFileMetadata.mockRejectedValue(new Error("DynamoDB error"));
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(500);
  });
});
