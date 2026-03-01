"use strict";

const { v4: uuidv4 } = require("uuid");
const { validateFileType, validateFileSize } = require("../utils/fileValidation");
const { putFileMetadata } = require("../utils/dynamodb");
const { buildS3Key, getUploadPresignedUrl } = require("../utils/s3");
const { created, badRequest, internalError } = require("../utils/response");

/**
 * POST /projects/{projectId}/files
 *
 * Request body (JSON):
 *   {
 *     "fileName": "blueprint.pdf",
 *     "size": 204800
 *   }
 *
 * Response (201):
 *   {
 *     "fileId":    "<uuid>",
 *     "uploadUrl": "<pre-signed S3 PUT URL>",
 *     "expiresIn": 900
 *   }
 */
exports.handler = async (event) => {
  try {
    const projectId = event.pathParameters?.projectId;
    if (!projectId) {
      return badRequest("Missing required path parameter: projectId");
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return badRequest("Invalid JSON body");
    }

    const { fileName, size } = body;

    if (!fileName || typeof fileName !== "string") {
      return badRequest("Missing or invalid field: fileName");
    }

    const { valid, extension, mimeType } = validateFileType(fileName);
    if (!valid) {
      return badRequest(`Unsupported file type: .${extension}`);
    }

    if (size !== undefined && !validateFileSize(size)) {
      return badRequest("Invalid file size. Must be a positive integer ≤ 500 MB.");
    }

    // Extract the authenticated user's ID from the Cognito authorizer context.
    const uploadedBy =
      event.requestContext?.authorizer?.claims?.sub ||
      event.requestContext?.authorizer?.principalId ||
      "unknown";

    const fileId = uuidv4();
    const uploadedAt = new Date().toISOString();
    const s3Key = buildS3Key(projectId, extension, fileId, fileName);

    // Generate pre-signed upload URL.
    const uploadUrl = await getUploadPresignedUrl(s3Key, mimeType);

    // Persist metadata.
    const metadata = {
      projectId,
      fileId,
      fileName,
      fileExtension: extension,
      fileType: mimeType,
      s3Key,
      size: size || null,
      uploadedAt,
      uploadedBy,
    };
    await putFileMetadata(metadata);

    return created({
      fileId,
      uploadUrl,
      expiresIn: parseInt(process.env.PRESIGNED_URL_TTL || "900", 10),
    });
  } catch (err) {
    console.error("upload handler error", err);
    return internalError("An unexpected error occurred");
  }
};
