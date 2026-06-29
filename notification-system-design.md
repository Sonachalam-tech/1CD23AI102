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

## Stage 2

### Database Choice: PostgreSQL (Relational SQL)

For this notification platform, I recommend **PostgreSQL** as the persistent storage layer.

#### Why PostgreSQL

The notification data is highly structured — every notification has a fixed set of fields: an ID, a student ID, a type, a message, a read status, and a timestamp. There is no ambiguity about the shape of a notification record. It does not vary from one record to another. This makes a relational schema the natural fit.

Beyond structure, the queries we need to run are relational in nature. We filter by `studentId`. We filter by `isRead`. We filter by `type`. We sort by `createdAt`. We do bulk updates across rows for a given student. These are exactly the kinds of operations that SQL handles efficiently, especially with proper indexes.

PostgreSQL specifically (over plain MySQL) gives us:

- **UUID as a native type** — notification IDs are UUIDs, PostgreSQL stores and indexes them natively
- **ENUM types** — we can enforce `notification_type` values at the database level
- **JSONB support** — if metadata needs to be attached to notifications in the future, PostgreSQL handles it without a schema migration
- **Robust index types** — B-tree, partial indexes, and composite indexes all available
- **Transactions** — bulk operations like "mark all as read" can be wrapped in a transaction safely

---

### Database Schema

```sql
-- Enum for notification type
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

-- Main notifications table
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      VARCHAR(100) NOT NULL,
  type            notification_type NOT NULL,
  message         VARCHAR(500) NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);
```

---

### Problems That Arise as Data Volume Increases

The platform is for 50,000 students. If each student receives an average of 100 notifications per year, that is 5,000,000 rows per year. In a few years the table will have tens of millions of rows. The problems that emerge at this scale are:

#### 1. Full Table Scans on Unindexed Columns

A query like `WHERE student_id = 'stu_123' AND is_read = false ORDER BY created_at DESC` will do a full sequential scan on a table of millions of rows if there are no indexes. This is the exact query the application runs on every page load for every student.

**Solution: Composite Index**

```sql
CREATE INDEX idx_notifications_student_unread
ON notifications (student_id, is_read, created_at DESC);
```

This index covers the three columns used in the most common query together. PostgreSQL can satisfy the entire WHERE clause and ORDER BY from the index alone without touching the table rows.

#### 2. Counting Unread Notifications is Expensive

Displaying a badge count of unread notifications requires `COUNT(*)` on potentially thousands of rows per student. At scale this becomes slow.

**Solution: Maintain a separate unread count cache table**

```sql
CREATE TABLE notification_unread_counts (
  student_id   VARCHAR(100) PRIMARY KEY,
  unread_count INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Increment this counter when a notification is inserted. Decrement when marked as read. This makes the badge count an O(1) lookup instead of a COUNT query.

#### 3. The Table Grows Without Bound

Old read notifications from years ago are still sitting in the table taking up space and slowing down queries.

**Solution: Archival / TTL Policy**

Move notifications older than 90 days that have been read into an `archived_notifications` table, or delete them entirely depending on business requirements. This keeps the hot table small.

```sql
-- Archive old read notifications (run as a scheduled job)
INSERT INTO archived_notifications
SELECT * FROM notifications
WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '90 days';

DELETE FROM notifications
WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '90 days';
```

#### 4. Bulk Inserts for 50,000 Students are Slow Row by Row

Sending a notification to all students one INSERT at a time is extremely slow.

**Solution: Batch INSERT**

```sql
INSERT INTO notifications (student_id, type, message)
VALUES
  ('stu_001', 'Event', 'Tech fest tomorrow'),
  ('stu_002', 'Event', 'Tech fest tomorrow'),
  ('stu_003', 'Event', 'Tech fest tomorrow');
  -- ... all 50,000 in a single statement or chunked batches of 1000
```

---

### SQL Queries Mapped to Stage 1 REST APIs

---

#### GET /api/v1/notifications — Fetch all notifications for a student (paginated, with optional type filter)

```sql
-- Without type filter
SELECT id, student_id, type, message, is_read, created_at
FROM notifications
WHERE student_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- With type filter
SELECT id, student_id, type, message, is_read, created_at
FROM notifications
WHERE student_id = $1
  AND type = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- Total count for pagination
SELECT COUNT(*)
FROM notifications
WHERE student_id = $1;
```

---

#### GET /api/v1/notifications/:id — Fetch a single notification

```sql
SELECT id, student_id, type, message, is_read, created_at
FROM notifications
WHERE id = $1
  AND student_id = $2;
```

The `student_id` check ensures a student cannot fetch another student's notification.

---

#### PATCH /api/v1/notifications/:id/read — Mark a single notification as read

```sql
UPDATE notifications
SET is_read = TRUE,
    updated_at = NOW()
WHERE id = $1
  AND student_id = $2
RETURNING id, is_read, updated_at;
```

---

#### PATCH /api/v1/notifications/read-all — Mark all notifications as read

```sql
UPDATE notifications
SET is_read = TRUE,
    updated_at = NOW()
WHERE student_id = $1
  AND is_read = FALSE;
```

---

#### POST /api/v1/notifications — Insert a single notification

```sql
INSERT INTO notifications (student_id, type, message)
VALUES ($1, $2, $3)
RETURNING id, student_id, type, message, is_read, created_at;
```

---

#### POST /api/v1/notifications/bulk — Insert notifications for multiple students

```sql
INSERT INTO notifications (student_id, type, message)
SELECT
  unnest($1::varchar[]),
  $2::notification_type,
  $3
