# Planday Scheduling API - Skills

## Overview

The Planday Scheduling API Skills endpoint provides access to skill definitions used for employee scheduling and position requirements. Skills allow organizations to match employees with appropriate positions based on competencies, certifications, and capabilities.

**Base URL:** `https://openapi.planday.com/scheduling/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Skill Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier of the skill |
| `name` | string | Name of the skill |
| `isRemoved` | boolean | Whether the skill has been removed from active use |
| `isDeleted` | boolean | Whether the skill has been deleted |
| `description` | string | Detailed description of the skill |
| `employeeGroupIds` | array[integer] | List of employee group IDs that can use this skill |
| `allEmployeeGroups` | boolean | Whether this skill applies to all employee groups |

### Skill Status

Skills have two status flags that control their availability:

- **Active Skills**: `isRemoved: false` and `isDeleted: false`
- **Removed Skills**: `isRemoved: true` but `isDeleted: false` (soft delete)
- **Deleted Skills**: `isDeleted: true` (hard delete, typically not returned)

---

## Endpoints

### GET /skills - List Available Skills

Returns a paginated list of skills that can be used for scheduling, filtered by department and employee group.

**Required Scope:** `shifttype:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `DepartmentId` | integer | **Required.** Department ID to filter skills |
| `EmployeeGroupId` | integer | Employee Group ID to filter skills |
| `Offset` | integer | Skip first N records for pagination purposes |
| `Limit` | integer | Maximum number of records to return |

#### Example Request

```http
GET /scheduling/v1.0/skills?DepartmentId=5&EmployeeGroupId=3&Limit=20&Offset=0
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "paging": {
    "offset": 0,
    "limit": 20,
    "total": 35
  },
  "data": [
    {
      "id": 1,
      "name": "Food Safety Certification",
      "isRemoved": false,
      "isDeleted": false,
      "description": "Valid food safety handling certification required for kitchen work",
      "employeeGroupIds": [3, 4],
      "allEmployeeGroups": false
    },
    {
      "id": 2,
      "name": "POS System Operation",
      "isRemoved": false,
      "isDeleted": false,
      "description": "Ability to operate point-of-sale system for customer transactions",
      "employeeGroupIds": [2, 3],
      "allEmployeeGroups": false
    },
    {
      "id": 3,
      "name": "Cash Handling",
      "isRemoved": false,
      "isDeleted": false,
      "description": "Experience with cash register operation and money handling procedures",
      "employeeGroupIds": [],
      "allEmployeeGroups": true
    },
    {
      "id": 4,
      "name": "Bartending License",
      "isRemoved": false,
      "isDeleted": false,
      "description": "Valid alcohol service license for bartending positions",
      "employeeGroupIds": [2],
      "allEmployeeGroups": false
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

### Get All Skills for Department

```javascript
// Get all skills available for a specific department
const departmentSkills = await getSkills({
  DepartmentId: 5,
  Limit: 50,
  Offset: 0
});

console.log(`Found ${departmentSkills.paging.total} skills for department 5`);

// Filter active skills only
const activeSkills = departmentSkills.data.filter(skill => 
  !skill.isRemoved && !skill.isDeleted
);

console.log(`${activeSkills.length} active skills available`);
```

### Get Skills by Employee Group

```javascript
// Get skills specific to an employee group
const groupSkills = await getSkills({
  DepartmentId: 5,
  EmployeeGroupId: 3,
  Limit: 50
});

// Separate universal vs. group-specific skills
const universalSkills = groupSkills.data.filter(skill => skill.allEmployeeGroups);
const groupSpecificSkills = groupSkills.data.filter(skill => 
  !skill.allEmployeeGroups && skill.employeeGroupIds.includes(3)
);

console.log(`Universal skills: ${universalSkills.length}`);
console.log(`Group-specific skills: ${groupSpecificSkills.length}`);
```

### Categorize Skills by Type

```javascript
// Get all department skills and categorize them
const allSkills = await getSkills({
  DepartmentId: 5,
  Limit: 100
});

