# Planday HR API - Departments

## Overview

The Planday HR API Departments endpoint provides comprehensive department management functionality for organizational structure administration. This API allows you to create, read, update, and delete departments, which serve as the foundational organizational units for employee assignment and scheduling.

**Base URL:** `https://openapi.planday.com/hr/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Department Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique internal identifier of the department |
| `name` | string | Department name |
| `number` | string | Numeric value displayed in Planday to identify the department |

---

## Endpoints

### POST /departments - Create Department

Create a new department.

**Required Scope:** `department:create`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Department name (non-empty) |
| `number` | string | | Numeric identifier for the department |

#### Example Request

```http
POST /hr/v1.0/departments
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "name": "Kitchen",
  "number": "001"
}
```

#### Response

```json
{
  "data": {
    "id": 1234,
    "name": "Kitchen",
    "number": "001"
  }
}
```

---

### GET /departments - List Departments

Get a paginated list of departments.

**Required Scope:** `department:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Maximum number of records to return (max 50, default: 50) |
| `offset` | integer | Skip first N records for pagination (default: 0) |

#### Example Request

```http
GET /hr/v1.0/departments?limit=20&offset=0
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "paging": {
    "offset": 0,
    "limit": 20,
    "total": 8
  },
  "data": [
    {
      "id": 1234,
      "name": "Kitchen",
      "number": "001"
    },
    {
      "id": 1235,
      "name": "Front of House",
      "number": "002"
    },
    {
      "id": 1236,
      "name": "Management",
      "number": "003"
    },
    {
      "id": 1237,
      "name": "Bar",
      "number": "004"
    }
  ]
}
```

---

### GET /departments/{id} - Get Department by ID

Get details of a specific department.

**Required Scope:** `department:read`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Required. Department ID to retrieve |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `includeDeleted` | boolean | Include deleted employees (default: false) |
| `managedEmployeesOnly` | boolean | Include only managed employees (default: false) |

#### Example Request

```http
GET /hr/v1.0/departments/1234?includeDeleted=false&managedEmployeesOnly=false
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "data": {
    "id": 1234,
    "name": "Kitchen",
    "number": "001"
  }
}
```

---

### PUT /departments/{id} - Update Department

Update details of an existing department.

**Required Scope:** `department:update`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Required. Department ID to update (must be non-negative) |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Department name (non-empty) |
| `number` | string | | Numeric identifier for the department |

#### Example Request

```http
PUT /hr/v1.0/departments/1234
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "name": "Kitchen & Food Prep",
  "number": "001A"
}
```

#### Response

```
204 No Content
```

---

### DELETE /departments/{id} - Delete Department

Delete a department. Use this endpoint with caution as it permanently removes the department.

**Required Scope:** `department:delete`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Required. Department ID to delete (must be non-negative) |

#### Example Request

```http
DELETE /hr/v1.0/departments/1234
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```
204 No Content
```

---

## Usage Examples

### Create New Department

```javascript
// Create a new department for restaurant operations
const newDepartment = await createDepartment({
  name: "Catering",
  number: "005"
});

console.log(`Created department: ${newDepartment.data.name} (ID: ${newDepartment.data.id})`);
```

### Get All Departments

```javascript
// Get all departments with pagination
const departments = await getDepartments({
  limit: 50,
  offset: 0
});

console.log(`Found ${departments.paging.total} departments`);

// Display department list
departments.data.forEach(dept => {
  console.log(`${dept.number} - ${dept.name} (ID: ${dept.id})`);
});
```

### Update Department Information

```javascript
// Update department name and number
await updateDepartment(1234, {
  name: "Kitchen & Food Prep",
  number: "001A"
});

console.log("Department updated successfully");
```

### Delete Department

```javascript
// Delete a department (use with caution)
try {
  await deleteDepartment(1234);
  console.log("Department deleted successfully");
} catch (error) {
  if (error.status === 409) {
    console.error("Department deletion failed - may have associated employees or shifts");
  } else {
    console.error("Failed to delete department:", error.message);
  }
}
```

---

## Common Use Cases

### Organizational Structure
Departments are fundamental for:
- **Employee Organization**: Assign employees to specific operational areas
- **Scheduling Management**: Organize shifts and schedules by department
- **Reporting and Analytics**: Track performance and costs by department
- **Access Control**: Manage permissions and visibility by department

### Restaurant/Hospitality Operations
Typical departments include:
- **Kitchen**: Food preparation and cooking staff
- **Front of House**: Servers, hosts, and customer service
- **Bar**: Bartenders and bar support staff
- **Management**: Supervisors, managers, and administrative staff
- **Catering**: Off-site event and catering operations

### Business Management
Use departments for:
- **Cost Center Management**: Track labor costs by operational area
- **Performance Metrics**: Analyze efficiency and productivity by department
- **Workforce Planning**: Plan staffing levels for different operations
- **Compliance Reporting**: Generate reports by organizational unit

---

## Integration Notes

- **Employee Assignment**: Employees can be assigned to multiple departments
- **Primary Department**: Employees may have a primary department designation
- **Scheduling Integration**: Shifts are created within specific departments
- **Number System**: Department numbers provide user-friendly identification
- **Soft Deletion**: Departments may be marked as deleted rather than removed
- **Employee Filtering**: Can view only managed employees within departments

## Related Endpoints

- **Employee API**: Employees are assigned to departments via `departments` array
- **Scheduling API**: Shifts are created within specific departments
- **Payroll API**: Labor costs and hours are tracked by department
- **Reports API**: Department-specific reporting and analytics

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Request completed successfully |
| 204 | No Content - Update or delete operation successful |
| 400 | Bad Request - Invalid department ID, department name is invalid, or department ID is invalid |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Application isn't assigned to the appropriate scope |
| 404 | Not Found - Department ID does not exist |
| 409 | Conflict - Department creation failed or department deletion failed |
| 429 | Too Many Requests - Rate limit exceeded |

## Rate Limits

- **Per Portal**: 20 requests/second, 750 requests/minute
- **Per Client ID**: 100 requests/second, 2000 requests/minute

---

## Best Practices

### Department Lifecycle Management
- Create departments with clear naming conventions and number schemes
- Update department information as organizational structure evolves  
- Use caution when deleting departments - ensure no associated employees or shifts
- Implement proper error handling for conflict situations (409 errors)

### Data Integrity
- Validate department names are non-empty before creation/updates
- Check for duplicate department numbers across the organization
- Consider the impact on employees and schedules before deleting departments
- Implement rollback strategies for bulk operations

### Integration Planning
- Coordinate department creation with employee assignment workflows
- Ensure department IDs are properly referenced in scheduling systems
- Plan for department changes and employee transfers
- Consider reporting requirements when structuring departments

### Performance Optimization
- Cache department lists for frequently accessed data
- Use pagination appropriately for large organizations
- Consider department lookup maps for quick ID-to-name resolution
- Monitor department usage across different system components