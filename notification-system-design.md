# Notification System Design

# Stage 1

## Overview

This document defines the REST API contract for the Notification Platform. It is written for a front-end developer colleague who needs to integrate notification display for logged-in students. All endpoints are protected and require a Bearer token in the Authorization header. Authentication is pre-handled — no login or registration flow is needed on the client.

Notifications support three types: `Event`, `Result`, and `Placement`.

---

## Core Actions the Platform Must Support

1. Fetch all notifications for the logged-in user (with pagination and type filter)
2. Fetch a single notification by its ID
3. Mark a single notification as read
4. Mark all notifications as read
5. Send a notification to a single user
6. Send a notification to multiple users (bulk)
7. Delete a notification
8. Stream real-time notifications to the client

---

## Naming Conventions

- All paths are lowercase and hyphen-separated
- Resources are plural nouns: `/notifications`, not `/notification`
- Sub-actions use sub-resources: `/notifications/:id/read`, not `/markNotificationRead`
- No verbs in URL paths
- All endpoints are prefixed with `/api/v1/`

---

## API Endpoints

---

### 1. Get All Notifications

**GET** `/api/v1/notifications`

**Headers:**
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>",
  "Content-Type": "application/json"
}
```

**Query Parameters:**

| Parameter           | Type    | Required | Description                                    |
|---------------------|---------|----------|------------------------------------------------|
| `page`              | integer | No       | Page number, default 1                         |
| `limit`             | integer | No       | Results per page, default 20                   |
| `notification_type` | string  | No       | One of: `Event`, `Result`, `Placement`         |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
        "studentId": "stu_123",
        "type": "Result",
        "message": "mid-sem results are out",
        "isRead": false,
        "createdAt": "2026-04-22T17:51:30Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 84,
      "totalPages": 5
    }
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

---

### 2. Get a Single Notification by ID

**GET** `/api/v1/notifications/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>",
  "Content-Type": "application/json"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
      "studentId": "stu_123",
      "type": "Placement",
      "message": "CSX Corporation hiring",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:18Z"
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Notification not found"
  }
}
```

---

### 3. Mark a Single Notification as Read

**PATCH** `/api/v1/notifications/:id/read`

**Headers:**
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>",
  "Content-Type": "application/json"
}
```

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
    "isRead": true,
    "updatedAt": "2026-06-29T10:00:00Z"
  }
}
```

---

### 4. Mark All Notifications as Read

**PATCH** `/api/v1/notifications/read-all`

**Headers:**
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>",
  "Content-Type": "application/json"
}
```

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "updatedCount": 12,
    "message": "All notifications marked as read"
  }
}
```

---

### 5. Send a Notification to a Single User

**POST** `/api/v1/notifications`

**Headers:**
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "studentId": "stu_123",
  "type": "Placement",
  "message": "Google hiring drive scheduled for July 5th"
}
```

**Request Schema:**

| Field       | Type   | Required | Constraints                          |
|-------------|--------|----------|--------------------------------------|
| `studentId` | string | Yes      | Valid student ID                     |
| `type`      | string | Yes      | `Event`, `Result`, or `Placement`    |
| `message`   | string | Yes      | Non-empty, max 500 characters        |

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "81589ada-0ad3-4f77-9554-f52fb558e09d",
      "studentId": "stu_123",
      "type": "Placement",
      "message": "Google hiring drive scheduled for July 5th",
      "isRead": false,
      "createdAt": "2026-06-29T10:05:00Z"
    }
  }
}
```

**Response (422 Validation Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "type",
        "message": "type must be one of: Event, Result, Placement"
      }
    ]
  }
}
```

---

### 6. Send Bulk Notifications

**POST** `/api/v1/notifications/bulk`

**Headers:**
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "studentIds": ["stu_001", "stu_002", "stu_003"],
  "type": "Event",
  "message": "Annual tech fest starts tomorrow"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "sentCount": 3,
    "failedCount": 0,
    "message": "Bulk notifications queued successfully"
  }
}
```

---

### 7. Delete a Notification

**DELETE** `/api/v1/notifications/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>",
  "Content-Type": "application/json"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Notification deleted successfully"
  }
}
```

---

## Core Notification JSON Schema

```json
{
  "id": "string — UUID, unique identifier for the notification",
  "studentId": "string — ID of the student this notification belongs to",
  "type": "string — enum: Event | Result | Placement",
  "message": "string — the notification text, max 500 characters",
  "isRead": "boolean — whether the student has read this notification",
  "createdAt": "string — ISO 8601 datetime, when the notification was created",
  "updatedAt": "string — ISO 8601 datetime, last modification time (optional)"
}
```

---

## Real-Time Notification Mechanism

### Chosen Approach: Server-Sent Events (SSE)

**Endpoint:**

**GET** `/api/v1/notifications/stream`

**Headers:**
```json
{
  "Authorization": "Bearer <ACCESS_TOKEN>",
  "Accept": "text/event-stream"
}
```

**Why SSE and not WebSockets:**

| Factor             | SSE                                  | WebSockets                        |
|--------------------|--------------------------------------|-----------------------------------|
| Communication      | Server → Client only (one-way)       | Bidirectional                     |
| Protocol           | Plain HTTP                           | Upgraded TCP connection           |
| Auto-reconnect     | Built-in                             | Must be implemented manually      |
| Complexity         | Low                                  | Higher                            |
| Proxy/CDN support  | Works out of the box                 | Can be blocked by some proxies    |
| Fit for this use   | Perfect — server pushes, client reads| Overkill for push-only use case   |

Notifications flow in one direction only — the server pushes, the client listens. SSE is purpose-built for this. WebSockets would introduce bidirectional overhead that serves no purpose here.

**Event payload format:**
```
data: {"id":"d146095a-0d86-4a34-9e69-3900a14576bc","type":"Placement","message":"Amazon hiring","createdAt":"2026-06-29T10:10:00Z"}
```

**Client-side usage example:**
```javascript
const eventSource = new EventSource('/api/v1/notifications/stream');

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // render notification in UI
};

eventSource.onerror = () => {
  // SSE reconnects automatically on drop
};
```

---

## Standard Error Response Schema

Used consistently across all endpoints:

```json
{
  "success": false,
  "error": {
    "code": "string — e.g. UNAUTHORIZED, NOT_FOUND, VALIDATION_ERROR, INTERNAL_ERROR",
    "message": "string — human-readable description of what went wrong",
    "details": "array — optional, present only for validation errors"
  }
}
```

### HTTP Status Codes

| Status | When it is used                          |
|--------|------------------------------------------|
| 200    | Request succeeded                        |
| 201    | Resource successfully created            |
| 400    | Malformed request or bad JSON            |
| 401    | Missing or invalid Bearer token          |
| 404    | Requested resource does not exist        |
| 422    | Request is valid JSON but fails validation |
| 500    | Unexpected server error                  |

