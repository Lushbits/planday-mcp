# Planday HR API - Employee Types

## Overview

The Planday HR API Employee Types endpoint provides access to available employee type classifications within the workforce administration system. Employee types allow for categorizing employees based on their employment status, such as full-time, part-time, or intern positions.

**Base URL:** `https://openapi.planday.com/hr/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Employee Type Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique ID of the employee type |
| `name` | string | Employee type name |
| `description` | string | Employee type description |

---

## Endpoints

### GET /employeetypes - List Employee Types

Get a paginated list of available employee types.

**Required Scope:** `employeetype:read`

#### Example Request

```http
GET /hr/v1.0/employeetypes
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "paging": {
    "offset": 0,
    "limit": 50,
    "total": 3
  },
  "data": [
    {
      "id": 71285,
      "name": "Intern",
      "description": "Temporary intern position for students or new graduates"
    },
    {
      "id": 71286,
      "name": "Part-time",
      "description": "Part-time employee working less than full-time hours"
    },
    {
      "id": 71287,
      "name": "Full-time",
      "description": "Full-time employee working standard business hours"
    }
  ]
}
```

---

## Usage Examples

### Get All Employee Types

```javascript
// Get all available employee types
const employeeTypes = await getEmployeeTypes();

console.log(`Found ${employeeTypes.paging.total} employee types`);

employeeTypes.data.forEach(type => {
  console.log(`${type.name} (ID: ${type.id}): ${type.description}`);
});
```

### Create Employee Type Lookup Map

```javascript
// Create a lookup map for employee types
const employeeTypes = await getEmployeeTypes();

const typeMap = {};
employeeTypes.data.forEach(type => {
  typeMap[type.id] = {
    name: type.name,
    description: type.description
  };
});

// Usage example
const employeeTypeId = 71287;
console.log(`Employee Type: ${typeMap[employeeTypeId].name}`);
console.log(`Description: ${typeMap[employeeTypeId].description}`);
```

### Filter Employees by Type

```javascript
// Use employee types to categorize employees
const employeeTypes = await getEmployeeTypes();
const employees = await getEmployees({ limit: 50 });

const employeesByType = {};

employeeTypes.data.forEach(type => {
  employeesByType[type.name] = employees.data.filter(emp => 
    emp.employeeTypeId === type.id
  );
});

// Display summary
Object.keys(employeesByType).forEach(typeName => {
  console.log(`${typeName}: ${employeesByType[typeName].length} employees`);
});
```

### Employee Type Validation

```javascript
// Validate employee type before creating/updating employee
async function validateEmployeeType(employeeTypeId) {
  const employeeTypes = await getEmployeeTypes();
  const validType = employeeTypes.data.find(type => type.id === employeeTypeId);
  
  if (!validType) {
    throw new Error(`Invalid employee type ID: ${employeeTypeId}`);
  }
  
  return validType;
}

// Usage in employee creation
async function createEmployeeWithValidation(employeeData) {
  if (employeeData.employeeTypeId) {
    const validType = await validateEmployeeType(employeeData.employeeTypeId);
    console.log(`Creating employee with type: ${validType.name}`);
  }
  
  return await createEmployee(employeeData);
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

## Common Use Cases

### Employee Classification
Employee types are commonly used for:
- **Employment Status**: Classify employees as full-time, part-time, or intern
- **Benefits Eligibility**: Determine eligibility for benefits based on employee type
- **Scheduling Rules**: Apply different scheduling rules based on employment type
- **Payroll Processing**: Handle different payroll rules for different employee types

### Reporting and Analytics
Use employee types for:
- **Workforce Analysis**: Analyze workforce composition by employment type
- **Compliance Reporting**: Report on different categories of employees
- **Budget Planning**: Plan staffing costs based on employee type mix
- **HR Metrics**: Track hiring trends by employee type

### Integration Support
Employee types help with:
- **Form Validation**: Validate employee type selections in forms
- **Data Consistency**: Ensure consistent employee categorization
- **System Integration**: Map employee types to external HR systems
- **User Interface**: Populate dropdowns and selection lists

---

## Integration Notes

- Employee types are referenced by employees via the `employeeTypeId` field
- Types are typically set during employee creation and updated during role changes
- Employee type IDs are consistent across the portal but may vary between organizations
- Types define fundamental employment characteristics that affect scheduling and payroll
- The list of available types is generally stable and changes infrequently

## Related Endpoints

- **Employees API**: References employee types in employee records
- **Employee Groups API**: Works alongside employee types for organizational structure
- **Scheduling API**: May use employee types for scheduling rules and restrictions

---

## Best Practices

### Data Management
- Cache employee types data as it changes infrequently
- Validate employee type IDs before using them in employee operations
- Use employee type names for display purposes, IDs for data operations
- Consider employee types when designing employee management workflows

### Integration Design
- Always check available employee types before hardcoding type IDs
- Handle cases where expected employee types may not be available
- Use descriptive error messages when employee type validation fails
- Consider the impact of employee type changes on existing employees

### User Experience
- Present employee types in a user-friendly format (name + description)
- Provide clear explanations of what each employee type means
- Consider the business implications when allowing employee type changes
- Ensure consistent employee type usage across all related systems