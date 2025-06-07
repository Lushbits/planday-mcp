# Planday Scheduling API - Schedule Day

## Overview

The Planday Scheduling API Schedule Day endpoint provides management of daily schedule information, including day titles, notes, holiday information, and visibility settings. This endpoint allows managers to add context and special information to specific days in the department schedule.

**Base URL:** `https://openapi.planday.com/scheduling/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Schedule Day Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier of the schedule day |
| `date` | string (date) | Date of the schedule day (YYYY-MM-DD format) |
| `title` | string | Title/name for the day (visible to managers and employees) |
| `description` | string | Detailed description or notes for the day (visible to managers only) |
| `isVisible` | boolean | Whether the day information is visible to employees |
| `holiday` | array[Holiday] | List of holidays occurring on this date |
| `lockState` | string | Lock status of the schedule for this day |
| `departmentId` | integer | Department identifier associated with the schedule day |

### Holiday Object

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Name of the holiday |
| `calendarName` | string | Calendar system the holiday belongs to |

### Lock States

- `Unlocked` - Schedule can be modified
- `Locked` - Schedule modifications are restricted
- `Published` - Schedule is finalized and published to employees

---

## Endpoints

### GET /scheduleDay - List Schedule Days

Returns a paginated list of schedule days for a specified department and time period.

**Required Scope:** `shift:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `DepartmentId` | integer | **Required.** Department ID to retrieve schedule days for |
| `From` | string (date) | Start date filter (YYYY-MM-DD format) |
| `To` | string (date) | End date filter (YYYY-MM-DD format) |
| `Offset` | integer | Skip first N records for pagination purposes |
| `Limit` | integer | Maximum number of records to return |

#### Example Request

```http
GET /scheduling/v1.0/scheduleDay?DepartmentId=5&From=2025-06-07&To=2025-06-14&Limit=20&Offset=0
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "paging": {
    "offset": 0,
    "limit": 20,
    "total": 7
  },
  "data": [
    {
      "date": "2025-06-07",
      "title": "Weekend Special Menu",
      "description": "Extra staff needed for weekend brunch service. Prep starts at 7 AM.",
      "isVisible": true,
      "holiday": [],
      "lockState": "Unlocked",
      "departmentId": 5,
      "id": 1001
    },
    {
      "date": "2025-06-08",
      "title": "Father's Day",
      "description": "Expected high volume. All hands on deck. Manager approval required for any changes.",
      "isVisible": true,
      "holiday": [
        {
          "title": "Father's Day",
          "calendarName": "US Holidays"
        }
      ],
      "lockState": "Published",
      "departmentId": 5,
      "id": 1002
    },
    {
      "date": "2025-06-09",
      "title": "Deep Cleaning Day",
      "description": "Scheduled maintenance and deep cleaning. Reduced service hours.",
      "isVisible": false,
      "holiday": [],
      "lockState": "Locked",
      "departmentId": 5,
      "id": 1003
    }
  ]
}
```

---

### PUT /scheduleDay - Update Schedule Day

Update the schedule day information for a specific date and department.

**Required Scope:** `shift:update`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `departmentId` | integer | ✓ | Department ID |
| `date` | string (date) | ✓ | Date to update (YYYY-MM-DD format) |
| `title` | string | | Title for the day |
| `description` | string | | Description or notes (manager-only) |
| `isVisible` | boolean | | Whether information is visible to employees |

#### Example Request

```http
PUT /scheduling/v1.0/scheduleDay
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "departmentId": 5,
  "date": "2025-06-07",
  "title": "Team Building Event",
  "description": "Half-day team building activity. Modified schedule in effect. Please review individual shift times.",
  "isVisible": true
}
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
| 204 | No Content - Update operation successful |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Application isn't assigned to the appropriate scope |
| 429 | Too Many Requests - Rate limit exceeded |

## Rate Limits

- **Per Portal**: 20 requests/second, 750 requests/minute
- **Per Client ID**: 100 requests/second, 2000 requests/minute

---

## Usage Examples

### Get Schedule Days for a Week

```javascript
// Get schedule days for a specific week
const weeklySchedule = await getScheduleDays({
  DepartmentId: 5,
  From: "2025-06-07",
  To: "2025-06-14",
  Limit: 10
});

console.log(`Found ${weeklySchedule.paging.total} schedule days`);

