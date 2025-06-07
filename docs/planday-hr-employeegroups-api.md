# Planday HR API - Employee Groups

## Overview

The Planday HR API Employee Groups endpoint provides management functionality for employee group organization within the workforce administration system. Employee groups allow for categorizing employees into logical groups for scheduling, permissions, and organizational purposes.

**Base URL:** `https://openapi.planday.com/hr/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

## Additional Error Responses

### GET /employeegroups/{id} - Specific Errors

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Employee group ID is invalid |
| 404 | Not Found - Employee group with given ID doesn't exist |

### PUT /employeegroups/{id} - Specific Errors

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Employee group ID or name is invalid |
| 404 | Not Found - Employee group with given ID doesn't exist |

### DELETE /employeegroups/{id} - Specific Errors

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Employee group ID is invalid |

---

## Data Model

### Employee Group Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique ID of the employee group |
| `name` | string | Employee group name |

---

## Endpoints

### POST /employeegroups - Create Employee Group

Create a new employee group with the specified name.

**Required Scope:** `employeegroup:create`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Name of the employee group (non-empty) |

#### Example Request

```http
POST /hr/v1.0/employeegroups
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "name": "Front of House Staff"
}
```

#### Response

```json
{
  "data": {
    "id": 123,
    "name": "Front of House Staff"
  }
}
```

---

### GET /employeegroups - List Employee Groups

Get a paginated list of employee groups.

**Required Scope:** `employeegroup:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Maximum number of records to return (max 50, default: 50) |
| `offset` | integer | Skip first N records for pagination (default: 0) |

#### Example Request

```http
GET /hr/v1.0/employeegroups?limit=20&offset=0
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "paging": {
    "offset": 0,
    "limit": 20,
    "total": 5
  },
  "data": [
    {
      "id": 123,
      "name": "Front of House Staff"
    },
    {
      "id": 124,
      "name": "Kitchen Staff"
    },
    {
      "id": 125,
      "name": "Management"
    },
    {
      "id": 126,
      "name": "Bartenders"
    },
    {
      "id": 127,
      "name": "Cleaning Crew"
    }
  ]
}
```

---

### GET /employeegroups/{id} - Get Employee Group by ID

Get details of a specific employee group.

**Required Scope:** `employeegroup:read`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Required. Employee group ID (must be >= 1) |

#### Example Request

```http
GET /hr/v1.0/employeegroups/123
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "data": {
    "id": 123,
    "name": "Front of House Staff"
  }
}
```

---

### PUT /employeegroups/{id} - Update Employee Group

Update the details of an employee group.

**Required Scope:** `employeegroup:update`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Required. Employee group ID (must be >= 1) |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Name of the employee group (non-empty) |

#### Example Request

```http
PUT /hr/v1.0/employeegroups/123
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "name": "Front of House Team"
}
```

#### Response

```
204 No Content
```

---

### DELETE /employeegroups/{id} - Delete Employee Group

Delete an employee group. Use this endpoint with caution.

**Required Scope:** `employeegroup:delete`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Required. Employee group ID (must be >= 1) |

#### Example Request

```http
DELETE /hr/v1.0/employeegroups/127
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```
204 No Content
```

---

## Usage Examples

### Get All Employee Groups

```javascript
// Get all employee groups with pagination
const employeeGroups = await getEmployeeGroups({
  limit: 50,
  offset: 0
});

console.log(`Found ${employeeGroups.paging.total} employee groups`);

employeeGroups.data.forEach(group => {
  console.log(`Group: ${group.name} (ID: ${group.id})`);
});
```

### Get Specific Employee Group

```javascript
// Get details of a specific employee group
const group = await getEmployeeGroup(123);

console.log(`Group Details: ${group.data.name} (ID: ${group.data.id})`);
```

### Update Employee Group

```javascript
// Update an employee group name
await updateEmployeeGroup(123, {
  name: "Senior Front of House Staff"
});

console.log("Employee group updated successfully");
```

### Delete Employee Group

```javascript
// Delete an employee group (use with caution)
try {
  await deleteEmployeeGroup(127);
  console.log("Employee group deleted successfully");
} catch (error) {
  console.error("Failed to delete employee group:", error.message);
}
```

### Complete Employee Group Management

```javascript
// Complete workflow for managing employee groups
class EmployeeGroupManager {
  async listAllGroups() {
    let allGroups = [];
    let offset = 0;
    const limit = 50;
    
    do {
      const response = await getEmployeeGroups({ limit, offset });
      allGroups.push(...response.data);
      offset += limit;
    } while (offset < response.paging.total);
    
    return allGroups;
  }
  
