"use strict";

const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const BUCKET_NAME = process.env.FILES_BUCKET;
const TTL = parseInt(process.env.PRESIGNED_URL_TTL || "900", 10);

const s3Client = new S3Client({});

/**
 * Builds the S3 object key for a file.
 * Pattern: {projectId}/{fileExtension}/{fileId}/{fileName}
 *
 * @param {string} projectId
 * @param {string} fileExtension
 * @param {string} fileId
 * @param {string} fileName
 * @returns {string}
 */
function buildS3Key(projectId, fileExtension, fileId, fileName) {
  return `${projectId}/${fileExtension}/${fileId}/${fileName}`;
}

/**
 * Generates a pre-signed PUT URL for direct browser-to-S3 upload.
 *
 * @param {string} s3Key
 * @param {string} contentType  MIME type of the file
 * @returns {Promise<string>}
 */
async function getUploadPresignedUrl(s3Key, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
    ServerSideEncryption: "aws:kms",
  });
  return getSignedUrl(s3Client, command, { expiresIn: TTL });
}

/**
 * Generates a pre-signed GET URL for direct browser-from-S3 download.
 *
 * @param {string} s3Key
 * @param {string} fileName  Original file name (used for Content-Disposition header)
 * @returns {Promise<string>}
 */
async function getDownloadPresignedUrl(s3Key, fileName) {
  const encodedFileName = encodeURIComponent(fileName);
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ResponseContentDisposition: `attachment; filename="${encodedFileName}"`,
  });
  return getSignedUrl(s3Client, command, { expiresIn: TTL });
}

/**
 * Deletes an object from S3.
 *
 * @param {string} s3Key
 * @returns {Promise<void>}
 */
async function deleteS3Object(s3Key) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })
  );
}

module.exports = { buildS3Key, getUploadPresignedUrl, getDownloadPresignedUrl, deleteS3Object };
