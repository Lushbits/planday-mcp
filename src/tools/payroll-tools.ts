// src/tools/payroll-tools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPayrollData } from "../services/api/payroll-api.ts";
import { getEmployeeById, getDepartmentById } from "../services/api/hr-api.ts";
import { formatPayrollSummary, formatShiftPayrollDetails } from "../services/formatters.ts";
import { ensureAuthenticated } from "../services/auth.ts";

export function registerPayrollTools(server: McpServer) {
  // Get detailed payroll data with cost breakdown
  server.tool(
    "get-payroll-data",
    "Get detailed payroll cost breakdown and salary information for any date range. Shows shift costs, employee wages, supplements, breaks, and total labor expenses. Perfect for questions like: 'What did our payroll cost last week?', 'Show me shift costs for this month', 'What are our labor expenses by department?'",
    {
      startDate: z.string().describe("Start date in YYYY-MM-DD format (e.g., '2024-06-01' for June 1st)"),
      endDate: z.string().describe("End date in YYYY-MM-DD format (e.g., '2024-06-07' for June 7th)"),
      includeDetails: z.boolean().optional().describe("Include detailed breakdown per shift and employee (default: false for summary only)")
    },
    async ({ startDate, endDate, includeDetails = false }) => {
      try {
        await ensureAuthenticated();

        const payrollData = await getPayrollData(startDate, endDate);
        
        if (!payrollData || (!payrollData.shiftsPayroll?.length && !payrollData.supplementsPayroll?.length && !payrollData.salariedPayroll?.length)) {
          return {
            content: [{
              type: "text",
              text: `📊 No payroll data found for period ${startDate} to ${endDate}`
            }]
          };
        }

        // Get employee and department data for name resolution
        const employeeIds = new Set([
          ...(payrollData.shiftsPayroll?.map(s => s.employeeId) || []),
          ...(payrollData.supplementsPayroll?.map(s => s.employeeId) || []),
          ...(payrollData.salariedPayroll?.map(s => s.employeeId) || [])
        ]);

        const departmentIds = new Set(
          payrollData.shiftsPayroll?.map(s => s.departmentId).filter(Boolean) || []
        );

        // Resolve names in parallel
        const [employeePromises, departmentPromises] = await Promise.all([
          Promise.all(Array.from(employeeIds).map(async id => {
            try {
              const employee = await getEmployeeById(id);
              return { id, name: employee ? `${employee.firstName} ${employee.lastName}` : `Employee ${id}` };
            } catch {
              return { id, name: `Employee ${id}` };
            }
          })),
          Promise.all(Array.from(departmentIds).map(async id => {
            try {
              const department = await getDepartmentById(id);
              return { id, name: department?.name || `Department ${id}` };
            } catch {
              return { id, name: `Department ${id}` };
            }
          }))
        ]);

        const employeeNames = new Map(employeePromises.map(e => [e.id, e.name]));
        const departmentNames = new Map(departmentPromises.map(d => [d.id, d.name]));

        if (includeDetails) {
          // Detailed breakdown
          const detailedOutput = formatShiftPayrollDetails(
            payrollData, 
            employeeNames, 
            departmentNames, 
            startDate, 
            endDate
          );
          return {
            content: [{
              type: "text",
              text: detailedOutput
            }]
          };
        } else {
          // Summary only
          const summaryOutput = formatPayrollSummary(
            payrollData, 
            employeeNames, 
            departmentNames, 
            startDate, 
            endDate
          );
          return {
            content: [{
              type: "text",
              text: summaryOutput
            }]
          };
        }

      } catch (error) {
        console.error("Error getting payroll data:", error);
        return {
          content: [{
            type: "text",
            text: `❌ Error retrieving payroll data: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // Get payroll summary for quick cost overview
  server.tool(
    "get-payroll-summary",
    "Get quick payroll cost summary showing total labor expenses and employee count for any date range. Fast overview of labor costs without detailed breakdowns. Perfect for questions like: 'What did labor cost this week?', 'How much are we spending on payroll?', 'Quick cost summary for last month'",
    {
      startDate: z.string().describe("Start date in YYYY-MM-DD format (e.g., '2024-06-01' for June 1st)"),
      endDate: z.string().describe("End date in YYYY-MM-DD format (e.g., '2024-06-07' for June 7th)")
    },
    async ({ startDate, endDate }) => {
      try {
        await ensureAuthenticated();

        const payrollData = await getPayrollData(startDate, endDate);
        
        if (!payrollData) {
          return {
            content: [{
              type: "text",
              text: `📊 No payroll data found for period ${startDate} to ${endDate}`
            }]
          };
        }

        // Calculate totals
        const shiftCosts = payrollData.shiftsPayroll?.reduce((sum, shift) => sum + (shift.salary || 0), 0) || 0;
        const supplementCosts = payrollData.supplementsPayroll?.reduce((sum, supp) => sum + (supp.salary || 0), 0) || 0;
        const salariedCosts = payrollData.salariedPayroll?.reduce((sum, sal) => sum + (sal.salary || 0), 0) || 0;
        
        const totalCost = shiftCosts + supplementCosts + salariedCosts;
        const currency = payrollData.currencySymbol || '$';
        
        const uniqueEmployees = new Set([
          ...(payrollData.shiftsPayroll?.map(s => s.employeeId) || []),
          ...(payrollData.supplementsPayroll?.map(s => s.employeeId) || []),
          ...(payrollData.salariedPayroll?.map(s => s.employeeId) || [])
        ]).size;

        return {
          content: [{
            type: "text",
            text: `💰 Payroll Summary (${startDate} to ${endDate})

📊 Total Labor Cost: ${currency}${totalCost.toFixed(2)}
👥 Employees Paid: ${uniqueEmployees}

💼 Breakdown:
• Shift Wages: ${currency}${shiftCosts.toFixed(2)} (${payrollData.shiftsPayroll?.length || 0} shifts)
• Supplements: ${currency}${supplementCosts.toFixed(2)} (${payrollData.supplementsPayroll?.length || 0} items)
• Salaries: ${currency}${salariedCosts.toFixed(2)} (${payrollData.salariedPayroll?.length || 0} items)

⏰ Average per Day: ${currency}${(totalCost / Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)}`
          }]
        };

      } catch (error) {
        console.error("Error getting payroll summary:", error);
        return {
          content: [{
            type: "text",
            text: `❌ Error retrieving payroll summary: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );
}