  async createGroupIfNotExists(groupName) {
    // Check if group already exists
    const existingGroups = await this.listAllGroups();
    const existingGroup = existingGroups.find(g => g.name === groupName);
    
    if (existingGroup) {
      console.log(`Group '${groupName}' already exists with ID: ${existingGroup.id}`);
      return existingGroup;
    }
    
    // Create new group
    const newGroup = await createEmployeeGroup({ name: groupName });
    console.log(`Created new group '${groupName}' with ID: ${newGroup.data.id}`);
    return newGroup.data;
  }
  
  async updateGroupName(groupId, newName) {
    try {
      await updateEmployeeGroup(groupId, { name: newName });
      console.log(`Updated group ${groupId} to '${newName}'`);
      return true;
    } catch (error) {
      console.error(`Failed to update group ${groupId}:`, error.message);
      return false;
    }
  }
  
  async safeDeleteGroup(groupId) {
    try {
      // First get group details to show what we're deleting
      const group = await getEmployeeGroup(groupId);
      console.log(`Attempting to delete group: ${group.data.name}`);
      
      await deleteEmployeeGroup(groupId);
      console.log(`Successfully deleted group: ${group.data.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete group ${groupId}:`, error.message);
      return false;
    }
  }
}

// Usage example
const groupManager = new EmployeeGroupManager();

// Setup organizational structure
const organizationalGroups = [
  "Management",
  "Full-time Staff", 
  "Part-time Staff",
  "Seasonal Workers",
  "Supervisors"
];

for (const groupName of organizationalGroups) {
  await groupManager.createGroupIfNotExists(groupName);
}

// List all groups
const allGroups = await groupManager.listAllGroups();
console.log(`Total employee groups: ${allGroups.length}`);
```

### Bulk Operations with Error Handling

```javascript
// Bulk create employee groups with error handling
async function setupEmployeeGroups(groupNames) {
  const results = {
    created: [],
    failed: [],
    existing: []
  };
  
  for (const groupName of groupNames) {
    try {
      const newGroup = await createEmployeeGroup({ name: groupName });
      results.created.push({
        id: newGroup.data.id,
        name: newGroup.data.name
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        results.existing.push(groupName);
      } else {
        results.failed.push({
          name: groupName,
          error: error.message
        });
      }
    }
  }
  
  return results;
}

// Example usage
const groupsToSetup = [
  "Front of House",
  "Back of House", 
  "Management",
  "Part-time Staff",
  "Full-time Staff"
];

const setupResults = await setupEmployeeGroups(groupsToSetup);
console.log(`Created: ${setupResults.created.length}`);
console.log(`Already existed: ${setupResults.existing.length}`);
console.log(`Failed: ${setupResults.failed.length}`);
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Employee group created successfully |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Application isn't assigned to the appropriate scope |
| 429 | Too Many Requests - Rate limit exceeded |

## Rate Limits

- **Per Portal**: 20 requests/second, 750 requests/minute
- **Per Client ID**: 100 requests/second, 2000 requests/minute

---

## Common Use Cases

### Organizational Structure
Employee groups are commonly used for:
- **Department Organization**: Group employees by department (Kitchen, Front of House, Management)
- **Role-Based Access**: Control permissions and access based on employee groups
- **Scheduling Categories**: Organize scheduling by employee groups
- **Reporting Segmentation**: Generate reports segmented by employee groups

### Integration Notes
- Employee groups are referenced by employees via `employeeGroups` arrays
- Groups can be used for filtering and organizing employees in various endpoints
- Group names should be descriptive and reflect organizational structure
- Groups are typically created during initial system setup

## Related Endpoints
- **Employees API**: References employee groups in employee records
- **Departments API**: Works alongside employee groups for organizational structure
- **Scheduling API**: Uses employee groups for shift assignment and filtering

---

## Best Practices

### Naming Conventions
- Use clear, descriptive names that reflect the group's purpose
- Consider using consistent naming patterns across your organization
- Avoid special characters that might cause issues in integrations

### Organizational Design
- Plan your employee group structure before implementation
- Consider how groups will be used for permissions and scheduling
- Keep the number of groups manageable for administrative purposes
- Document the purpose and membership criteria for each group