"use strict";

const { listFilesByProject } = require("../utils/dynamodb");
const { ok, badRequest, internalError } = require("../utils/response");

/**
 * GET /projects/{projectId}/files
 *
 * Query parameters (optional):
 *   type      – file extension filter, e.g. "pdf", "png"
 *   nextKey   – pagination cursor returned by the previous response
 *
 * Response (200):
 *   {
 *     "items": [
 *       {
 *         "fileId":        "<uuid>",
 *         "fileName":      "blueprint.pdf",
 *         "fileExtension": "pdf",
 *         "fileType":      "application/pdf",
 *         "size":          204800,
 *         "uploadedAt":    "2026-03-01T10:00:00.000Z",
 *         "uploadedBy":    "<cognito-sub>"
 *       },
 *       ...
 *     ],
 *     "nextKey": "<base64-cursor or null>"
 *   }
 */
exports.handler = async (event) => {
  try {
    const projectId = event.pathParameters?.projectId;
    if (!projectId) {
      return badRequest("Missing required path parameter: projectId");
    }

    const fileExtension = event.queryStringParameters?.type || null;
    const lastEvaluatedKey = event.queryStringParameters?.nextKey || null;

    const { items, nextKey } = await listFilesByProject(projectId, fileExtension, lastEvaluatedKey);

    // Strip the internal s3Key from the public response.
    const publicItems = items.map(({ s3Key: _s3Key, ...rest }) => rest);

    return ok({ items: publicItems, nextKey });
  } catch (err) {
    console.error("list handler error", err);
    return internalError("An unexpected error occurred");
  }
};
