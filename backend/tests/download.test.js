"use strict";

jest.mock("../src/utils/dynamodb");
jest.mock("../src/utils/s3");

const { getFileMetadata } = require("../src/utils/dynamodb");
const { getDownloadPresignedUrl } = require("../src/utils/s3");
const { handler } = require("../src/handlers/download");

const SAMPLE_METADATA = {
  projectId: "proj1",
  fileId: "file-uuid-1",
  fileName: "blueprint.pdf",
  fileExtension: "pdf",
  fileType: "application/pdf",
  s3Key: "proj1/pdf/file-uuid-1/blueprint.pdf",
  size: 204800,
  uploadedAt: "2026-03-01T10:00:00.000Z",
  uploadedBy: "user-123",
};

const DOWNLOAD_URL = "https://s3.example.com/presigned-get";

beforeEach(() => {
  jest.resetAllMocks();
  process.env.PRESIGNED_URL_TTL = "900";
  getFileMetadata.mockResolvedValue(SAMPLE_METADATA);
  getDownloadPresignedUrl.mockResolvedValue(DOWNLOAD_URL);
});

const makeEvent = (overrides = {}) => ({
  pathParameters: { projectId: "proj1", fileId: "file-uuid-1" },
  ...overrides,
});

describe("download handler", () => {
  it("returns 200 with downloadUrl and metadata", async () => {
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.downloadUrl).toBe(DOWNLOAD_URL);
    expect(body.fileId).toBe("file-uuid-1");
    expect(body.expiresIn).toBe(900);
  });

  it("strips s3Key from the public response", async () => {
    const res = await handler(makeEvent());
    const body = JSON.parse(res.body);
    expect(body.s3Key).toBeUndefined();
  });

  it("returns 404 when the file does not exist", async () => {
    getFileMetadata.mockResolvedValue(null);
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 when pathParameters are missing", async () => {
    const res = await handler({ pathParameters: {} });
    expect(res.statusCode).toBe(400);
  });

  it("returns 500 when DynamoDB throws", async () => {
    getFileMetadata.mockRejectedValue(new Error("DB error"));
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(500);
  });
});
