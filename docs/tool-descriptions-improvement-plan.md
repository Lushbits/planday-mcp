# Tool Descriptions Improvement Plan

## 🎯 **Overview**

Our current tools are missing the required description parameter in MCP tool definitions and lack natural language explanations. This plan addresses fixing all tools to be MCP-compliant and LLM-friendly.

## ❌ **Current Problem**

**Wrong Syntax** (what we have now):
```typescript
server.tool(
  "tool-name",
  { parameters },  // Missing description parameter
  handler
);
```

**Correct Syntax** (MCP-compliant):
```typescript
server.tool(
  "tool-name",
  "Natural language description with use cases", // Required description
  { parameters },
  handler
);
```

## 📋 **Tool Files to Update**

### ✅ **Phase 1: HR Tools (Priority 1)** - `src/tools/hr-tools.ts`
**23 tools total**

#### Employee Management (10 tools)
- [x] `get-employees` - ✅ Complete employee directory with search examples
- [x] `get-employee-by-id` - ✅ Individual employee lookup with natural language  
- [x] `get-deactivated-employees` - ✅ Former staff with termination history
- [x] `create-employee` - ✅ New employee creation with examples
- [x] `update-employee` - ✅ Profile updates with specific use cases
- [x] `deactivate-employee` - ✅ Employee termination with reason handling
- [x] `reactivate-employee` - ✅ Rehiring with department assignments
- [x] `get-supervisors` - ✅ Management hierarchy display
- [x] `get-employee-history` - ✅ Audit trail for compliance tracking
- [x] `get-employee-field-definitions` - ✅ Schema info for form building

#### Department Management (5 tools)
- [x] `get-departments` - ✅ Organizational structure with hierarchy
- [x] `get-department-by-id` - ✅ Specific department details
- [x] `create-department` - ✅ New department creation with examples
- [x] `update-department` - ✅ Department modification use cases
- [x] `delete-department` - ✅ Department removal with warnings

#### Employee Groups & Skills (8 tools)
- [x] `get-employee-groups` - ✅ Staff team classifications
- [x] `get-employee-group-by-id` - ✅ Specific group details
- [x] `create-employee-group` - ✅ New team category creation
- [x] `update-employee-group` - ✅ Group modification examples
- [x] `delete-employee-group` - ✅ Group removal with safety checks
- [x] `get-skills` - ✅ Employee competency tracking
- [x] `create-skill` - ✅ New certification/training setup
- [x] `update-skill` - ✅ Skill modification with renewal options
- [x] `delete-skill` - ✅ Skill removal with record cleanup

### ✅ **Phase 2: Auth Tools** - `src/tools/auth-tools.ts`
**4 tools total**
- [x] `authenticate-planday` - ✅ Login process with refresh token authentication
- [x] `debug-session` - ✅ Auth troubleshooting and session validation
- [x] `debug-env` - ✅ Environment checking and configuration validation
- [x] `debug-api-response` - ✅ API testing and connectivity verification

### ✅ **Phase 3: Payroll Tools** - `src/tools/payroll-tools.ts`  
**2 tools total**
- [x] `get-payroll-data` - ✅ Detailed payroll reports with cost breakdowns
- [x] `get-payroll-summary` - ✅ Quick payroll summaries for budget monitoring

### ✅ **Phase 4: Absence Tools** - `src/tools/absence-tools.ts`
**4 tools total**  
- [x] `get-absence-records` - ✅ Time-off requests with filtering and status
- [x] `get-absence-record` - ✅ Individual absence request details
- [x] `get-approved-absence-requests` - ✅ Confirmed time-off for scheduling
- [x] `get-declined-absence-requests` - ✅ Rejected requests for review

### ✅ **Phase 5: Scheduling Tools** - `src/tools/scheduling-tools.ts`
**21 tools total**

#### Core Shift Management (6 tools)
- [x] `get-shifts` - ✅ Comprehensive shift retrieval with filtering
- [x] `create-shift` - ✅ New shift creation with assignments
- [x] `update-shift` - ✅ Shift modification and corrections
- [x] `delete-shift` - ✅ Shift removal with safety warnings
- [x] `approve-shift` - ✅ Payroll approval workflow
- [x] `assign-shift-to-employee` - ✅ Employee assignment management

