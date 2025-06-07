# Planday Scheduling API - Shift Types

## Overview

The Planday Scheduling API Shift Types endpoint provides management of different shift categories within the scheduling system. Shift types define pay rules, break policies, and visual organization for shifts, allowing businesses to categorize work periods with specific characteristics and compensation structures.

**Base URL:** `https://openapi.planday.com/scheduling/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

---

## Data Model

### Shift Type Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier of the shift type |
| `name` | string | Name of the shift type |
| `color` | string | Shift type color code (e.g., "#21E56E") |
| `salaryCode` | string | Shift type salary code for payroll integration |
| `isActive` | boolean | Whether the shift type is currently active |
| `payPercentage` | number | Pay percentage modifier (e.g., 1.5 for overtime) |
| `payMonetary` | number | Fixed monetary amount for the shift type |
| `allowsBreaks` | boolean | Whether breaks are allowed for this shift type |
| `allowBooking` | boolean | Whether employees can book this shift type |
| `paymentType` | string | Payment calculation method ("Percentage" or "Monetary") |
| `includeInSchedulePrint` | boolean | Whether to include in printed schedules |

### Payment Types

- `Percentage` - Pay is calculated as a percentage of base rate
- `Monetary` - Pay is a fixed monetary amount

---

## Endpoints

### GET /shifttypes - List Available Shift Types

Returns a paginated list of available shift types.

**Required Scope:** `shifttype:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `isActive` | boolean | Filter by active/inactive status |
| `limit` | integer | Maximum number of records to return (max 50 per request, default: 50) |
| `offset` | integer | Skip first N records for pagination purposes (default: 0) |

#### Example Request

```http
GET /scheduling/v1.0/shifttypes?isActive=true&limit=20&offset=0
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
      "name": "Regular Shift",
      "color": "#21E56E",
      "salaryCode": "REG",
      "isActive": true,
      "payPercentage": 1.0,
      "payMonetary": 0.0,
      "allowsBreaks": true,
      "allowBooking": true,
      "paymentType": "Percentage",
      "includeInSchedulePrint": true
    },
    {
      "id": 2,
      "name": "Overtime",
      "color": "#FF5733",
      "salaryCode": "OT",
      "isActive": true,
      "payPercentage": 1.5,
      "payMonetary": 0.0,
      "allowsBreaks": true,
      "allowBooking": false,
      "paymentType": "Percentage",
      "includeInSchedulePrint": true
    },
    {
      "id": 3,
      "name": "Holiday Premium",
      "color": "#FFD700",
      "salaryCode": "HOL",
      "isActive": true,
      "payPercentage": 2.0,
      "payMonetary": 0.0,
      "allowsBreaks": true,
      "allowBooking": true,
      "paymentType": "Percentage",
      "includeInSchedulePrint": true
    }
  ]
}
```

---

### POST /shifttypes - Create Shift Type

Create a new shift type with specified parameters.

**Required Scope:** `shifttype:create`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Shift type name (non-empty) |
| `color` | string | ✓ | Shift type color (e.g., "#21E56E") |
| `salaryCode` | string | ✓ | Shift type salary code (non-empty) |
| `allowsBreaks` | boolean | | Whether breaks are allowed |
| `includeSupplementSalary` | boolean | | Include supplement salary |

#### Example Request

```http
POST /scheduling/v1.0/shifttypes
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "name": "Weekend Premium",
  "color": "#9C27B0",
  "salaryCode": "WKD",
  "allowsBreaks": true,
  "includeSupplementSalary": true
}
```

#### Response

```json
{
  "id": 15
}
```

---

### PUT /shifttypes/{id} - Update Shift Type

Update an existing shift type with new parameters.

**Required Scope:** `shifttype:update`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Unique shift type identifier |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Shift type name (non-empty) |
| `color` | string | ✓ | Shift type color (e.g., "#21E56E") |
| `salaryCode` | string | ✓ | Shift type salary code (non-empty) |
| `allowsBreaks` | boolean | | Whether breaks are allowed |
| `includeSupplementSalary` | boolean | | Include supplement salary |

#### Example Request

```http
PUT /scheduling/v1.0/shifttypes/15
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

{
  "name": "Weekend Premium Plus",
  "color": "#673AB7",
  "salaryCode": "WKDP",
  "allowsBreaks": true,
  "includeSupplementSalary": true
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

### Get All Active Shift Types

```javascript
// Get all active shift types
const activeShiftTypes = await getShiftTypes({
  isActive: true,
  limit: 50,
  offset: 0
});

