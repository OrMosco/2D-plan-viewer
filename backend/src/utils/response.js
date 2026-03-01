"use strict";

/**
 * Builds a standardised API Gateway Lambda proxy response.
 *
 * @param {number} statusCode  HTTP status code
 * @param {object|string} body  Response body (will be JSON-serialised if object)
 * @returns {object} API Gateway response object
 */
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
}

const ok = (body) => response(200, body);
const created = (body) => response(201, body);
const badRequest = (message) => response(400, { error: message });
const notFound = (message) => response(404, { error: message });
const internalError = (message) => response(500, { error: message });

module.exports = { response, ok, created, badRequest, notFound, internalError };
