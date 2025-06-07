# Planday Scheduling API - Time and Cost

## Overview

The Planday Scheduling API Time and Cost endpoint provides detailed time and cost information for shifts within specific departments and time periods. This endpoint is essential for labor cost analysis, budget planning, and operational reporting.

**Base URL:** `https://openapi.planday.com/scheduling/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Time and Cost Response Object

| Field | Type | Description |
|-------|------|-------------|
| `data` | object | Container for cost data and formatting information |
| `data.costs` | array[Cost] | Array of cost records for shifts |
| `data.currencySymbol` | string | Currency symbol for the organization (e.g., "$", "€", "£") |
| `data.currencyFormatString` | string | Currency formatting pattern for display |

### Cost Object

| Field | Type | Description |
|-------|------|-------------|
| `shiftId` | integer | Unique identifier of the shift |
| `duration` | string | Duration of the shift in HH:MM:SS format (excluding breaks) |
| `cost` | number | Total cost for the shift |
| `employeeId` | integer | ID of the employee assigned to the shift |
| `date` | string (date) | Date of the shift (YYYY-MM-DD format) |
| `shiftTypeId` | integer | ID of the shift type |
| `positionId` | integer | ID of the position |

### Important Notes

- **Break Time Exclusion**: The duration does not include break time, even if breaks are paid
- **Department Scope**: Data is returned only for the specified department
- **Date Range**: Both `from` and `to` parameters are required and inclusive

---

## Endpoints

### GET /timeandcost/{departmentId} - Get Time and Cost Data

Returns time and cost information for all shifts in the specified department and time period.

**Required Scope:** `timeandcost:read`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `departmentId` | integer | Required. Department ID for which to return scheduled time and cost data |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string (date) | Required. Beginning of time period (YYYY-MM-DD format) |
| `to` | string (date) | Required. End of time period (YYYY-MM-DD format) |

#### Example Request

```http
GET /scheduling/v1.0/timeandcost/5?from=2025-06-07&to=2025-06-14
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
{
  "data": {
    "costs": [
      {
        "shiftId": 123,
        "duration": "8:00:00",
        "cost": 240.00,
        "employeeId": 42,
        "date": "2025-06-07",
        "shiftTypeId": 1,
        "positionId": 8
      },
      {
        "shiftId": 124,
        "duration": "6:30:00",
        "cost": 227.50,
        "employeeId": 43,
        "date": "2025-06-07",
        "shiftTypeId": 2,
        "positionId": 9
      },
      {
        "shiftId": 125,
        "duration": "4:15:00",
        "cost": 102.00,
        "employeeId": 44,
        "date": "2025-06-08",
        "shiftTypeId": 1,
        "positionId": 8
      }
    ],
    "currencySymbol": "$",
    "currencyFormatString": "${0:0.00}"
  }
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

### Get Weekly Labor Costs

```javascript
// Get time and cost data for a specific department for one week
const weeklyData = await getTimeAndCost(5, {
  from: "2025-06-07",
  to: "2025-06-14"
});

console.log(`Found ${weeklyData.data.costs.length} shift records`);
console.log(`Currency: ${weeklyData.data.currencySymbol}`);

// Calculate total cost for the week
const totalCost = weeklyData.data.costs.reduce((sum, cost) => sum + cost.cost, 0);
console.log(`Total weekly labor cost: ${weeklyData.data.currencySymbol}${totalCost.toFixed(2)}`);
```

### Daily Cost Analysis

```javascript
// Get single day cost breakdown
const dailyData = await getTimeAndCost(5, {
  from: "2025-06-07",
  to: "2025-06-07"
});

// Group by position for analysis
const costsByPosition = {};
dailyData.data.costs.forEach(cost => {
  if (!costsByPosition[cost.positionId]) {
    costsByPosition[cost.positionId] = {
      totalCost: 0,
      totalHours: 0,
      shiftCount: 0
    };
  }
  
  costsByPosition[cost.positionId].totalCost += cost.cost;
  costsByPosition[cost.positionId].shiftCount += 1;
  
  // Parse duration to calculate hours
  const [hours, minutes, seconds] = cost.duration.split(':').map(Number);
  const totalHours = hours + minutes/60 + seconds/3600;
  costsByPosition[cost.positionId].totalHours += totalHours;
});

console.log('Cost breakdown by position:', costsByPosition);
```

### Monthly Budget Tracking

```javascript
// Get monthly data for budget comparison
const monthlyData = await getTimeAndCost(5, {
  from: "2025-06-01",
  to: "2025-06-30"
});

// Calculate metrics
const costs = monthlyData.data.costs;
const totalCost = costs.reduce((sum, cost) => sum + cost.cost, 0);
const totalShifts = costs.length;
const averageCostPerShift = totalCost / totalShifts;

console.log(`Monthly Summary for Department 5:`);
console.log(`Total Cost: ${monthlyData.data.currencySymbol}${totalCost.toFixed(2)}`);
console.log(`Total Shifts: ${totalShifts}`);
console.log(`Average Cost per Shift: ${monthlyData.data.currencySymbol}${averageCostPerShift.toFixed(2)}`);
```

### Shift Type Cost Comparison

```javascript
// Analyze costs by shift type
const data = await getTimeAndCost(5, {
  from: "2025-06-01",
  to: "2025-06-30"
});

const costsByShiftType = {};
data.data.costs.forEach(cost => {
  if (!costsByShiftType[cost.shiftTypeId]) {
    costsByShiftType[cost.shiftTypeId] = {
      totalCost: 0,
      shiftCount: 0,
      totalDuration: 0
    };
  }
  
  costsByShiftType[cost.shiftTypeId].totalCost += cost.cost;
  costsByShiftType[cost.shiftTypeId].shiftCount += 1;
  
  // Convert duration to minutes for easier calculation
  const [hours, minutes, seconds] = cost.duration.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + seconds/60;
  costsByShiftType[cost.shiftTypeId].totalDuration += totalMinutes;
});

// Calculate average hourly rate by shift type
Object.keys(costsByShiftType).forEach(shiftTypeId => {
  const data = costsByShiftType[shiftTypeId];
  const totalHours = data.totalDuration / 60;
  const hourlyRate = data.totalCost / totalHours;
  console.log(`Shift Type ${shiftTypeId}: ${data.data.currencySymbol}${hourlyRate.toFixed(2)}/hour`);
});
```

---

## Common Use Cases

### Budget Planning
Use time and cost data for:
- **Monthly Budget Tracking**: Compare actual vs. planned labor costs
- **Department Cost Analysis**: Break down costs by department
- **Seasonal Planning**: Analyze cost patterns across different time periods
- **Position Cost Analysis**: Track which positions are most/least expensive

### Operational Reporting
Generate reports for:
- **Daily Labor Cost Reports**: Track daily spending against targets
- **Weekly Cost Summaries**: Monitor weekly labor budget performance
- **Shift Type Analysis**: Compare costs across different shift types
- **Employee Cost Tracking**: Analyze labor costs by individual employees

### Financial Analysis
Support business decisions with:
- **Cost Per Hour Analysis**: Calculate effective hourly rates by position
- **Efficiency Metrics**: Compare duration vs. cost across departments
- **Overtime Cost Tracking**: Identify high-cost shift types
- **ROI Analysis**: Measure labor cost effectiveness

### Compliance and Auditing
Maintain records for:
- **Labor Cost Audits**: Provide detailed cost breakdowns
- **Budget Variance Reports**: Track differences from planned costs
- **Historical Cost Analysis**: Compare costs across time periods
- **Department Performance**: Measure cost efficiency by department

---

## Integration Notes

- **Department Scope**: Each request returns data for a single department only
- **Time Period Limits**: Both start and end dates are required and inclusive
- **Break Time Handling**: Duration excludes break time even if breaks are paid
- **Currency Formatting**: Use provided currency symbols and format strings for display
- **Shift Relationships**: Costs link to shifts, employees, positions, and shift types
- **Real-time Data**: Reflects current shift assignments and cost calculations

## Related Endpoints

- **Shifts API**: Provides the underlying shift data that generates costs
- **Departments API**: Manages the departments for which costs are calculated
- **Employees API**: Links cost data to specific employees
- **Positions API**: Associates costs with specific job positions
- **Shift Types API**: Connects costs to different types of shifts and pay rates
- **Payroll API**: Uses cost data for payroll processing and reporting

---

## Best Practices

### Date Range Selection
- Use reasonable date ranges to avoid large response sizes
- Consider pagination for very large datasets
- Align date ranges with business reporting periods (weekly, monthly)

### Cost Analysis
- Always consider the currency formatting for proper display
- Factor in that break time is excluded from duration calculations
- Use position and shift type IDs to group and analyze costs effectively

### Performance Optimization
- Request data for single departments when possible
- Cache results for frequently accessed time periods
- Use specific date ranges rather than very broad queries

### Data Interpretation
- Remember that costs reflect scheduled shifts, not actual worked time
- Consider shift status when interpreting cost data
- Account for different shift types having different cost structures