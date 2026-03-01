"use strict";

const { getFileMetadata, deleteFileMetadata } = require("../utils/dynamodb");
const { deleteS3Object } = require("../utils/s3");
const { ok, badRequest, notFound, internalError } = require("../utils/response");

/**
 * DELETE /projects/{projectId}/files/{fileId}
 *
 * Response (200):
 *   { "message": "File deleted successfully", "fileId": "<uuid>" }
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

    // Delete from S3 first; if that fails the metadata record is preserved.
    await deleteS3Object(metadata.s3Key);

    // Remove metadata record from DynamoDB.
    await deleteFileMetadata(projectId, fileId);

    return ok({ message: "File deleted successfully", fileId });
  } catch (err) {
    console.error("delete handler error", err);
    return internalError("An unexpected error occurred");
  }
};
