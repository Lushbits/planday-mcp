# MCP Tool Description Best Practices for Better LLM Understanding

## 🎯 **Overview**

Well-crafted tool descriptions are critical for LLM performance in MCP servers. The LLM uses tool names, descriptions, and parameter details to decide which tool to call and how to use it. Poor descriptions lead to wrong tool selection, incorrect parameters, and frustrated users.

## 📋 **The Description Formula**

### **Structure Every Tool Description Like This:**

```typescript
server.tool(
  "tool-name",                    // Clear, descriptive, kebab-case
  "PURPOSE + DETAILS + USE CASES", // Rich description (see formula below)
  { parameters },                 // Well-described parameters
  async (params) => { ... }
);
```

### **Description Formula:**
```
[VERB] [WHAT] [DETAILS] [USE CASES WITH EXAMPLES]

Purpose (10-20 words) + Details (10-20 words) + Use Cases (20-40 words)
```

## ✅ **Best Practices**

### **1. Start with a Clear Action Verb**
```typescript
// ✅ Good - Clear action
"Get employee work schedules and shift assignments..."
"Search time-off requests and vacation records..."
"Create new employee shift assignments..."
"Approve pending vacation requests..."

// ❌ Avoid - Vague or no action
"Employee data..."
"Handles shifts..."
"Stuff about absences..."
```

### **2. Specify Exactly What Data is Returned**
```typescript
// ✅ Good - Specific data details
"Shows who is working when, their positions, departments, shift types, and pay rules"
"Returns employee names, contact info, hire dates, and department assignments"

// ❌ Avoid - Vague data description
"Gets employee information"
"Returns shift data"
```

### **3. Include 2-4 Natural Language Examples**
```typescript
// ✅ Good - Natural questions users would ask
"Perfect for questions like: 'Who's working today?', 'What shifts are scheduled this week?', 'Show me the weekend schedule'"

// ✅ Good - Manager-focused examples
"Use for questions like: 'What vacation requests need approval?', 'Show declined time-off requests', 'Any pending absences?'"

// ❌ Avoid - Technical examples
"Use with startDate and endDate parameters"
"Call this endpoint for data"
```

### **4. Differentiate Similar Tools Clearly**
```typescript
// ✅ Good - Clear distinctions
"get-absence-records"     // "Search ALL absence records with flexible filtering"
"get-absence-record"      // "Get detailed information for ONE specific absence record by ID"
"get-pending-absence-requests" // "Get ONLY time-off requests awaiting manager approval"

// ❌ Avoid - Confusing similarities
"get-absences"           // "Gets absence data"
"fetch-absence"          // "Returns absence information"
"absence-data"           // "Absence records"
```

### **5. Write Parameter Descriptions Like Help Text**
```typescript
// ✅ Good - Helpful, specific descriptions
{
  employeeId: z.number().optional().describe("Specific employee ID number (use get-employees first to find the right ID)"),
  startDate: z.string().describe("Start date in YYYY-MM-DD format (e.g., '2024-06-07' for June 7th)"),
  status: z.enum(["Pending", "Approved"]).describe("Filter by approval status: 'Pending' for requests awaiting approval, 'Approved' for confirmed time-off"),
  department: z.string().optional().describe("Department name like 'Kitchen', 'Front of House', or 'Management' (optional)")
}

// ❌ Avoid - Technical or minimal descriptions
{
  employeeId: z.number().describe("Employee ID"),
  startDate: z.string().describe("Start date"),
  status: z.enum(["Pending", "Approved"]).describe("Status filter")
}
```

## 🎨 **Template Examples by Tool Type**

### **Data Retrieval Tools**
```typescript
server.tool(
  "get-[entity]",
  "Get [specific data] for [use case]. Shows [detailed fields returned]. Perfect for questions like: '[example 1]', '[example 2]', '[example 3]'",
  { parameters },
  handler
);

// Example:
server.tool(
  "get-shifts",
  "Get detailed employee work schedules and shift assignments for any date range. Shows who is working when, their positions, departments, shift types, and pay rules. Perfect for questions like: 'Who's working today?', 'What's the weekend schedule?', 'Show me all kitchen shifts this week'",
  { parameters },
  handler
);
```

### **Search/Filter Tools**
```typescript
server.tool(
  "search-[entity]",
  "Search [entity type] with flexible filtering options. Find [specific use cases] by [filter types]. Use for questions like: '[filtered example 1]', '[filtered example 2]', '[filtered example 3]'",
  { parameters },
  handler
);

// Example:
server.tool(
  "get-absence-records",
  "Search employee time-off requests and absence history with flexible filtering. Find vacation requests, sick days, or specific absence patterns by employee, date, or status. Use for questions like: 'What vacation requests are pending?', 'Show declined absences', 'Find all time-off for employee 123'",
  { parameters },
  handler
);
```

