# Planday Scheduling API - Sections

## Overview

The Planday Scheduling API Sections endpoint provides access to available sections (positions) in the scheduling system. Sections represent different roles or positions that employees can be assigned to within departments.

**Base URL:** `https://openapi.planday.com/scheduling/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Section Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier of the position |
| `name` | string | Name of the position |
| `departmentId` | integer | Identifier of the department the position is assigned to |

---

## Endpoints

### GET /sections - List Available Sections

Returns a paginated list of available sections from the system.

**Required Scope:** `shiftposition:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `departmentId` | integer | Filter by department ID - return records for given department |
| `offset` | integer | Skip first N records for pagination purposes |
| `limit` | integer | Maximum number of records to return (max 50 per request) |

#### Example Request

```http
GET /scheduling/v1.0/sections?departmentId=5&limit=20&offset=0
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
      "departmentId": 5
    },
    {
      "id": 2,
      "name": "Host/Hostess",
      "departmentId": 5
    },
    {
      "id": 3,
      "name": "Bartender",
      "departmentId": 5
    },
    {
      "id": 4,
      "name": "Kitchen Staff",
      "departmentId": 6
    }
  ]
}
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Request completed successfully |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Application isn't assigned to the appropriate scope |
| 429 | Too Many Requests - Rate limit exceeded |

## Rate Limits

- **Per Portal**: 20 requests/second, 750 requests/minute
- **Per Client ID**: 100 requests/second, 2000 requests/minute

---

## Usage Examples

### Get All Sections

```javascript
// Get all available sections
const sections = await getSections({
  limit: 50,
  offset: 0
});

console.log(`Found ${sections.paging.total} total sections`);
```

### Get Sections by Department

```javascript
// Get sections for a specific department
const frontOfHouseSections = await getSections({
  departmentId: 5,
  limit: 20
});

// Example: Get kitchen positions
const kitchenSections = await getSections({
  departmentId: 6,
  limit: 20
});
```

### Pagination Example

```javascript
// Paginate through all sections
let allSections = [];
let offset = 0;
const limit = 50;

do {
  const response = await getSections({ limit, offset });
  allSections.push(...response.data);
  offset += limit;
} while (offset < response.paging.total);

console.log(`Retrieved ${allSections.length} sections total`);
```

---

## Common Use Cases

### Position Assignment
Sections are typically used when:
- Creating shifts and need to assign specific positions
- Filtering shifts by position type
- Setting up scheduling templates
- Managing role-based scheduling

### Department Organization
Use the `departmentId` filter to:
- Get all positions available within a specific department
- Organize positions by operational areas (Kitchen, Front of House, etc.)
- Create department-specific scheduling interfaces

---

## Integration Notes

- **Relationship to Shifts**: Section IDs are used in the `positionId` field when creating or updating shifts
- **Department Dependency**: Sections are always associated with a specific department
- **Naming Convention**: Section names typically represent job roles like "Server", "Cook", "Manager", etc.
- **Pagination**: With a maximum of 50 records per request, use pagination for larger datasets

## Related Endpoints

- **Shifts API**: Uses `positionId` from sections when creating/updating shifts
- **Departments API**: Provides the department context for sections
- **Employees API**: Employees can be assigned to shifts with specific position requirements