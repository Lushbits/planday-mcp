# Planday HR API - Skills

## Overview

The Planday HR API Skills endpoint provides comprehensive management of employee skills within the workforce administration system. Skills allow organizations to define competencies, certifications, and capabilities that can be assigned to employees and required for specific positions or shifts.

**Base URL:** `https://openapi.planday.com/hr/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Skill Object

| Field | Type | Description |
|-------|------|-------------|
| `skillId` | integer | Unique ID of the skill |
| `name` | string | Skill name |
| `description` | string | Skill description |
| `isTimeLimited` | boolean | Whether the skill has a time-based expiration |

### Skill Input Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Skill name |
| `description` | string | | Skill description |
| `isTimeLimited` | boolean | ✓ | Whether the skill has a time-based expiration |

---

## Endpoints

### GET /skills - List Skills

Get a list of skills available on the portal which can be used for scheduled shifts or assigned to employees.

**Required Scope:** `EmployeeReadSkillRead`

#### Example Request

```http
GET /hr/v1.0/skills
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
[
  {
    "skillId": 1,
    "name": "Food Safety Certification",
    "description": "Valid food safety handling certification required for kitchen work",
    "isTimeLimited": true
  },
  {
    "skillId": 2,
    "name": "POS System Operation",
    "description": "Ability to operate point-of-sale system for customer transactions",
    "isTimeLimited": false
  },
  {
    "skillId": 3,
    "name": "Cash Handling",
    "description": "Experience with cash register operation and money handling procedures",
    "isTimeLimited": false
  },
  {
    "skillId": 4,
    "name": "Bartending License",
    "description": "Valid alcohol service license for bartending positions",
    "isTimeLimited": true
  }
]
```

---

### POST /skills - Create Skill

Create a new skill on the portal.

**Required Scope:** `skill:create`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Skill name |
| `description` | string | | Skill description |
| `isTimeLimited` | boolean | ✓ | Whether the skill has a time-based expiration |

#### Example Request

```http
POST /hr/v1.0/skills
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "name": "Customer Service Excellence",
  "description": "Advanced customer service training and certification",
  "isTimeLimited": true
}
```

#### Response

```
204 No Content
```

---

### PUT /skills - Update Skill

Update the name, description and time limited status of a skill by providing the skill ID and the new values.

**Required Scope:** `skill:update`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `skillId` | integer | Required. Skill ID to update |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Skill name |
| `description` | string | | Skill description |
| `isTimeLimited` | boolean | ✓ | Whether the skill has a time-based expiration |

#### Example Request

```http
PUT /hr/v1.0/skills?skillId=1
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "name": "Advanced Food Safety Certification",
  "description": "Updated food safety certification with advanced requirements for senior kitchen staff",
  "isTimeLimited": true
}
```

#### Response

```
204 No Content
```

---

### DELETE /skills - Delete Skill

Delete a skill by providing the skill ID.

**Required Scope:** `skill:delete`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `skillId` | integer | Required. Skill ID to delete |

#### Example Request

```http
DELETE /hr/v1.0/skills?skillId=5
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```
204 No Content
```

---

## Usage Examples

### Get All Available Skills

```javascript
// Get all skills available on the portal
const skills = await getSkills();

console.log(`Found ${skills.length} skills available`);

skills.forEach(skill => {
  const timeLimited = skill.isTimeLimited ? '(Time Limited)' : '';
  console.log(`${skill.name} ${timeLimited}: ${skill.description}`);
});
```

### Create Skills for Different Categories

```javascript
// Create skills for various job categories
const skillsToCreate = [
  {
    name: "HACCP Certification",
    description: "Hazard Analysis Critical Control Points food safety certification",
    isTimeLimited: true
  },
  {
    name: "Conflict Resolution",
    description: "Training in customer conflict resolution and de-escalation techniques",
    isTimeLimited: false
  },
  {
    name: "Wine Knowledge",
    description: "Comprehensive knowledge of wine varieties, pairings, and service",
    isTimeLimited: false
  },
  {
    name: "First Aid Certification",
    description: "Current first aid and CPR certification",
    isTimeLimited: true
  }
];

const createdSkills = [];
for (const skillData of skillsToCreate) {
  try {
    await createSkill(skillData);
    createdSkills.push(skillData.name);
    console.log(`Created skill: ${skillData.name}`);
  } catch (error) {
    console.error(`Failed to create skill '${skillData.name}':`, error.message);
  }
}

console.log(`Successfully created ${createdSkills.length} skills`);
```