### **Action/Creation Tools**
```typescript
server.tool(
  "create-[entity]",
  "Create new [entity] with [capabilities]. Allows [specific actions] for [use cases]. Use when asked to: '[action example 1]', '[action example 2]', '[action example 3]'",
  { parameters },
  handler
);

// Example:
server.tool(
  "create-shift",
  "Create new employee shift assignments with specific dates, times, and positions. Allows scheduling employees for upcoming work periods with position and department assignments. Use when asked to: 'Schedule Sarah for tomorrow 9-5', 'Create a weekend shift for the kitchen', 'Add a new shift for the front desk'",
  { parameters },
  handler
);
```

### **Status/Summary Tools**
```typescript
server.tool(
  "get-[status-type]",
  "Get [specific status items] that need [action]. Quick access to [workflow items] requiring [attention type]. Perfect for [manager/role] questions like: '[status example 1]', '[status example 2]'",
  { parameters },
  handler
);

// Example:
server.tool(
  "get-pending-absence-requests",
  "Get all time-off requests that are waiting for manager approval. Quick access to vacation requests, sick days, and other absences requiring approval decisions. Perfect for manager questions like: 'What requests need my approval?', 'Any pending vacation requests?', 'Show me the approval queue'",
  { parameters },
  handler
);
```

### **Debug/Admin Tools**
```typescript
server.tool(
  "debug-[aspect]",
  "Debug and troubleshoot [specific system aspect] for development purposes. Shows [technical details] to help diagnose [problem types]. Use when [debug scenarios]",
  { parameters },
  handler
);

// Example:
server.tool(
  "debug-api-response",
  "Debug and troubleshoot API connectivity by showing raw response data from Planday endpoints. Shows exact JSON data structure to help diagnose integration issues or data formatting problems. Use when tools aren't working as expected or you need to inspect the underlying API data",
  { parameters },
  handler
);
```

## 🚫 **Common Mistakes to Avoid**

### **1. Vague Descriptions**
```typescript
// ❌ Bad
"Gets data about employees"
"Handles shift information"
"Manages absences"

// ✅ Good
"Get complete employee directory with names, contact info, departments, and hire dates"
"Get detailed work schedules showing who's working when, where, and in what role"
"Search time-off requests with filtering by employee, date, and approval status"
```

### **2. Missing Use Cases**
```typescript
// ❌ Bad - No context for when to use
"Returns employee shift data for specified date ranges"

// ✅ Good - Clear use cases
"Get employee work schedules for any date range. Perfect for questions like: 'Who's working today?', 'What's the weekend schedule?', 'Show me next week's shifts'"
```

### **3. Technical Jargon**
```typescript
// ❌ Bad - Technical language
"Executes API call to retrieve employee entities from the HR endpoint with optional department filtering"

// ✅ Good - Natural language
"Get employee directory with optional filtering by department. Shows all staff members or just employees in specific departments like 'Kitchen' or 'Management'"
```

### **4. Ambiguous Tool Names**
```typescript
// ❌ Bad - Unclear purpose
"fetch-data"
"get-info" 
"process-request"

// ✅ Good - Clear, specific purpose
"get-employee-directory"
"get-pending-approvals"
"create-shift-assignment"
```

## 🎯 **Quality Checklist**

Before finalizing any tool description, verify:

- [ ] **Clear action verb** - What does this tool DO?
- [ ] **Specific data details** - What exactly does it return?
- [ ] **2-4 natural language examples** - What questions would trigger this?
- [ ] **Differentiation** - How is this different from similar tools?
- [ ] **Parameter help** - Are parameter descriptions actually helpful?
- [ ] **User perspective** - Would a non-technical person understand this?
- [ ] **Complete context** - Does this give the LLM enough info to choose correctly?

## 🚀 **Impact of Good Descriptions**

Quality tool descriptions lead to:
- ✅ **Better tool selection** - LLM picks the right tool more often
- ✅ **Accurate parameters** - LLM provides correct input data
- ✅ **Natural conversations** - Users can ask questions in plain language
- ✅ **Fewer errors** - Less confusion and retry loops
- ✅ **Better user experience** - More helpful, relevant responses

## 📝 **Quick Reference Template**

```typescript
server.tool(
  "verb-noun-action",  // Clear, descriptive name
  "[ACTION] [WHAT] [DETAILS]. Shows [FIELDS]. Perfect for questions like: '[EXAMPLE1]', '[EXAMPLE2]', '[EXAMPLE3]'",
  {
    param1: z.type().describe("Helpful description with example format"),
    param2: z.type().optional().describe("What this parameter filters/controls (optional)")
  },
  async ({ param1, param2 }) => {
    // Implementation
  }
);
```

---

*Use this guide for every tool you create to ensure optimal LLM understanding and performance.*