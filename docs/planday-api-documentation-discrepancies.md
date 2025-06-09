# Planday API Documentation Discrepancies

This document tracks inconsistencies between the official Planday API documentation and the actual API behavior observed during implementation.

## Overview

During the development and testing of the Planday MCP Server, we've discovered several cases where the actual API responses differ from what's documented. This file serves as a reference for future development and troubleshooting.

---

## Time and Cost API Discrepancies

### Duration Format Issue ✅ **Resolved**

**API Endpoint:** `GET /scheduling/v1.0/timeandcost/{departmentId}`

**Documented Behavior:**
- Duration field should be in `HH:MM:SS` format (hours:minutes:seconds)
- Example from docs: `"duration": "8:00:00"` (8 hours)

**Actual Behavior:**
- Duration field is in `D:HH:MM` format (days:hours:minutes)
- Example observed: `"duration": "0:09:00"` (0 days, 9 hours, 0 minutes = 9 hours)

**Impact:**
- Parsing duration as `HH:MM:SS` resulted in incorrect time calculations
- `0:09:00` was parsed as 9 minutes (0.15 hours) instead of 9 hours
- This caused significant underestimation of labor hours in cost analysis

**Fix Applied:**
- Updated duration parsing logic in `src/services/formatters/scheduling-formatters.ts`
- Now correctly interprets 3-part durations as `D:HH:MM` format
- Added fallback handling for different duration formats

**Date Discovered:** June 8, 2025

---

## Currency Symbol Behavior

### API Currency Configuration 🔄 **Workaround Applied**

**API Endpoint:** `GET /scheduling/v1.0/timeandcost/{departmentId}`

**Expected Behavior:**
- Currency symbol should match the organization's configured currency
- Swedish organizations should return Swedish Kronor (kr/SEK)

**Observed Behavior:**
- API returned British Pounds (£) symbol for a Swedish organization
- This appears to be a configuration issue at the organization level in Planday

**Impact:**
- Cost reports show incorrect currency symbols
- May confuse users expecting local currency

**Resolution:**
- This is an organization-level configuration issue in Planday admin settings
- Our tool correctly uses whatever currency symbol the API returns
- Organization administrator needs to update currency settings in Planday

**Date Discovered:** June 8, 2025

---

## Best Practices for Handling Discrepancies

### 1. Defensive Parsing
Always implement robust parsing that can handle multiple formats:
```typescript
// Handle both documented and actual formats
if (parts.length === 3) {
  // Could be either HH:MM:SS or D:HH:MM
  // Check context and implement accordingly
}
```

### 2. Debug Output
Include debug information in development builds to identify format issues:
```typescript
result += `Sample Duration Values: ${costs.slice(0, 3).map((c: any) => `${c.shiftId}:${c.duration}`).join(', ')}\n`;
```

### 3. Fallback Handling
Always provide fallback parsing for unexpected formats:
```typescript
// Fallback: try to parse as a decimal number
const numericDuration = parseFloat(duration);
if (!isNaN(numericDuration)) {
  return sum + numericDuration;
}
```

### 4. Documentation Updates
When discrepancies are found:
1. Document the issue in this file
2. Update code comments with actual behavior
3. Consider reaching out to Planday support for clarification
4. Implement workarounds that handle both documented and actual behavior

---

## Contributing

When you discover new discrepancies:

1. **Add a new section** with the API endpoint and issue description
2. **Include examples** of both documented and actual behavior
3. **Describe the impact** on functionality
4. **Document the fix** or workaround applied
5. **Add the discovery date** for tracking

---

## Status Legend

- 🐛 **Confirmed Discrepancy** - Verified difference from documentation
- ⚠️ **Suspected Issue** - Potential discrepancy requiring investigation
- ✅ **Resolved** - Fixed in our implementation
- 🔄 **Workaround Applied** - Temporary fix implemented
- 📝 **Reported to Planday** - Issue escalated to Planday support

---

## Shift Assignment Business Logic Gap

### Missing Employee Validation ✅ **Resolved**

**API Endpoint:** `POST /scheduling/v1.0/shifts/{shiftId}/employee`

**Documented Behavior:**
- API allows assigning any employee to any shift
- No validation requirements mentioned for employee group or department membership

**Actual Business Requirements:**
- Employees should only be assigned to shifts for employee groups they belong to
- Employees should only be assigned to shifts in departments they have access to
- Invalid assignments result in 0 kr wage calculations and compliance issues

**Impact:**
- Allows invalid business assignments (e.g., assigning Kitchen staff to Servitör shifts)
- Results in 0 kr wages when employee has no wage rate for the assigned group
- Creates compliance and scheduling violations
- Can cause payroll calculation errors

**Fix Applied:**
- Added `validateEmployeeForShift()` function in `src/services/api/scheduling-api.ts`
- Enhanced `assign-shift-to-employee` tool with pre-assignment validation
- Validates both employee group membership and department access
- Provides detailed error messages explaining validation failures

**Validation Logic:**
```typescript
// Check employee is member of shift's employee group
const employeeGroupValid = employeeGroups.includes(shift.employeeGroupId);

// Check employee has access to shift's department  
const departmentValid = employeeDepartments.includes(shift.departmentId);
```

**Date Discovered:** June 8, 2025

---

*Last Updated: June 8, 2025* 