// Filter days with special information
const specialDays = weeklySchedule.data.filter(day => 
  day.title || day.holiday.length > 0
);

console.log(`${specialDays.length} days have special information or holidays`);
```

### Update Day Information

```javascript
// Add special information for a busy day
await updateScheduleDay({
  departmentId: 5,
  date: "2025-06-15",
  title: "Grand Opening Event",
  description: "Extra security and crowd control measures in place. VIP service protocols apply.",
  isVisible: true
});

// Add manager-only notes
await updateScheduleDay({
  departmentId: 5,
  date: "2025-06-16",
  title: "Normal Operations",
  description: "Post-event cleanup required. Check inventory levels. Staff debriefing at 3 PM.",
  isVisible: false
});
```

### Find Holiday Information

```javascript
// Get schedule days and identify holidays
const monthlySchedule = await getScheduleDays({
  DepartmentId: 5,
  From: "2025-06-01",
  To: "2025-06-30"
});

const holidays = monthlySchedule.data.filter(day => day.holiday.length > 0);

holidays.forEach(day => {
  console.log(`${day.date}: ${day.holiday.map(h => h.title).join(', ')}`);
});
```

### Check Lock Status

```javascript
// Monitor schedule lock status for planning
const upcomingDays = await getScheduleDays({
  DepartmentId: 5,
  From: new Date().toISOString().split('T')[0],
  To: "2025-06-30"
});

const lockStatus = {
  unlocked: upcomingDays.data.filter(d => d.lockState === 'Unlocked').length,
  locked: upcomingDays.data.filter(d => d.lockState === 'Locked').length,
  published: upcomingDays.data.filter(d => d.lockState === 'Published').length
};

console.log('Schedule status summary:', lockStatus);
```

---

## Common Use Cases

### Schedule Communication
Schedule days are commonly used for:
- **Special Events**: Communicate special service requirements or events
- **Holiday Information**: Display holiday schedules and special hours
- **Operational Notes**: Share important day-specific information with staff
- **Service Changes**: Notify about modified operations or procedures

### Manager Communication
Use schedule days to:
- **Internal Notes**: Add manager-only operational notes and reminders
- **Staff Instructions**: Provide day-specific guidance for employees
- **Event Planning**: Coordinate special events and requirements
- **Operational Changes**: Communicate schedule modifications and policies

### Visibility Control
Control information visibility to:
- **Public Information**: Share customer-facing information with all staff
- **Internal Notes**: Keep operational details manager-only
- **Selective Sharing**: Control what employees see vs. management-only content
- **Compliance Notes**: Maintain internal records for auditing

### Holiday Management
Track holidays for:
- **Schedule Planning**: Account for holidays in shift planning
- **Pay Calculations**: Identify holiday pay requirements
- **Compliance**: Track required holiday observances
- **Cultural Awareness**: Recognize diverse holiday calendars

---

## Integration Notes

- **Department Scope**: Schedule days are always associated with specific departments
- **Date-Based**: Each schedule day represents a single date within a department
- **Visibility Control**: Managers can control what information employees see
- **Holiday Integration**: Automatic holiday detection from calendar systems
- **Lock State Management**: Schedule publishing and modification controls
- **Audit Trail**: Changes to schedule days are tracked for compliance

## Related Endpoints

- **Shifts API**: Individual shifts occur within schedule days
- **Departments API**: Provides department context for schedule days
- **Employees API**: Employees view schedule day information based on visibility settings
- **Holiday Calendars**: External calendar systems provide holiday information

---

## Best Practices

### Information Management
- Use clear, descriptive titles that employees will understand
- Keep manager-only notes in the description field
- Use visibility settings appropriately for different types of information
- Regular review and cleanup of outdated schedule day information

### Communication Strategy
- Coordinate with shift creation when adding special day information
- Use consistent naming conventions for recurring events
- Consider employee communication preferences when setting visibility
- Plan ahead for known special events and holidays

### Operational Planning
- Monitor lock states when planning schedule changes
- Use holiday information for staffing and pay planning
- Coordinate schedule day updates with shift modifications
- Maintain historical records for compliance and planning

### Performance Considerations
- Use appropriate date ranges to avoid large response sizes
- Cache frequently accessed schedule day information
- Consider department-specific queries for better performance
- Regular cleanup of historical schedule day data