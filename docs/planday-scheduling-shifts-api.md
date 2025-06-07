# Planday Scheduling API - Shifts

## Overview

The Planday Scheduling API provides comprehensive shift management functionality for workforce scheduling. This API allows you to create, read, update, and delete shifts, as well as manage shift assignments and approvals.

**Base URL:** `https://openapi.planday.com/scheduling/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Shift Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier of the shift |
| `punchClockShiftId` | integer | Punch clock shift identifier linked to the shift |
| `startDateTime` | string (datetime) | Start date and time of the shift |
| `endDateTime` | string (datetime) | End date and time of the shift |
| `status` | string | Current status of the shift (Open, Assigned, Approved, etc.) |
| `dateTimeCreated` | string (datetime) | Creation date and time of the shift |
| `dateTimeModified` | string (datetime) | Date and time of the last shift modification |
| `skillIds` | array[integer] | Skill IDs associated with shift |
| `departmentId` | integer | Department identifier associated with the shift |
| `employeeId` | integer | Employee identifier associated with a shift |
| `employeeGroupId` | integer | Employee group identifier associated with a shift |
| `positionId` | integer | Position identifier associated with a shift |
| `shiftTypeId` | integer | Shift type associated with the shift |
| `date` | string (date) | Date of the shift |
| `comment` | string | Optional comment on the shift |

### Shift Status Values

- `Open` - Shift is available for assignment
- `Assigned` - Shift has been assigned to an employee
- `Approved` - Shift has been approved for payroll
- `ForSale` - Shift is available for other employees to take
- `Draft` - Shift is in draft status
- `OnDuty` - Employee is currently working the shift
- `PendingSwapAcceptance` - Shift swap is pending acceptance
- `PendingApproval` - Shift is pending approval

---

## Endpoints

### GET /shifts - List Available Shifts

Returns a paginated list of available shifts matching given criteria.

**Required Scope:** `shift:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `Limit` | integer | Maximum number of records (max 5000) |
| `Offset` | integer | Skip first N records for pagination |
| `DepartmentId` | array[integer] | Filter by department IDs |
| `EmployeeGroupId` | array[integer] | Filter by employee group IDs |
| `ShiftTypeId` | array[integer] | Filter by shift type IDs |
| `PositionId` | array[integer] | Filter by position IDs |
| `EmployeeId` | array[integer] | Filter by employee IDs |
| `ShiftStatus` | string | Filter by shift status |
| `From` | string (date) | Start date filter (inclusive) |
| `To` | string (date) | End date filter (inclusive) |
| `CreatedFrom` | string (datetime) | Filter by creation date (after) |
| `CreatedTo` | string (datetime) | Filter by creation date (before) |
| `ModifiedFrom` | string (datetime) | Filter by modification date (after) |
| `ModifiedTo` | string (datetime) | Filter by modification date (before) |

#### Example Request

```http
GET /scheduling/v1.0/shifts?From=2025-06-07&To=2025-06-14&ShiftStatus=Assigned
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "paging": {
    "offset": 0,
    "limit": 50,
    "total": 150
  },
  "data": [
    {
      "punchClockShiftId": 0,
      "startDateTime": "2025-06-07T08:00:00Z",
      "endDateTime": "2025-06-07T16:00:00Z",
      "status": "Assigned",
      "dateTimeCreated": "2025-06-01T10:30:00Z",
      "dateTimeModified": "2025-06-01T10:30:00Z",
      "skillIds": [1, 2],
      "id": 123,
      "departmentId": 5,
      "employeeId": 42,
      "employeeGroupId": 3,
      "positionId": 8,
      "shiftTypeId": 2,
      "date": "2025-06-07",
      "comment": "Weekend shift"
    }
  ]
}
```

---

### POST /shifts - Create Shift

Create a new shift with specified parameters.

**Required Scope:** `shift:create`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `departmentId` | integer | ✓ | Department ID for the shift |
| `allowConflicts` | boolean | ✓ | Whether to allow scheduling conflicts |
| `useBreaks` | boolean | ✓ | Apply default break settings |
| `date` | string (date) | ✓ | Date of the shift |
| `startTime` | string (time) | | Start time of the shift |
| `endTime` | string (time) | | End time (max 24h after start) |
| `employeeId` | integer | | Employee to assign |
| `employeeGroupId` | integer | ✓ | Employee group ID |
| `positionId` | integer | | Position ID |
| `shiftTypeId` | integer | | Shift type ID |
| `defaultWage` | object | | Default wage configuration |
| `comment` | string | | Manager comment |
| `skillIds` | array[integer] | | Required skill IDs |

#### Example Request

```http
POST /scheduling/v1.0/shifts
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "departmentId": 5,
  "allowConflicts": false,
  "useBreaks": true,
  "date": "2025-06-07",
  "startTime": "08:00",
  "endTime": "16:00",
  "employeeId": 42,
  "employeeGroupId": 3,
  "positionId": 8,
  "shiftTypeId": 2,
  "defaultWage": {
    "amount": 25.50,
    "type": "PerHour"
  },
  "comment": "Weekend shift",
  "skillIds": [1, 2]
}
```

#### Response

```json
{
  "data": {
    "startTime": "08:00",
    "endTime": "16:00",
    "defaultWage": {
      "amount": 25.50,
      "type": "PerHour"
    },
    "skillIds": [1, 2],
    "id": 123,
    "departmentId": 5,
    "employeeId": 42,
    "employeeGroupId": 3,
    "positionId": 8,
    "shiftTypeId": 2,
    "date": "2025-06-07",
    "comment": "Weekend shift"
  }
}
```

