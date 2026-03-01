"use strict";

jest.mock("../src/utils/dynamodb");
jest.mock("../src/utils/s3");

const { listFilesByProject } = require("../src/utils/dynamodb");
const { handler } = require("../src/handlers/list");

const SAMPLE_ITEMS = [
  {
    projectId: "proj1",
    fileId: "file-uuid-1",
    fileName: "plan-a.pdf",
    fileExtension: "pdf",
    fileType: "application/pdf",
    s3Key: "proj1/pdf/file-uuid-1/plan-a.pdf",
    size: 2048,
    uploadedAt: "2026-03-01T10:00:00.000Z",
    uploadedBy: "user-1",
  },
  {
    projectId: "proj1",
    fileId: "file-uuid-2",
    fileName: "elevation.png",
    fileExtension: "png",
    fileType: "image/png",
    s3Key: "proj1/png/file-uuid-2/elevation.png",
    size: 512000,
    uploadedAt: "2026-03-01T11:00:00.000Z",
    uploadedBy: "user-2",
  },
];

beforeEach(() => {
  jest.resetAllMocks();
  listFilesByProject.mockResolvedValue({ items: SAMPLE_ITEMS, nextKey: null });
});

const makeEvent = (overrides = {}) => ({
  pathParameters: { projectId: "proj1" },
  queryStringParameters: null,
  ...overrides,
});

describe("list handler", () => {
  it("returns 200 with items and no nextKey", async () => {
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.items).toHaveLength(2);
    expect(body.nextKey).toBeNull();
  });

  it("strips s3Key from public response", async () => {
    const res = await handler(makeEvent());
    const body = JSON.parse(res.body);
    body.items.forEach((item) => {
      expect(item.s3Key).toBeUndefined();
    });
  });

  it("passes the type filter to listFilesByProject", async () => {
    listFilesByProject.mockResolvedValue({ items: [SAMPLE_ITEMS[0]], nextKey: null });
    const res = await handler(
      makeEvent({ queryStringParameters: { type: "pdf" } })
    );
    expect(res.statusCode).toBe(200);
    expect(listFilesByProject).toHaveBeenCalledWith("proj1", "pdf", null);
  });

  it("passes the pagination cursor to listFilesByProject", async () => {
    const cursor = "eyJwcm9qZWN0SWQiOiJwcm9qMSJ9";
    await handler(makeEvent({ queryStringParameters: { nextKey: cursor } }));
    expect(listFilesByProject).toHaveBeenCalledWith("proj1", null, cursor);
  });

  it("returns 400 for a missing projectId", async () => {
    const res = await handler({ ...makeEvent(), pathParameters: {} });
    expect(res.statusCode).toBe(400);
  });

  it("returns 500 when DynamoDB throws", async () => {
    listFilesByProject.mockRejectedValue(new Error("DB error"));
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(500);
  });
});
