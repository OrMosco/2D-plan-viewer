"use strict";

jest.mock("../src/utils/dynamodb");
jest.mock("../src/utils/s3");

const { getFileMetadata, deleteFileMetadata } = require("../src/utils/dynamodb");
const { deleteS3Object } = require("../src/utils/s3");
const { handler } = require("../src/handlers/delete");

const SAMPLE_METADATA = {
  projectId: "proj1",
  fileId: "file-uuid-1",
  fileName: "blueprint.pdf",
  s3Key: "proj1/pdf/file-uuid-1/blueprint.pdf",
};

beforeEach(() => {
  jest.resetAllMocks();
  getFileMetadata.mockResolvedValue(SAMPLE_METADATA);
  deleteS3Object.mockResolvedValue();
  deleteFileMetadata.mockResolvedValue();
});

const makeEvent = (overrides = {}) => ({
  pathParameters: { projectId: "proj1", fileId: "file-uuid-1" },
  ...overrides,
});

describe("delete handler", () => {
  it("returns 200 on successful deletion", async () => {
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.message).toMatch(/deleted successfully/i);
    expect(body.fileId).toBe("file-uuid-1");
  });

  it("deletes the S3 object and DynamoDB record", async () => {
    await handler(makeEvent());
    expect(deleteS3Object).toHaveBeenCalledWith(SAMPLE_METADATA.s3Key);
    expect(deleteFileMetadata).toHaveBeenCalledWith("proj1", "file-uuid-1");
  });

  it("returns 404 when the file does not exist", async () => {
    getFileMetadata.mockResolvedValue(null);
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(404);
    expect(deleteS3Object).not.toHaveBeenCalled();
    expect(deleteFileMetadata).not.toHaveBeenCalled();
  });

  it("returns 400 when pathParameters are missing", async () => {
    const res = await handler({ pathParameters: {} });
    expect(res.statusCode).toBe(400);
  });

  it("returns 500 when S3 deletion throws", async () => {
    deleteS3Object.mockRejectedValue(new Error("S3 error"));
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(500);
    // DynamoDB record must NOT be removed if S3 deletion failed
    expect(deleteFileMetadata).not.toHaveBeenCalled();
  });
});
