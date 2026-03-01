"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.FILES_TABLE;

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Stores file metadata in DynamoDB.
 * @param {object} metadata
 * @returns {Promise<void>}
 */
async function putFileMetadata(metadata) {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: metadata,
    })
  );
}

/**
 * Retrieves file metadata from DynamoDB.
 * @param {string} projectId
 * @param {string} fileId
 * @returns {Promise<object|null>}
 */
async function getFileMetadata(projectId, fileId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { projectId, fileId },
    })
  );
  return result.Item || null;
}

/**
 * Deletes file metadata from DynamoDB.
 * @param {string} projectId
 * @param {string} fileId
 * @returns {Promise<void>}
 */
async function deleteFileMetadata(projectId, fileId) {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { projectId, fileId },
    })
  );
}

/**
 * Lists files for a project, optionally filtered by file extension.
 * Uses the GSI (fileExtension-uploadedAt-index) when a type filter is provided,
 * otherwise queries the main table by projectId.
 *
 * @param {string} projectId
 * @param {string|null} fileExtension  e.g. "pdf", "png"
 * @param {string|null} lastEvaluatedKey  Pagination token (JSON string)
 * @returns {Promise<{ items: object[], nextKey: string|null }>}
 */
async function listFilesByProject(projectId, fileExtension, lastEvaluatedKey) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "projectId = :pid",
    ExpressionAttributeValues: { ":pid": projectId },
    Limit: 50,
  };

  if (fileExtension) {
    // Use the GSI to filter by extension while still scoping to the project.
    // The GSI key is fileExtension (PK) + uploadedAt (SK), so we add a
    // filter expression for projectId to restrict to the requested project.
    params.IndexName = "fileExtension-uploadedAt-index";
    params.KeyConditionExpression = "fileExtension = :ext";
    params.FilterExpression = "projectId = :pid";
    params.ExpressionAttributeValues = {
      ":ext": fileExtension.toLowerCase(),
      ":pid": projectId,
    };
  }

  if (lastEvaluatedKey) {
    params.ExclusiveStartKey = JSON.parse(
      Buffer.from(lastEvaluatedKey, "base64").toString("utf-8")
    );
  }

  const result = await docClient.send(new QueryCommand(params));

  const nextKey = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
    : null;

  return { items: result.Items || [], nextKey };
}

module.exports = { putFileMetadata, getFileMetadata, deleteFileMetadata, listFilesByProject };