---

### GET /shifts/{shiftId} - Get Shift by ID

Returns a specific shift by its ID.

**Required Scope:** `shift:read`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `shiftId` | integer | Unique shift identifier |

#### Example Request

```http
GET /scheduling/v1.0/shifts/123
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "data": {
    "punchClockShiftId": 0,
    "startDateTime": "2025-06-07T08:00:00Z",
    "endDateTime": "2025-06-07T16:00:00Z",
    "status": "Assigned",
    "dateTimeCreated": "2025-06-01T10:30:00Z",
    "dateTimeModified": "2025-06-01T10:30:00Z",
    "skillIds": [1, 2],
    "id": 123,
    "departmentId": 5,
    "employeeId": 42,
    "employeeGroupId": 3,
    "positionId": 8,
    "shiftTypeId": 2,
    "date": "2025-06-07",
    "comment": "Weekend shift"
  }
}
```

---

### PUT /shifts/{shiftId} - Update Shift

Update an existing shift with new parameters.

**Required Scope:** `shift:update`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `shiftId` | integer | Unique shift identifier |

#### Request Body

Same structure as POST /shifts, but without `departmentId` requirement.

#### Example Request

```http
PUT /scheduling/v1.0/shifts/123
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "allowConflicts": false,
  "useBreaks": true,
  "date": "2025-06-07",
  "startTime": "09:00",
  "endTime": "17:00",
  "employeeId": 42,
  "employeeGroupId": 3,
  "positionId": 8,
  "shiftTypeId": 2,
  "comment": "Updated weekend shift"
}
```

---

### DELETE /shifts/{shiftId} - Delete Shift

Delete an existing shift.

**Required Scope:** `shift:delete`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `shiftId` | integer | Unique shift identifier |

#### Example Request

```http
DELETE /scheduling/v1.0/shifts/123
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```
204 No Content
```

---

### GET /shifts/deleted - List Deleted Shifts

Returns a paginated list of deleted shifts.

**Required Scope:** `shift:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `DeletedFrom` | string (datetime) | Filter by deletion date (after) |
| `DeletedTo` | string (datetime) | Filter by deletion date (before) |
| `Limit` | integer | Maximum records (max 1000) |

Plus all the same filter parameters as GET /shifts.

#### Response

```json
{
  "paging": {
    "offset": 0,
    "limit": 50,
    "total": 10
  },
  "data": [
    {
      "startDateTime": "2025-06-07T08:00:00Z",
      "endDateTime": "2025-06-07T16:00:00Z",
      "status": "Assigned",
      "dateTimeCreated": "2025-06-01T10:30:00Z",
      "dateTimeModified": "2025-06-01T10:30:00Z",
      "dateTimeDeleted": "2025-06-05T14:20:00Z",
      "deletedBy": 15,
      "id": 123,
      "departmentId": 5,
      "employeeId": 42,
      "employeeGroupId": 3,
      "positionId": 8,
      "shiftTypeId": 2,
      "date": "2025-06-07",
      "comment": "Cancelled weekend shift"
    }
  ]
}
```

---

### GET /shifts/shiftstatus/all - List Shift Statuses

Returns all available shift status values.

**Required Scope:** `shift:read`

#### Response

```json
{
  "paging": {
    "offset": 0,
    "limit": 10,
    "total": 8
  },
  "data": [
    { "id": 1, "name": "Open" },
    { "id": 2, "name": "Assigned" },
    { "id": 3, "name": "Approved" },
    { "id": 4, "name": "ForSale" },
    { "id": 5, "name": "Draft" },
    { "id": 6, "name": "OnDuty" },
    { "id": 7, "name": "PendingSwapAcceptance" },
    { "id": 8, "name": "PendingApproval" }
  ]
}
```

---

### POST /shifts/{shiftId}/approve - Approve Shift

Approve a shift for payroll processing.

**Required Scope:** `shift:update`

#### Example Request

```http
POST /scheduling/v1.0/shifts/123/approve
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

---

### POST /shifts/{shiftId}/employee - Assign Shift

Assign a shift to a specific employee or set it to Open.

**Required Scope:** `shift:update`

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| `employeeId` | integer \| null | Employee ID to assign (null = Open shift) |

#### Example Request

```http
POST /scheduling/v1.0/shifts/123/employee
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "employeeId": 42
}
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient scope permissions |
| 404 | Not Found - Shift ID does not exist |
| 429 | Too Many Requests - Rate limit exceeded |

## Rate Limits

- **Per Portal**: 20 requests/second, 750 requests/minute
- **Per Client ID**: 100 requests/second, 2000 requests/minute

---

## Usage Examples

### Common Workflow: Creating and Managing a Shift

```javascript
// 1. Create a new shift
const newShift = await createShift({
  departmentId: 5,
  allowConflicts: false,
  useBreaks: true,
  date: "2025-06-07",
  startTime: "08:00",
  endTime: "16:00",
  employeeGroupId: 3,
  positionId: 8,
  shiftTypeId: 2
});

// 2. Assign to employee
await assignShift(newShift.id, { employeeId: 42 });

// 3. Approve for payroll
await approveShift(newShift.id);
```

### Filtering Shifts for Dashboard

```javascript
// Get all assigned shifts for next week
const shifts = await getShifts({
  From: "2025-06-07",
  To: "2025-06-14",
  ShiftStatus: "Assigned",
  Limit: 100
});

// Get open shifts needing coverage
const openShifts = await getShifts({
  ShiftStatus: "Open",
  From: new Date().toISOString().split('T')[0]
});
```