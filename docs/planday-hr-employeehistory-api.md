# Planday HR API - Employee History

## Overview

The Planday HR API Employee History endpoint provides access to detailed change history for employee accounts. This endpoint allows tracking of all modifications made to employee records, including what changed, when it changed, and who made the changes.

**Base URL:** `https://openapi.planday.com/hr/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Employee History Object

| Field | Type | Description |
|-------|------|-------------|
| `op` | string | Name of the executed operation |
| `path` | string | Name of the property changed |
| `value` | string | Change value |
| `modificationDateTime` | string (datetime) | Modification date and time |
| `modifiedBy` | integer | Identifier of the user who applied the change |
| `modifiedByUserGuid` | string | GUID of the user who applied the change |

---

## Endpoints

### GET /employees/{employeeId}/history - Get Employee Change History

Get a paginated list of changes made to a specific employee account.

**Required Scope:** `employee:history`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `employeeId` | integer | Required. Employee ID to retrieve history for |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDateTime` | string (datetime) | Only records with creation date >= startDateTime (YYYY-MM-DD format) |
| `endDateTime` | string (datetime) | Only records with creation date <= endDateTime (YYYY-MM-DD format) |
| `offset` | integer | Skip first N records for pagination (default: 0) |
| `limit` | integer | Maximum records to return (max 50, default: 50) |

#### Example Request

```http
GET /hr/v1.0/employees/614517/history?startDateTime=2025-01-01&endDateTime=2025-06-06&limit=20&offset=0
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
      "op": "replace",
      "path": "jobTitle",
      "value": "Senior Server",
      "modificationDateTime": "2025-06-06T14:30:00",
      "modifiedBy": 451874,
      "modifiedByUserGuid": "6d4ce219-839f-4092-a01d-d8a033fcb21a"
    },
    {
      "op": "replace",
      "path": "cellPhone",
      "value": "5551234567",
      "modificationDateTime": "2025-06-05T09:15:00",
      "modifiedBy": 614517,
      "modifiedByUserGuid": "8a5f3b2c-947e-4123-b89d-f1e2d3c4b5a6"
    },
    {
      "op": "add",
      "path": "departments",
      "value": "6324",
      "modificationDateTime": "2025-06-01T10:00:00",
      "modifiedBy": 451874,
      "modifiedByUserGuid": "6d4ce219-839f-4092-a01d-d8a033fcb21a"
    },
    {
      "op": "replace",
      "path": "email",
      "value": "mindy.haynes@newdomain.com",
      "modificationDateTime": "2025-05-28T16:45:00",
      "modifiedBy": 614517,
      "modifiedByUserGuid": "8a5f3b2c-947e-4123-b89d-f1e2d3c4b5a6"
    }
  ]
}
```

---

## Usage Examples

### Get Complete Employee History

```javascript
// Get all changes for a specific employee
const employeeHistory = await getEmployeeHistory(614517, {
  limit: 50,
  offset: 0
});

console.log(`Found ${employeeHistory.paging.total} changes for employee 614517`);

employeeHistory.data.forEach(change => {
  console.log(`${change.modificationDateTime}: ${change.op} ${change.path} = ${change.value}`);
});
```

### Get Recent Changes

```javascript
// Get changes from the last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const recentChanges = await getEmployeeHistory(614517, {
  startDateTime: thirtyDaysAgo.toISOString().split('T')[0],
  limit: 50
});

console.log(`${recentChanges.paging.total} changes in the last 30 days`);
```

### Track Specific Field Changes

```javascript
// Track changes to specific fields
const allHistory = await getAllEmployeeHistory(614517); // Helper function with pagination

const jobTitleChanges = allHistory.filter(change => change.path === 'jobTitle');
const departmentChanges = allHistory.filter(change => change.path === 'departments');

console.log(`Job title changed ${jobTitleChanges.length} times`);
console.log(`Department assignments changed ${departmentChanges.length} times`);

// Show job title progression
jobTitleChanges.forEach(change => {
  console.log(`${change.modificationDateTime}: Job title changed to "${change.value}"`);
});
```

### Audit Trail Analysis

```javascript
// Analyze who made changes to an employee
const history = await getAllEmployeeHistory(614517);

const changesByUser = {};
history.forEach(change => {
  const userId = change.modifiedBy;
  if (!changesByUser[userId]) {
    changesByUser[userId] = {
      count: 0,
      changes: []
    };
  }
  changesByUser[userId].count++;
  changesByUser[userId].changes.push(change);
});

// Display audit summary
Object.keys(changesByUser).forEach(userId => {
  const userChanges = changesByUser[userId];
  console.log(`User ${userId} made ${userChanges.count} changes`);
  
  // Show most recent change by this user
  const mostRecent = userChanges.changes[0];
  console.log(`  Most recent: ${mostRecent.modificationDateTime} - ${mostRecent.path}`);
});
```

### Date Range Analysis

