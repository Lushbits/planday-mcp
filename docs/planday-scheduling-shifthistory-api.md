# Planday Scheduling API - Shift History

## Overview

The Planday Scheduling API Shift History endpoint provides detailed audit trails for individual shifts, tracking all modifications made over time. This endpoint is essential for compliance, auditing, and understanding how shift assignments have evolved.

**Base URL:** `https://openapi.planday.com/scheduling/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Shift History Response Object

| Field | Type | Description |
|-------|------|-------------|
| `paging` | object | Pagination information for the history records |
| `data` | array[HistoryRecord] | Array of historical change records |

### History Record Object

| Field | Type | Description |
|-------|------|-------------|
| `modifiedAt` | string (datetime) | When the modification was made |
| `modifiedBy` | object | Information about who made the change |
| `modifiedBy.id` | integer | ID of the user who made the change |
| `modifiedBy.name` | string | Name of the user who made the change |
| `changes` | array[string] | List of specific changes made to the shift |

### Pagination Object

| Field | Type | Description |
|-------|------|-------------|
| `offset` | integer | Current offset in the result set |
| `limit` | integer | Maximum records returned in this response |
| `total` | integer | Total number of history records available |

---

## Endpoints

### GET /shifts/{shiftId}/history - Get Shift History

Returns a paginated list of all historical changes made to a specific shift.

**Required Scope:** `shift:read`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `shiftId` | integer | Required. Unique identifier of the shift to retrieve history for |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `offset` | integer | Skip first N records for pagination purposes |
| `limit` | integer | Maximum number of records to return (max 50 per request) |

#### Example Request

```http
GET /scheduling/v1.0/shifts/123/history?limit=20&offset=0
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
      "modifiedAt": "2025-06-07T14:30:15Z",
      "modifiedBy": {
        "id": 15,
        "name": "Sarah Manager"
      },
      "changes": [
        "Employee changed from John Smith (ID: 42) to Jane Doe (ID: 43)",
        "Position changed from Server to Lead Server"
      ]
    },
    {
      "modifiedAt": "2025-06-06T09:15:30Z",
      "modifiedBy": {
        "id": 12,
        "name": "Mike Supervisor"
      },
      "changes": [
        "Shift approved for payroll",
        "Status changed from Assigned to Approved"
      ]
    },
    {
      "modifiedAt": "2025-06-05T16:45:00Z",
      "modifiedBy": {
        "id": 42,
        "name": "John Smith"
      },
      "changes": [
        "Employee assigned to shift",
        "Status changed from Open to Assigned"
      ]
    },
    {
      "modifiedAt": "2025-06-01T10:00:00Z",
      "modifiedBy": {
        "id": 15,
        "name": "Sarah Manager"
      },
      "changes": [
        "Shift created",
        "Start time: 08:00",
        "End time: 16:00",
        "Department: Front of House",
        "Position: Server"
      ]
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
| 404 | Not Found - Shift ID does not exist |
| 429 | Too Many Requests - Rate limit exceeded |

## Rate Limits

- **Per Portal**: 20 requests/second, 750 requests/minute
- **Per Client ID**: 100 requests/second, 2000 requests/minute

---

## Usage Examples

### Get Complete Shift History

```javascript
// Get all history for a specific shift
const shiftHistory = await getShiftHistory(123, {
  limit: 50,
  offset: 0
});

console.log(`Found ${shiftHistory.paging.total} history records for shift 123`);

// Display timeline of changes
shiftHistory.data.forEach((record, index) => {
  console.log(`\n${index + 1}. ${record.modifiedAt} - ${record.modifiedBy.name}:`);
  record.changes.forEach(change => {
    console.log(`   • ${change}`);
  });
});
```

### Track Specific User's Modifications

```javascript
// Get history and filter by specific user
const history = await getShiftHistory(123);
const userModifications = history.data.filter(record => 
  record.modifiedBy.id === 15
);

console.log(`User ${userModifications[0]?.modifiedBy.name} made ${userModifications.length} changes`);
```

### Audit Recent Changes

```javascript
// Get recent changes (last 24 hours)
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const history = await getShiftHistory(123);
const recentChanges = history.data.filter(record => 
  new Date(record.modifiedAt) > yesterday
);

console.log(`Recent changes (last 24 hours): ${recentChanges.length}`);
recentChanges.forEach(record => {
  console.log(`${record.modifiedAt} by ${record.modifiedBy.name}:`);
  record.changes.forEach(change => console.log(`  - ${change}`));
});
```

### Pagination Through History

```javascript
// Get all history records using pagination
let allHistory = [];
let offset = 0;
const limit = 50;

do {
  const response = await getShiftHistory(123, { limit, offset });
  allHistory.push(...response.data);
  offset += limit;
} while (offset < response.paging.total);

console.log(`Retrieved complete history: ${allHistory.length} records`);
```

### Generate Audit Report

```javascript
// Create audit report for shift changes
const history = await getShiftHistory(123);

const auditReport = {
  shiftId: 123,
  totalChanges: history.paging.total,
  createdAt: history.data[history.data.length - 1]?.modifiedAt,
  createdBy: history.data[history.data.length - 1]?.modifiedBy.name,
  lastModified: history.data[0]?.modifiedAt,
  lastModifiedBy: history.data[0]?.modifiedBy.name,
  uniqueModifiers: [...new Set(history.data.map(r => r.modifiedBy.name))],
  changesByUser: {}
};

// Count changes by user
history.data.forEach(record => {
  const userName = record.modifiedBy.name;
  if (!auditReport.changesByUser[userName]) {
    auditReport.changesByUser[userName] = 0;
  }
  auditReport.changesByUser[userName] += record.changes.length;
});

console.log('Shift Audit Report:', auditReport);
```

---

## Common Use Cases

### Compliance and Auditing
Use shift history for:
- **Labor Law Compliance**: Track changes to work hours and assignments
- **Audit Trails**: Maintain records of who changed what and when
- **Dispute Resolution**: Resolve conflicts about shift assignments or changes
- **Regulatory Reporting**: Provide detailed change logs for inspections

### Operational Management
Generate insights for:
- **Change Pattern Analysis**: Identify frequently modified shifts
- **User Activity Tracking**: Monitor who makes the most changes
- **Process Improvement**: Understand common reasons for shift modifications
- **Training Needs**: Identify users who make frequent corrections

### Quality Control
Monitor for:
- **Unauthorized Changes**: Track modifications by non-authorized users
- **Frequent Modifications**: Identify shifts that require multiple changes
- **Last-Minute Changes**: Track changes made close to shift dates
- **Change Impact**: Understand how modifications affect operations

### Historical Analysis
Analyze trends in:
- **Scheduling Stability**: Measure how often shifts change after creation
- **User Behavior**: Track modification patterns by different user types
- **Seasonal Patterns**: Identify periods with high change activity
- **Department Differences**: Compare change frequencies across departments

---

## Integration Notes

- **Chronological Order**: History records are typically returned in reverse chronological order (newest first)
- **User Information**: Modified by information links to employee/user records
- **Change Granularity**: Individual field changes are tracked separately
- **Pagination Required**: Use pagination for shifts with extensive history
- **Real-time Updates**: History is updated immediately when changes occur
- **Permission Dependent**: Only users with shift read permissions can view history

## Related Endpoints

- **Shifts API**: The main shift data that generates history records
- **Employees API**: Links to users who made modifications
- **Departments API**: Provides context for shift changes
- **Audit Logs**: May complement shift history with broader system audit trails

---

## Best Practices

### Performance Optimization
- Use appropriate page sizes to balance detail and performance
- Cache frequently accessed history data
- Consider date-based filtering for large shift histories

### Audit Management
- Regular review of change patterns to identify anomalies
- Automated alerts for unauthorized or suspicious changes
- Integration with broader audit and compliance systems

### Data Interpretation
- Consider the business context when analyzing change patterns
- Account for different user roles when interpreting modification data
- Use change history to improve scheduling processes and training

### Security Considerations
- Ensure proper access controls for sensitive history data
- Consider data retention policies for historical records
- Monitor access to audit trails for security purposes