### Update Skill Information

```javascript
// Update skill with new requirements
await updateSkill(1, {
  name: "Enhanced Food Safety Certification",
  description: "Updated food safety certification meeting latest health department requirements",
  isTimeLimited: true
});

console.log("Skill updated successfully");
```

### Skill Management System

```javascript
// Complete skill management workflow
class SkillManager {
  async getAllSkills() {
    return await getSkills();
  }
  
  async createSkillIfNotExists(skillData) {
    const existingSkills = await this.getAllSkills();
    const existingSkill = existingSkills.find(s => s.name === skillData.name);
    
    if (existingSkill) {
      console.log(`Skill '${skillData.name}' already exists with ID: ${existingSkill.skillId}`);
      return existingSkill;
    }
    
    await createSkill(skillData);
    console.log(`Created new skill: ${skillData.name}`);
    
    // Get updated list to return the new skill with ID
    const updatedSkills = await this.getAllSkills();
    return updatedSkills.find(s => s.name === skillData.name);
  }
  
  async updateSkillInfo(skillId, newData) {
    try {
      await updateSkill(skillId, newData);
      console.log(`Updated skill ${skillId} successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to update skill ${skillId}:`, error.message);
      return false;
    }
  }
  
  async deleteSkillSafely(skillId) {
    try {
      // Get skill details before deletion
      const skills = await this.getAllSkills();
      const skill = skills.find(s => s.skillId === skillId);
      
      if (!skill) {
        console.log(`Skill with ID ${skillId} not found`);
        return false;
      }
      
      await deleteSkill(skillId);
      console.log(`Successfully deleted skill: ${skill.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete skill ${skillId}:`, error.message);
      return false;
    }
  }
  
  getSkillsByCategory() {
    return this.getAllSkills().then(skills => {
      const categories = {
        certifications: skills.filter(s => s.isTimeLimited),
        permanentSkills: skills.filter(s => !s.isTimeLimited),
        safety: skills.filter(s => s.name.toLowerCase().includes('safety') || 
                               s.name.toLowerCase().includes('certification')),
        technical: skills.filter(s => s.name.toLowerCase().includes('system') || 
                                 s.name.toLowerCase().includes('pos'))
      };
      return categories;
    });
  }
}

// Usage example
const skillManager = new SkillManager();

// Setup organizational skills
const organizationalSkills = [
  {
    name: "Team Leadership",
    description: "Ability to lead and motivate team members",
    isTimeLimited: false
  },
  {
    name: "Health & Safety Training",
    description: "Current workplace health and safety certification",
    isTimeLimited: true
  },
  {
    name: "Multi-lingual Communication",
    description: "Ability to communicate in multiple languages",
    isTimeLimited: false
  }
];

for (const skill of organizationalSkills) {
  await skillManager.createSkillIfNotExists(skill);
}

// Categorize existing skills
const skillCategories = await skillManager.getSkillsByCategory();
console.log('Skills by category:', skillCategories);
```

### Employee Skill Assignment Integration

```javascript
// Integrate skills with employee management
class EmployeeSkillIntegration {
  constructor() {
    this.skillManager = new SkillManager();
  }
  
  async validateEmployeeSkills(employeeSkillIds) {
    const allSkills = await this.skillManager.getAllSkills();
    const validSkills = [];
    const invalidSkills = [];
    
    employeeSkillIds.forEach(skillId => {
      const skill = allSkills.find(s => s.skillId === skillId);
      if (skill) {
        validSkills.push(skill);
      } else {
        invalidSkills.push(skillId);
      }
    });
    
    return {
      validSkills,
      invalidSkills,
      timeLimitedSkills: validSkills.filter(s => s.isTimeLimited)
    };
  }
  
  async getEmployeesWithSkill(skillId) {
    // This would integrate with the employees API
    const employees = await getEmployees({ limit: 50 });
    return employees.data.filter(emp => 
      emp.skillIds && emp.skillIds.includes(skillId)
    );
  }
  
  async generateSkillMatrix() {
    const skills = await this.skillManager.getAllSkills();
    const employees = await getEmployees({ limit: 50 });
    
    const matrix = {};
    
    skills.forEach(skill => {
      matrix[skill.name] = {
        skillId: skill.skillId,
        description: skill.description,
        isTimeLimited: skill.isTimeLimited,
        employeeCount: 0,
        employees: []
      };
    });
    
    employees.data.forEach(employee => {
      if (employee.skillIds) {
        employee.skillIds.forEach(skillId => {
          const skill = skills.find(s => s.skillId === skillId);
          if (skill && matrix[skill.name]) {
            matrix[skill.name].employeeCount++;
            matrix[skill.name].employees.push({
              id: employee.id,
              name: `${employee.firstName} ${employee.lastName}`
            });
          }
        });
      }
    });
    
    return matrix;
  }
}

// Usage
const skillIntegration = new EmployeeSkillIntegration();

// Validate skills before assigning to employee
const validation = await skillIntegration.validateEmployeeSkills([1, 2, 3, 999]);
console.log('Skill validation result:', validation);

// Generate skill distribution report
const skillMatrix = await skillIntegration.generateSkillMatrix();
console.log('Skill matrix:', skillMatrix);
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Request completed successfully |
| 204 | No Content - Operation completed successfully |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Application isn't assigned to the appropriate scope |
| 429 | Too Many Requests - Rate limit exceeded |

## Rate Limits

- **Per Portal**: 20 requests/second, 750 requests/minute
- **Per Client ID**: 100 requests/second, 2000 requests/minute

---

## Common Use Cases

### Skill Management
Skills are commonly used for:
- **Employee Qualifications**: Track employee competencies and certifications
- **Position Requirements**: Define required skills for specific job positions
- **Shift Scheduling**: Ensure employees with appropriate skills are scheduled
- **Training Planning**: Identify skill gaps and training needs
- **Compliance Tracking**: Monitor time-limited certifications and renewals

### Certification Management
Use time-limited skills for:
- **Safety Certifications**: Food safety, workplace safety, first aid
- **Professional Licenses**: Alcohol service, professional certifications
- **Training Renewals**: Skills that require periodic renewal
- **Compliance Monitoring**: Track expiration dates and renewal requirements

### Operational Planning
Skills support:
- **Workforce Planning**: Ensure adequate skill coverage across shifts
- **Quality Assurance**: Match skilled employees to appropriate tasks
- **Cross-Training**: Identify opportunities for skill development
- **Performance Management**: Track skill acquisition and development

---

## Integration Notes

- Skills are referenced by employees via `skillIds` arrays in employee records
- Skill IDs are unique within the portal but may vary between organizations
- Time-limited skills require additional tracking for expiration management
- Skills can be assigned to positions to define job requirements
- The skills list is typically managed by HR administrators
- Skills are used in scheduling systems to match qualified employees to shifts

## Related Endpoints

- **Employees API**: References skills in employee records via `skillIds`
- **Positions API**: May reference skills for position requirements
- **Scheduling API**: Uses skills for shift assignment and filtering

---

## Best Practices

### Skill Design
- Use clear, descriptive names that are easily understood
- Provide comprehensive descriptions explaining skill requirements
- Set `isTimeLimited` appropriately for certifications vs. permanent skills
- Consider how skills will be used in scheduling and position management

### Data Management
- Regularly review and update skill descriptions
- Monitor time-limited skills for renewal requirements
- Archive or remove obsolete skills that are no longer relevant
- Maintain consistency in skill naming conventions

### Integration Strategy
- Validate skill IDs before assigning to employees
- Implement skill expiration tracking for time-limited skills
- Use skills data for workforce planning and gap analysis
- Consider skill hierarchies and prerequisite relationships

### Performance Optimization
- Cache skills data as it changes infrequently
- Use bulk operations when creating multiple skills
- Consider the impact of skill changes on existing employee assignments
- Implement proper error handling for skill operations