```javascript
// Analyze changes within a specific period
async function analyzeChangesInPeriod(employeeId, startDate, endDate) {
  const history = await getEmployeeHistory(employeeId, {
    startDateTime: startDate,
    endDateTime: endDate,
    limit: 50
  });
  
  const analysis = {
    totalChanges: history.paging.total,
    fieldChanges: {},
    operationTypes: {},
    uniqueModifiers: new Set()
  };
  
  history.data.forEach(change => {
    // Count changes by field
    analysis.fieldChanges[change.path] = (analysis.fieldChanges[change.path] || 0) + 1;
    
    // Count operation types
    analysis.operationTypes[change.op] = (analysis.operationTypes[change.op] || 0) + 1;
    
    // Track unique modifiers
    analysis.uniqueModifiers.add(change.modifiedBy);
  });
  
  analysis.uniqueModifiers = analysis.uniqueModifiers.size;
  
  return analysis;
}

// Usage example
const quarterlyAnalysis = await analyzeChangesInPeriod(614517, '2025-04-01', '2025-06-30');
console.log('Quarterly Change Analysis:', quarterlyAnalysis);
```

### Complete History with Pagination

```javascript
// Helper function to get all history with pagination
async function getAllEmployeeHistory(employeeId, filters = {}) {
  let allHistory = [];
  let offset = 0;
  const limit = 50;
  
  do {
    const response = await getEmployeeHistory(employeeId, {
      ...filters,
      limit,
      offset
    });
    
    allHistory.push(...response.data);
    offset += limit;
    
    console.log(`Loaded ${allHistory.length} of ${response.paging.total} history records`);
  } while (offset < response.paging.total);
  
  return allHistory;
}

// Generate comprehensive employee change report
async function generateEmployeeChangeReport(employeeId) {
  const fullHistory = await getAllEmployeeHistory(employeeId);
  
  const report = {
    employeeId,
    totalChanges: fullHistory.length,
    firstChange: fullHistory[fullHistory.length - 1]?.modificationDateTime,
    lastChange: fullHistory[0]?.modificationDateTime,
    mostChangedFields: {},
    changesByMonth: {},
    modifiers: {}
  };
  
  fullHistory.forEach(change => {
    // Track most changed fields
    report.mostChangedFields[change.path] = (report.mostChangedFields[change.path] || 0) + 1;
    
    // Group changes by month
    const month = change.modificationDateTime.substring(0, 7); // YYYY-MM
    report.changesByMonth[month] = (report.changesByMonth[month] || 0) + 1;
    
    // Track who made changes
    report.modifiers[change.modifiedBy] = (report.modifiers[change.modifiedBy] || 0) + 1;
  });
  
  return report;
}

// Usage
const changeReport = await generateEmployeeChangeReport(614517);
console.log('Employee Change Report:', changeReport);
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Request completed successfully |
| 400 | Bad Request - Employee ID is invalid |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Application isn't assigned to the appropriate scope |
| 404 | Not Found - Employee change history for given ID doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |

## Rate Limits

- **Per Portal**: 20 requests/second, 750 requests/minute
- **Per Client ID**: 100 requests/second, 2000 requests/minute

---

## Common Use Cases

### Compliance and Auditing
Employee history is essential for:
- **Audit Trails**: Track all changes to employee records for compliance
- **Change Verification**: Verify who made specific changes and when
- **Data Integrity**: Ensure employee data changes are properly tracked
- **Compliance Reporting**: Generate reports for regulatory requirements

### HR Analytics
Use history data for:
- **Change Pattern Analysis**: Identify frequently modified employee fields
- **User Activity Tracking**: Monitor which users make the most changes
- **Data Quality Assessment**: Identify fields that change frequently
- **Timeline Analysis**: Understand employee record evolution over time

### Dispute Resolution
History helps with:
- **Change Documentation**: Provide evidence of when changes were made
- **User Accountability**: Identify who made specific changes
- **Rollback Information**: Understand previous values for potential rollbacks
- **Timeline Reconstruction**: Recreate sequence of events for investigations

### System Integration
History data supports:
- **Synchronization**: Track changes for external system synchronization
- **Backup Verification**: Verify data integrity across backups
- **Migration Planning**: Understand data change patterns for migrations
- **Performance Monitoring**: Identify high-change employees or fields

---

## Integration Notes

- History records are created automatically when employee data changes
- Changes are tracked at the field level with specific operation types
- User identification is provided through both ID and GUID for flexibility
- Date filtering supports both full datetime and date-only formats
- Pagination is essential for employees with extensive change history
- History data is read-only and cannot be modified through the API

## Related Endpoints

- **Employees API**: The source of the data being tracked in history
- **Employee Groups API**: Group changes may appear in employee history
- **Employee Types API**: Type changes are tracked in employee history

---

## Best Practices

### Performance Optimization
- Use date filtering to limit result sets for better performance
- Implement pagination for employees with extensive change history
- Cache history data when possible for frequently accessed records
- Consider the performance impact of retrieving full history for multiple employees

### Data Analysis
- Focus on specific date ranges for performance and relevance
- Group changes by time periods for trend analysis
- Track the most frequently changed fields to identify data quality issues
- Monitor change patterns to identify potential process improvements

### Security and Privacy
- Ensure proper authorization before accessing employee history
- Log access to employee history for audit purposes
- Consider data retention policies for historical change data
- Protect sensitive information in change values

### Integration Design
- Handle pagination properly for complete history retrieval
- Implement error handling for missing or inaccessible employee records
- Consider rate limiting when processing history for multiple employees
- Design efficient filtering strategies for large datasets