RETURNING id, student_id;
```

`$1` is the array of student IDs. `$2` is the type. `$3` is the message. PostgreSQL's `unnest` expands the array into individual rows in a single INSERT statement.

---

#### DELETE /api/v1/notifications/:id — Delete a notification

```sql
DELETE FROM notifications
WHERE id = $1
  AND student_id = $2;
```

---

### Index Summary

```sql
-- Primary lookup: student's notifications sorted by time
CREATE INDEX idx_notifications_student_created
ON notifications (student_id, created_at DESC);

-- Unread filter: used when fetching unread or marking all as read
CREATE INDEX idx_notifications_student_unread
ON notifications (student_id, is_read, created_at DESC);

-- Type filter: used when filtering by notification_type
CREATE INDEX idx_notifications_student_type
ON notifications (student_id, type, created_at DESC);
```

## Stage 3

### Query Analysis

The query in question is:

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

---

### Is This Query Accurate?

The query is functionally correct in intent — it is trying to fetch all unread notifications for a specific student ordered by time. However it has two problems worth calling out:

**1. `SELECT *` instead of selecting specific columns**

Selecting every column pulls more data off disk than needed. If the table has many columns or large text fields, this increases I/O unnecessarily. You should always select only the columns the caller actually needs.

**2. `ORDER BY createdAt ASC` may not match the product requirement**

Most notification UIs show the newest notifications first, not the oldest. `ASC` here means the oldest unread notification appears at the top. Unless the product explicitly wants oldest-first, this should be `DESC`. This is worth confirming but is likely a bug in intent.

---

### Why Is This Query Slow?

At 5,000,000 rows with no composite index covering `(studentID, isRead, createdAt)`, this query forces PostgreSQL (or MySQL) to do the following:

1. **Full sequential scan** — The database reads every row in the table to find rows where `studentID = 1042`. Without an index on `studentID`, there is no shortcut.
2. **Filter pass** — After finding all rows for this student (say 100 rows), it then filters for `isRead = false`.
3. **Sort pass** — It then sorts those filtered rows by `createdAt`. Without the sort column in the index, this sort happens in memory or on disk.

At 5,000,000 rows a sequential scan is extremely expensive. Computation cost is **O(n)** where n is the total number of rows in the table — the database touches every single row regardless of how few results come back.

---

### What Would You Change?

**Improved query:**

```sql
SELECT id, student_id, type, message, is_read, created_at
FROM notifications
WHERE student_id = 1042
  AND is_read = false
ORDER BY created_at DESC
LIMIT 50;
```

Changes made and why:

- **Replaced `SELECT *`** with only the columns needed — reduces I/O
- **Changed `ASC` to `DESC`** — shows newest unread notifications first, which is the standard UX expectation
- **Added `LIMIT`** — without a limit, if a student somehow accumulates thousands of unread notifications, the query returns all of them at once. Pagination is always safer at scale.

**Add this composite index:**

```sql
CREATE INDEX idx_notifications_student_unread_created
ON notifications (student_id, is_read, created_at DESC);
```

With this index the database can:
1. Jump directly to all rows where `student_id = 1042` — no full scan
2. Filter `is_read = false` within that subset using the index
3. Return rows already sorted by `created_at DESC` — no separate sort step

Computation cost drops from **O(n)** (full scan of 5,000,000 rows) to **O(log n + k)** where k is the number of matching rows for that student. For a table of 5,000,000 rows that is the difference between touching millions of rows and touching tens of rows.

---

### Is Adding Indexes on Every Column a Good Idea?

**No. This advice is not effective and is actively harmful.**

Here is why:

#### Every index has a write cost

Every time a row is inserted, updated, or deleted, PostgreSQL must update every index that covers any of those columns. If you have 10 indexes on a table and you insert one notification, the database performs 10 index updates, not 1. On a table receiving bulk inserts for 50,000 students this write amplification becomes a serious bottleneck.

#### Indexes consume disk space

Each index is a separate data structure stored on disk. Indexing every column can easily double or triple the storage footprint of the table.

#### The query planner can only use one index effectively per query

PostgreSQL's query planner picks the most selective index for a given query. Having 10 single-column indexes does not help a query that filters on 3 columns simultaneously. A single well-designed composite index covering `(student_id, is_read, created_at)` outperforms three separate single-column indexes for our most common query.

#### Low-cardinality columns should not be indexed at all

A column like `is_read` has only two possible values: `true` or `false`. Roughly half the table is `true` and half is `false`. An index on this column alone is nearly useless — the database would still end up scanning half the table. It only becomes useful as part of a composite index where higher-selectivity columns come first.

**The correct approach** is to identify the actual queries the application runs (which we defined in Stage 1 and Stage 2), and create targeted composite indexes that serve those specific query patterns. Index with purpose, not defensively.

---

### Query: Find All Students Who Got a Placement Notification in the Last 7 Days

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```

**Explanation:**

- `DISTINCT student_id` — a student may have received multiple placement notifications in 7 days, we want each student once
- `notification_type = 'Placement'` — filters to placement notifications only using the enum column
- `created_at >= NOW() - INTERVAL '7 days'` — last 7 days from the current timestamp

**Supporting index for this query:**

```sql
CREATE INDEX idx_notifications_type_created
ON notifications (notification_type, created_at DESC);
```

This lets the database jump directly to `Placement` rows and then scan only within the last 7 days, without touching the rest of the table.


