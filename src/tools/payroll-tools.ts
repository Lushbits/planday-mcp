// src/tools/payroll-tools.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPayrollWithDepartmentBreakdown, getPayrollData } from "../services/api/payroll-api.ts";
import { getEmployeesByIds } from "../services/api/hr-api.ts";
import { formatPayrollSummary, formatShiftPayrollDetails } from "../services/formatters.ts";
import { ensureAuthenticated } from "../services/auth.ts";

export function registerPayrollTools(server: McpServer) {
  // Get detailed payroll data with cost breakdown
  server.tool(
    "get-payroll-data",
    {
      startDate: z.string().describe("Start date in YYYY-MM-DD format (e.g., '2024-06-01' for June 1st)"),
      endDate: z.string().describe("End date in YYYY-MM-DD format (e.g., '2024-06-07' for June 7th)"),
      includeDetails: z.boolean().optional().describe("Include detailed breakdown per shift and employee (default: false for summary only)"),
      onlyApproved: z.boolean().optional().describe("Only include approved shifts for final payroll processing (default: false shows ALL scheduled shifts for budget planning)")
    },
    async ({ startDate, endDate, includeDetails = false, onlyApproved = false }) => {
      try {
        await ensureAuthenticated();

        // Use the enhanced function that includes department breakdown
        const result = await getPayrollWithDepartmentBreakdown(startDate, endDate, {
          shiftStatus: onlyApproved ? 'Approved' : undefined
        });

        const { payrollData, departmentBreakdown, totals } = result;
        
        if (!payrollData || (!payrollData.shiftsPayroll?.length && !payrollData.supplementsPayroll?.length && !payrollData.salariedPayroll?.length)) {
          return {
            content: [{
              type: "text",
              text: `📊 No payroll data found for period ${startDate} to ${endDate}${onlyApproved ? ' (approved shifts only for payroll)' : ' (all scheduled shifts)'}`
            }]
          };
        }

        // Get employee data for name resolution
        const employeeIds = new Set([
          ...(payrollData.shiftsPayroll?.map(s => s.employeeId) || []),
          ...(payrollData.supplementsPayroll?.map(s => s.employeeId) || []),
          ...(payrollData.salariedPayroll?.map(s => s.employeeId) || [])
        ]);

        const employeesMap = await getEmployeesByIds(Array.from(employeeIds));
        
        // Convert to name map for formatter
        const employeeNames = new Map<number, string>();
        employeesMap.forEach((employee, id) => {
          const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || `Employee ${id}`;
          employeeNames.set(id, fullName);
        });

        // Convert department breakdown to name map for formatter
        const departmentNames = new Map<number, string>();
        departmentBreakdown.forEach(dept => {
          departmentNames.set(dept.departmentId, dept.departmentName);
        });

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
              text: detailedOutput + (onlyApproved ? '\n\n✅ *Showing approved shifts only - ready for payroll processing*' : '\n\n📋 *Showing all scheduled shifts - perfect for budget planning*')
            }]
          };
        } else {
          // Summary with enhanced department breakdown
          let summaryOutput = formatPayrollSummary(
            payrollData, 
            employeeNames, 
            departmentNames, 
            startDate, 
            endDate
          );

          // Add enhanced department cost breakdown
          if (departmentBreakdown.length > 0) {
            summaryOutput += '\n\n🏢 **Enhanced Department Breakdown**:\n';
            departmentBreakdown
              .sort((a, b) => b.totalCost - a.totalCost)
              .forEach((dept, index) => {
                const percentage = totals.totalCost > 0 ? ((dept.totalCost / totals.totalCost) * 100).toFixed(1) : '0.0';
                summaryOutput += `${index + 1}. **${dept.departmentName}**: ${totals.currency}${dept.totalCost.toFixed(2)} (${percentage}% of total, ${dept.employeeCount} employees)\n`;
              });
          }

          if (onlyApproved) {
            summaryOutput += '\n\n✅ *Showing approved shifts only - ready for payroll processing*';
          } else {
            summaryOutput += '\n\n📋 *Showing all scheduled shifts - perfect for budget planning and cost estimation*';
          }

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
    {
      startDate: z.string().describe("Start date in YYYY-MM-DD format (e.g., '2024-06-01' for June 1st)"),
      endDate: z.string().describe("End date in YYYY-MM-DD format (e.g., '2024-06-07' for June 7th)"),
      onlyApproved: z.boolean().optional().describe("Only include approved shifts for final payroll amounts (default: false shows ALL scheduled shifts for cost planning)")
    },
    async ({ startDate, endDate, onlyApproved = false }) => {
      try {
        await ensureAuthenticated();

        const payrollData = await getPayrollData(startDate, endDate, {
          shiftStatus: onlyApproved ? 'Approved' : undefined
        });
        
        if (!payrollData) {
          return {
            content: [{
              type: "text",
              text: `📊 No payroll data found for period ${startDate} to ${endDate}${onlyApproved ? ' (approved shifts only for payroll)' : ' (all scheduled shifts)'}`
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

        const dayCount = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));

        return {
          content: [{
            type: "text",
            text: `💰 Payroll Summary (${startDate} to ${endDate})

📊 Total Labor Cost: ${currency}${totalCost.toFixed(2)}
👥 Employees Paid: ${uniqueEmployees}
📅 Period: ${dayCount} days
⏰ Daily Average: ${currency}${(totalCost / dayCount).toFixed(2)}

💼 Breakdown:
• Shift Wages: ${currency}${shiftCosts.toFixed(2)} (${payrollData.shiftsPayroll?.length || 0} shifts)
• Supplements: ${currency}${supplementCosts.toFixed(2)} (${payrollData.supplementsPayroll?.length || 0} items)
• Salaries: ${currency}${salariedCosts.toFixed(2)} (${payrollData.salariedPayroll?.length || 0} items)${onlyApproved ? '\n\n✅ *Showing approved shifts only - ready for payroll processing*' : '\n\n📋 *Showing all scheduled shifts - perfect for cost planning and budgeting*'}`
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