const skillCategories = {
  certifications: [],
  technical: [],
  safety: [],
  customer_service: [],
  other: []
};

allSkills.data.forEach(skill => {
  const name = skill.name.toLowerCase();
  const description = skill.description.toLowerCase();
  
  if (name.includes('certification') || name.includes('license')) {
    skillCategories.certifications.push(skill);
  } else if (name.includes('pos') || name.includes('system') || description.includes('software')) {
    skillCategories.technical.push(skill);
  } else if (description.includes('safety') || description.includes('hazard')) {
    skillCategories.safety.push(skill);
  } else if (description.includes('customer') || description.includes('service')) {
    skillCategories.customer_service.push(skill);
  } else {
    skillCategories.other.push(skill);
  }
});

console.log('Skills by category:', skillCategories);
```

### Pagination Through All Skills

```javascript
// Get all skills with pagination
let allSkills = [];
let offset = 0;
const limit = 50;
const departmentId = 5;

do {
  const response = await getSkills({
    DepartmentId: departmentId,
    Limit: limit,
    Offset: offset
  });
  
  allSkills.push(...response.data);
  offset += limit;
} while (offset < response.paging.total);

console.log(`Retrieved ${allSkills.length} total skills for department ${departmentId}`);
```

---

## Common Use Cases

### Position Requirements
Skills are commonly used for:
- **Position Matching**: Ensure employees have required skills for specific positions
- **Shift Assignment**: Filter available employees by skill requirements
- **Training Planning**: Identify skill gaps and training needs
- **Compliance**: Track certifications and licenses required for specific roles

### Employee Management
Use skills to:
- **Competency Tracking**: Monitor employee skills and certifications
- **Career Development**: Plan skill development paths
- **Performance Evaluation**: Assess skill proficiency levels
- **Recruitment**: Define skill requirements for new hires

### Operational Planning
Implement skills for:
- **Scheduling Optimization**: Match skilled employees to appropriate shifts
- **Quality Assurance**: Ensure qualified staff for specialized tasks
- **Safety Compliance**: Require safety certifications for hazardous work
- **Customer Service**: Assign experienced staff to customer-facing roles

### Organizational Structure
Configure skills across:
- **Department Specialization**: Different skills for kitchen vs. front-of-house
- **Employee Groups**: Tier-specific skills (entry-level vs. management)
- **Universal Requirements**: Skills needed across all positions
- **Compliance Requirements**: Industry-specific certifications and licenses

---

## Integration Notes

- **Position Requirements**: Skills are referenced by positions via `skillIds` arrays
- **Employee Qualifications**: Employees are assigned skills they possess
- **Shift Filtering**: Only employees with required skills can be assigned to positions
- **Department Scope**: Skills are filtered by department for relevance
- **Employee Group Access**: Skills can be restricted to specific employee groups
- **Status Management**: Removed/deleted skills are handled for historical data
- **Compliance Tracking**: Skills support certification and license management

## Related Endpoints

- **Positions API**: Uses `skillIds` to define position requirements
- **Shifts API**: Inherits skill requirements from assigned positions
- **Employees API**: Links employees to their possessed skills
- **Departments API**: Provides department context for skill filtering
- **Employee Groups API**: Manages skill access by employee group level

---

## Best Practices

### Skill Definition
- Use clear, descriptive skill names that are easily understood
- Provide detailed descriptions explaining skill requirements
- Categorize skills logically (certifications, technical, safety, etc.)
- Keep skill definitions current and relevant to business needs

### Access Control
- Use `employeeGroupIds` to restrict skills to appropriate organizational levels
- Set `allEmployeeGroups: true` for universal requirements
- Consider department-specific vs. organization-wide skills
- Regular review of skill assignments and requirements

### Compliance Management
- Track expiration dates for certifications and licenses
- Implement renewal processes for time-sensitive skills
- Maintain audit trails for compliance requirements
- Regular verification of employee skill qualifications

### Performance Optimization
- Use department filtering to reduce irrelevant skill data
- Cache frequently accessed skill lists
- Consider skill categorization for improved user experience
- Regular cleanup of obsolete or unused skills