#### Position Management (5 tools)
- [x] `get-positions` - ✅ Job positions with department context
- [x] `create-position` - ✅ New position creation with skills
- [x] `get-position-by-id` - ✅ Specific position details
- [x] `update-position` - ✅ Position modification with requirements
- [x] `delete-position` - ✅ Position removal with shift handling

#### Shift Type Management (3 tools)
- [x] `get-shift-types` - ✅ Work period categories and rules
- [x] `create-shift-type` - ✅ New shift type creation
- [x] `update-shift-type` - ✅ Shift type modification

#### Schedule Organization (4 tools)
- [x] `get-sections` - ✅ Department divisions and structure
- [x] `get-schedule-days` - ✅ Holiday and special day information
- [x] `update-schedule-day` - ✅ Day-specific notes and settings
- [x] `get-scheduling-skills` - ✅ Position requirements by department

#### Advanced Analytics (3 tools)
- [x] `get-shift-history` - ✅ Change tracking and audit trails
- [x] `get-time-and-cost` - ✅ Labor cost analysis and budgeting
- [x] `get-deleted-shifts` - ✅ Deleted shift records for audit

## 🎯 **Description Formula to Follow**

### **Template:**
```
"[ACTION VERB] [WHAT DATA] [KEY DETAILS]. Shows [SPECIFIC FIELDS]. Perfect for questions like: '[EXAMPLE1]', '[EXAMPLE2]', '[EXAMPLE3]'"
```

### **Examples by Tool Type:**

**Data Retrieval:**
```
"Get complete employee directory with names, contact details, departments, and job titles. Shows who works where, their roles, hire dates, and supervisor relationships. Perfect for questions like: 'Who works in the kitchen?', 'Show me all employees', 'Find employees by name or email'"
```

**Individual Lookup:**
```
"Get detailed information for one specific employee including all profile data, contact info, and work assignments. Shows complete employee record with sensitive data options. Perfect for questions like: 'Tell me about employee 123', 'Show John Smith's details', 'Get Sarah's contact information'"
```

**Creation Tools:**
```
"Create new employee profiles with required information and department assignments. Allows adding new staff members to the system with complete details. Use when asked to: 'Add new employee', 'Hire someone for kitchen', 'Create profile for new staff member'"
```

**Status/Filter Tools:**
```
"Get employees who are no longer active, including termination dates and reasons. Shows former staff members with deactivation history. Perfect for questions like: 'Who left recently?', 'Show former employees', 'Find people who quit last month'"
```

## ✅ **Quality Checklist for Each Tool**

Before marking complete, verify each tool has:
- [ ] **Clear action verb** (Get, Create, Update, Delete, Search)
- [ ] **Specific data description** (what exactly it returns)
- [ ] **Key field mentions** (names, dates, departments, etc.)
- [ ] **2-4 natural language examples** in quotes
- [ ] **Differentiation** from similar tools
- [ ] **User-friendly language** (no technical jargon)

## 🚀 **Implementation Process**

### **For Each Tool:**
1. **Identify the action** - What does this tool DO?
2. **List specific data returned** - What fields/info does it show?
3. **Write natural language examples** - What questions would trigger this?
4. **Differentiate from similar tools** - How is this unique?
5. **Add description as second parameter** in proper MCP syntax

### **Testing:**
- [ ] Verify tools still build correctly
- [ ] Test that LLM can better understand tool purposes
- [ ] Confirm no breaking changes to functionality

## 📊 **Progress Tracking**

**Phase 1 (HR Tools)**: 23/23 complete ✅  
**Phase 2 (Auth Tools)**: 4/4 complete ✅  
**Phase 3 (Payroll Tools)**: 2/2 complete ✅  
**Phase 4 (Absence Tools)**: 4/4 complete ✅  
**Phase 5 (Scheduling Tools)**: 21/21 complete ✅  

**Total Progress**: 54/54 tools complete (100%) 🎉

---

*This plan ensures all tools become MCP-compliant and significantly improve LLM understanding and tool selection accuracy.* 