console.log(`Found ${activeShiftTypes.paging.total} active shift types`);
```

### Create Shift Types for Different Scenarios

```javascript
// Create regular shift type
const regularShift = await createShiftType({
  name: "Regular Hours",
  color: "#4CAF50",
  salaryCode: "REG",
  allowsBreaks: true,
  includeSupplementSalary: false
});

// Create overtime shift type
const overtimeShift = await createShiftType({
  name: "Overtime",
  color: "#FF9800",
  salaryCode: "OT",
  allowsBreaks: true,
  includeSupplementSalary: true
});

// Create holiday shift type
const holidayShift = await createShiftType({
  name: "Holiday Work",
  color: "#E91E63",
  salaryCode: "HOL",
  allowsBreaks: true,
  includeSupplementSalary: true
});
```

### Update Shift Type Configuration

```javascript
// Update shift type to change pay rules
await updateShiftType(15, {
  name: "Night Shift Premium",
  color: "#3F51B5",
  salaryCode: "NIGHT",
  allowsBreaks: true,
  includeSupplementSalary: true
});
```

### Pagination Example

```javascript
// Get all shift types with pagination
let allShiftTypes = [];
let offset = 0;
const limit = 50;

do {
  const response = await getShiftTypes({ limit, offset });
  allShiftTypes.push(...response.data);
  offset += limit;
} while (offset < response.paging.total);

console.log(`Retrieved ${allShiftTypes.length} shift types total`);
```

---

## Common Use Cases

### Pay Differentiation
Shift types are commonly used for:
- **Regular vs. Overtime**: Different pay rates for standard and extended hours
- **Weekend Premium**: Higher pay for weekend work
- **Holiday Pay**: Special compensation for holiday shifts
- **Night Shift Differential**: Additional pay for overnight work
- **Hazard Pay**: Extra compensation for dangerous or difficult conditions

### Operational Control
Use shift types to:
- **Control Break Policies**: Some shift types may not allow breaks
- **Manage Booking Rights**: Restrict which shifts employees can self-book
- **Visual Organization**: Color-code different types of work
- **Payroll Integration**: Use salary codes for automated payroll processing
- **Schedule Printing**: Control what appears on printed schedules

### Business Rules
Configure shift types for:
- **Compliance Requirements**: Meet labor law requirements for overtime
- **Union Agreements**: Implement contracted pay differentials
- **Seasonal Adjustments**: Special rates for peak seasons
- **Department-Specific Rules**: Different policies by department
- **Skill-Based Pay**: Higher rates for specialized work

---

## Integration Notes

- **Relationship to Shifts**: Shift type IDs are used in the `shiftTypeId` field when creating or updating shifts
- **Payroll Integration**: `salaryCode` field connects to payroll systems for automated processing
- **Visual Presentation**: `color` field enables consistent UI representation across applications
- **Break Management**: `allowsBreaks` controls whether shifts of this type include break periods
- **Employee Self-Service**: `allowBooking` determines if employees can select these shifts
- **Payment Calculation**: `paymentType`, `payPercentage`, and `payMonetary` define compensation rules
- **Schedule Output**: `includeInSchedulePrint` controls printed schedule content

## Related Endpoints

- **Shifts API**: Uses `shiftTypeId` from shift types when creating/updating shifts
- **Employees API**: Employees work shifts that have specific shift types
- **Payroll API**: Uses salary codes from shift types for payroll processing
- **Reports API**: Shift type data appears in scheduling and payroll reports

---

## Best Practices

### Naming Conventions
- Use clear, descriptive names: "Regular", "Overtime", "Holiday Premium"
- Be consistent across similar shift types
- Consider abbreviations for salary codes: "REG", "OT", "HOL"

### Color Coding
- Use consistent color schemes across your organization
- Consider accessibility when choosing colors
- Use distinct colors for easy visual differentiation

### Salary Codes
- Keep codes short but meaningful for payroll integration
- Use consistent patterns: "REG", "OT1.5", "HOL2.0"
- Coordinate with payroll system requirements

### Pay Rules
- Set appropriate percentage multipliers (1.0 = 100%, 1.5 = 150%)
- Use monetary amounts for fixed bonuses or stipends
- Consider local labor laws and union agreements