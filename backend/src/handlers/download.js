"use strict";

const { getFileMetadata } = require("../utils/dynamodb");
const { getDownloadPresignedUrl } = require("../utils/s3");
const { ok, badRequest, notFound, internalError } = require("../utils/response");

/**
 * GET /projects/{projectId}/files/{fileId}
 *
 * Response (200):
 *   {
 *     "fileId":      "<uuid>",
 *     "fileName":    "blueprint.pdf",
 *     "fileType":    "application/pdf",
 *     "size":        204800,
 *     "uploadedAt":  "2026-03-01T10:00:00.000Z",
 *     "downloadUrl": "<pre-signed S3 GET URL>",
 *     "expiresIn":   900
 *   }
 */
exports.handler = async (event) => {
  try {
    const { projectId, fileId } = event.pathParameters || {};

    if (!projectId || !fileId) {
      return badRequest("Missing required path parameters: projectId and fileId");
    }

    const metadata = await getFileMetadata(projectId, fileId);
    if (!metadata) {
      return notFound(`File not found: ${fileId}`);
    }

    const downloadUrl = await getDownloadPresignedUrl(metadata.s3Key, metadata.fileName);

    const { s3Key: _s3Key, ...publicMetadata } = metadata;

    return ok({
      ...publicMetadata,
      downloadUrl,
      expiresIn: parseInt(process.env.PRESIGNED_URL_TTL || "900", 10),
    });
  } catch (err) {
    console.error("download handler error", err);
    return internalError("An unexpected error occurred");
  }
};
