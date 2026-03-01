"use strict";

/**
 * Allowed file extensions and their corresponding MIME types.
 * Extend this list as project requirements grow.
 */
const ALLOWED_FILE_TYPES = {
  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",

  // Images
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  tiff: "image/tiff",

  // CAD / Architectural
  dwg: "application/acad",
  dxf: "application/dxf",
  ifc: "application/x-step",

  // Archives
  zip: "application/zip",
  "7z": "application/x-7z-compressed",

  // Video
  mp4: "video/mp4",
  mov: "video/quicktime",
};

/**
 * Maximum allowed file size: 500 MB
 */
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

/**
 * Returns the extension for a given file name (lower-cased).
 * @param {string} fileName
 * @returns {string}
 */
function getExtension(fileName) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Validates that the file extension is in the allowed list.
 * @param {string} fileName
 * @returns {{ valid: boolean, extension: string, mimeType: string|null }}
 */
function validateFileType(fileName) {
  const extension = getExtension(fileName);
  const mimeType = ALLOWED_FILE_TYPES[extension] || null;
  return { valid: Boolean(mimeType), extension, mimeType };
}

/**
 * Validates the file size against the maximum allowed.
 * @param {number} size  File size in bytes
 * @returns {boolean}
 */
function validateFileSize(size) {
  return Number.isInteger(size) && size > 0 && size <= MAX_FILE_SIZE_BYTES;
}

module.exports = { validateFileType, validateFileSize, getExtension, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES };
