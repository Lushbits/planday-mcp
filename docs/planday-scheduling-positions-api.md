# Planday Scheduling API - Positions

## Overview

The Planday Scheduling API Positions endpoint provides comprehensive management of employee positions within the scheduling system. Positions define specific roles with time, cost, and revenue tracking capabilities that can be assigned to shifts.

**Base URL:** `https://openapi.planday.com/scheduling/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Position Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier of the position |
| `name` | string | Name of the position |
| `startDate` | string (date) | Start date for the position |
| `endDate` | string (date) | End date for the position |
| `isActive` | boolean | Whether the position is currently active |
| `departmentId` | integer | Identifier of the department |
| `sectionId` | integer | Identifier of the section |
| `employeeGroupId` | integer | Identifier of the employee group |
| `affectRevenue` | boolean | Whether this position affects revenue calculations |
| `revenueUnitId` | integer | ID of the revenue unit associated with position |
| `skillIds` | array[integer] | List of required skill IDs for this position |
| `color` | string | Position color code (e.g., "#21E56E") |

### Delete Options

When deleting a position, you can specify how to handle existing shifts:

- `Undecided` - Default option, requires manual decision
- `KeepPosition` - Keep the position assignments on existing shifts
- `RemovePosition` - Remove position from shifts but keep shifts
- `ReplacePosition` - Replace with another position (requires `replacementPositionId`)
- `DeleteShifts` - Delete all shifts associated with this position

---

## Endpoints

### GET /positions - List Available Positions

Returns a paginated list of available positions.

**Required Scope:** `shiftposition:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `offset` | integer | Skip first N records for pagination purposes |
| `limit` | integer | Maximum number of records to return (max 50 per request) |
| `isActive` | boolean | Filter by position status (active/inactive) |

#### Example Request

```http
GET /scheduling/v1.0/positions?isActive=true&limit=20&offset=0
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "paging": {
    "offset": 0,
    "limit": 20,
    "total": 45
  },
  "data": [
    {
      "id": 1,
      "name": "Server",
      "startDate": "2024-01-01",
      "endDate": "2025-12-31",
      "isActive": true,
      "departmentId": 5,
      "sectionId": 2,
      "employeeGroupId": 3,
      "affectRevenue": true,
      "revenueUnitId": 1,
      "skillIds": [1, 3]
    },
    {
      "id": 2,
      "name": "Kitchen Manager",
      "startDate": "2024-06-01",
      "endDate": "2025-06-01",
      "isActive": true,
      "departmentId": 6,
      "sectionId": 4,
      "employeeGroupId": 2,
      "affectRevenue": true,
      "revenueUnitId": 2,
      "skillIds": [2, 4, 5]
    }
  ]
}
```

---

### POST /positions - Create Position

Create a new position with specified parameters.

**Required Scope:** `shiftposition:create`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `departmentId` | integer | ✓ | ID of department |
| `employeeGroupId` | integer | ✓ | ID of employee group |
| `name` | string | ✓ | Position name |
| `affectRevenue` | boolean | ✓ | Whether position affects revenue |
| `sectionId` | integer | | ID of the section |
| `color` | string | | Position color (e.g., "#21E56E") |
| `validFrom` | string (datetime) | | Valid from date |
| `validTo` | string (datetime) | | Valid to date |
| `skillIds` | array[integer] | | List of required skill IDs |
| `revenueUnitId` | integer | | ID of revenue unit |

#### Example Request

```http
POST /scheduling/v1.0/positions
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "departmentId": 5,
  "employeeGroupId": 3,
  "sectionId": 2,
  "name": "Senior Server",
  "color": "#21E56E",
  "validFrom": "2024-06-07T00:00:00Z",
  "validTo": "2025-06-07T00:00:00Z",
  "skillIds": [1, 3, 7],
  "affectRevenue": true,
  "revenueUnitId": 1
}
```

#### Response

```json
{
  "data": {
    "skillIds": [1, 3, 7],
    "id": 25,
    "name": "Senior Server",
    "startDate": "2024-06-07",
    "endDate": "2025-06-07",
    "isActive": true,
    "departmentId": 5,
    "sectionId": 2,
    "employeeGroupId": 3,
    "affectRevenue": true,
    "revenueUnitId": 1
  }
}
```

---

### GET /positions/{positionId} - Get Position by ID

Returns a specific position by its ID.

**Required Scope:** `shiftposition:read`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `positionId` | integer | Unique position identifier |

#### Example Request

```http
GET /scheduling/v1.0/positions/25
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "data": {
    "skillIds": [1, 3, 7],
    "id": 25,
    "name": "Senior Server",
    "startDate": "2024-06-07",
    "endDate": "2025-06-07",
    "isActive": true,
    "departmentId": 5,
    "sectionId": 2,
    "employeeGroupId": 3,
    "affectRevenue": true,
    "revenueUnitId": 1
  }
}
```

---

### PUT /positions/{positionId} - Update Position

Update an existing position with new parameters.

**Required Scope:** `shiftposition:update`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `positionId` | integer | Unique position identifier |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Position name |
| `affectRevenue` | boolean | ✓ | Whether position affects revenue |
| `sectionId` | integer | | ID of the section |
| `color` | string | | Position color (e.g., "#21E56E") |
| `validFrom` | string (datetime) | | Valid from date |
| `validTo` | string (datetime) | | Valid to date |
| `skillIds` | array[integer] | | List of required skill IDs |
| `revenueUnitId` | integer | | ID of revenue unit |

#### Example Request

```http
PUT /scheduling/v1.0/positions/25
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "sectionId": 2,
  "name": "Lead Server",
  "color": "#FF5733",
  "validFrom": "2024-06-07T00:00:00Z",
  "validTo": "2025-12-31T23:59:59Z",
  "skillIds": [1, 3, 7, 8],
  "affectRevenue": true,
  "revenueUnitId": 1
}
```

#### Response

```json
{
  "data": {
    "skillIds": [1, 3, 7, 8],
    "id": 25,
    "name": "Lead Server",
    "startDate": "2024-06-07",
    "endDate": "2025-12-31",
    "isActive": true,
    "departmentId": 5,
    "sectionId": 2,
    "employeeGroupId": 3,
    "affectRevenue": true,
    "revenueUnitId": 1
  }
}
```

---

### DELETE /positions/{positionId} - Delete Position

Delete an existing position with options for handling associated shifts.

**Required Scope:** `shiftposition:delete`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `positionId` | integer | Unique position identifier |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `replacementPositionId` | integer | Replacement position ID (required if deleteOption is "ReplacePosition") |
| `deleteOption` | string | How to handle existing shifts (see Delete Options above) |

#### Example Request

```http
DELETE /scheduling/v1.0/positions/25?deleteOption=ReplacePosition&replacementPositionId=26
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```
204 No Content
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Request completed successfully |
| 204 | No Content - Delete operation successful |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Application isn't assigned to the appropriate scope |
| 429 | Too Many Requests - Rate limit exceeded |

## Rate Limits

- **Per Portal**: 20 requests/second, 750 requests/minute
- **Per Client ID**: 100 requests/second, 2000 requests/minute

---

## Usage Examples

### Get All Active Positions

```javascript
// Get all active positions
const activePositions = await getPositions({
  isActive: true,
  limit: 50,
  offset: 0
});

console.log(`Found ${activePositions.paging.total} active positions`);
```

### Create a New Position

```javascript
// Create a position for a new department role
const newPosition = await createPosition({
  departmentId: 5,
  employeeGroupId: 3,
  sectionId: 2,
  name: "Shift Supervisor",
  color: "#4CAF50",
  validFrom: "2024-06-01T00:00:00Z",
  validTo: "2025-06-01T00:00:00Z",
  skillIds: [1, 2, 5],
  affectRevenue: true,
  revenueUnitId: 1
});

console.log(`Created position: ${newPosition.data.name} (ID: ${newPosition.data.id})`);
```

### Update Position Requirements

```javascript
// Update position to add new skill requirements
const updatedPosition = await updatePosition(25, {
  name: "Senior Lead Server",
  skillIds: [1, 3, 7, 8, 9],
  affectRevenue: true,
  revenueUnitId: 1
});
```

### Safely Delete Position

```javascript
// Replace position with another when deleting
await deletePosition(25, {
  deleteOption: "ReplacePosition",
  replacementPositionId: 26
});

// Or remove position from shifts but keep shifts
await deletePosition(25, {
  deleteOption: "RemovePosition"
});
```

---

## Common Use Cases

### Position Management
Positions are typically used for:
- **Shift Assignment**: Assigning specific roles to shifts
- **Skill Requirements**: Ensuring employees have required skills
- **Revenue Tracking**: Linking position work to revenue calculations
- **Department Organization**: Organizing roles within departments
- **Scheduling Templates**: Creating position-based scheduling patterns

### Revenue Integration
When `affectRevenue` is true:
- Position hours contribute to labor cost calculations
- Revenue per position can be tracked
- Cost-per-shift analysis includes position rates
- Department profitability includes position contributions

### Skill Management
Use `skillIds` to:
- Ensure employees meet position requirements
- Filter available employees for positions
- Track skill development and certification requirements
- Create skill-based scheduling rules

---

## Integration Notes

- **Relationship to Shifts**: Position IDs are used in the `positionId` field when creating or updating shifts
- **Department & Section Hierarchy**: Positions belong to departments and can be grouped by sections
- **Employee Group Association**: Positions are linked to specific employee groups for access control
- **Revenue Tracking**: Positions can be configured to affect revenue calculations
- **Skill Requirements**: Positions can require specific skills that employees must possess
- **Time Validity**: Positions can have start and end dates for temporal management
- **Visual Organization**: Color coding helps with UI organization and quick identification

## Related Endpoints

- **Shifts API**: Uses `positionId` from positions when creating/updating shifts
- **Sections API**: Provides the section context for positions
- **Departments API**: Provides the department context for positions
- **Skills API**: Manages the skills required by positions
- **Employee Groups API**: Manages the employee groups associated with positions
- **Revenue API**: Tracks revenue associated with positions