# File Management Service 📁

> **Assignment 2** – AWS Serverless architecture for multi-project, multi-type file upload/download.

---

## Overview

A fully serverless REST API that lets users:

| Action | Route | Description |
|--------|-------|-------------|
| **Upload** | `POST /projects/{projectId}/files` | Request a pre-signed S3 PUT URL and register metadata |
| **List** | `GET /projects/{projectId}/files[?type=pdf]` | List files for a project, optionally filtered by type |
| **Download** | `GET /projects/{projectId}/files/{fileId}` | Get a pre-signed S3 GET URL |
| **Delete** | `DELETE /projects/{projectId}/files/{fileId}` | Remove a file from storage and metadata store |

Authentication is handled by **AWS Cognito** – every route requires a valid JWT (`Authorization: Bearer <token>`).

---

## Architecture

See [`../architecture/AWS-Architecture.md`](../architecture/AWS-Architecture.md) for the full diagram and component descriptions.

```
Client → API Gateway (Cognito JWT) → Lambda Functions
                                          ↓           ↓
                                       DynamoDB     S3 (pre-signed URLs)
```

### AWS Services Used

| Service | Purpose |
|---------|---------|
| **API Gateway** | REST API entry-point with Cognito JWT authorizer |
| **AWS Lambda** | Serverless compute for each operation (Node.js 20.x) |
| **Amazon S3** | Durable file storage (versioned, KMS encrypted, no public access) |
| **Amazon DynamoDB** | File metadata store (on-demand, PITR enabled) |
| **AWS Cognito** | User authentication & authorization |
| **CloudWatch** | Logs, metrics, and alarms |
| **AWS X-Ray** | Distributed tracing |

---

## Prerequisites

- Node.js ≥ 20
- AWS CLI configured (`aws configure`)
- Serverless Framework v3: `npm install -g serverless`

---

## Getting Started

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Run tests
npm test

# 3. Deploy to AWS (dev stage)
npm run deploy

# 4. Deploy to production
npm run deploy:prod

# 5. Run locally (requires serverless-offline)
npm run local
```

---

## Environment Variables (set automatically by Serverless)

| Variable | Description |
|----------|-------------|
| `FILES_TABLE` | DynamoDB table name |
| `FILES_BUCKET` | S3 bucket name |
| `PRESIGNED_URL_TTL` | Pre-signed URL expiry in seconds (default: 900) |
| `STAGE` | Deployment stage (`dev` / `prod`) |

---

## API Reference

### Upload a File

```http
POST /projects/{projectId}/files
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "fileName": "blueprint.pdf",
  "size": 204800
}
```

**Response 201:**
```json
{
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "uploadUrl": "https://s3.amazonaws.com/...",
  "expiresIn": 900
}
```

The client then uploads the file binary directly to `uploadUrl` using an HTTP `PUT` request.

---

### List Files

```http
GET /projects/{projectId}/files?type=pdf&nextKey=<cursor>
Authorization: Bearer <JWT>
```

**Response 200:**
```json
{
  "items": [
    {
      "fileId": "...",
      "fileName": "blueprint.pdf",
      "fileExtension": "pdf",
      "fileType": "application/pdf",
      "size": 204800,
      "uploadedAt": "2026-03-01T10:00:00.000Z",
      "uploadedBy": "<cognito-sub>"
    }
  ],
  "nextKey": null
}
```

Use `nextKey` from the response as `?nextKey=<value>` to fetch the next page.

---

### Download a File

```http
GET /projects/{projectId}/files/{fileId}
Authorization: Bearer <JWT>
```

**Response 200:**
```json
{
  "fileId": "...",
  "fileName": "blueprint.pdf",
  "fileType": "application/pdf",
  "size": 204800,
  "uploadedAt": "2026-03-01T10:00:00.000Z",
  "downloadUrl": "https://s3.amazonaws.com/...",
  "expiresIn": 900
}
```

The client opens `downloadUrl` directly to download the file.

---

### Delete a File

```http
DELETE /projects/{projectId}/files/{fileId}
Authorization: Bearer <JWT>
```

**Response 200:**
```json
{
  "message": "File deleted successfully",
  "fileId": "..."
}
```

---

## Supported File Types

| Category | Extensions |
|----------|------------|
| Documents | `pdf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `txt`, `csv` |
| Images | `png`, `jpg`, `jpeg`, `gif`, `svg`, `webp`, `tiff` |
| CAD / Architectural | `dwg`, `dxf`, `ifc` |
| Archives | `zip`, `7z` |
| Video | `mp4`, `mov` |

Maximum file size: **500 MB**

---

## DynamoDB Schema

**Table:** `file-management-service-files-{stage}`

| Attribute | Key Type | Description |
|-----------|----------|-------------|
| `projectId` | Partition Key | Project identifier |
| `fileId` | Sort Key | UUID v4 – unique file ID |
| `fileName` | – | Original file name |
| `fileExtension` | – | Lowercase extension (e.g. `pdf`) |
| `fileType` | – | MIME type |
| `s3Key` | – | Full S3 object key |
| `size` | – | File size in bytes |
| `uploadedAt` | – | ISO 8601 upload timestamp |
| `uploadedBy` | – | Cognito `sub` of the uploader |

**GSI:** `fileExtension-uploadedAt-index` – enables efficient type filtering.

---

## S3 Object Key Pattern

```
{projectId}/{fileExtension}/{fileId}/{fileName}
```

Example: `acme-towers/pdf/550e8400-e29b-41d4-a716-446655440000/blueprint.pdf`

---

## Security

- All API routes require a Cognito JWT.
- Files are **never publicly accessible** – only via short-lived (15 min) pre-signed URLs.
- S3 bucket has **Block Public Access** fully enabled.
- Server-side encryption with **AWS KMS** for both S3 and DynamoDB.
- Lambda functions use **least-privilege IAM roles**.

---

## Testing

```bash
npm test              # Run all tests with coverage
npm test -- --watch   # Watch mode
```

Coverage targets: handlers (≥ 95%), utils (≥ 80%).
