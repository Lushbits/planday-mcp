// src/tools/payroll-tools.ts - Fixed payroll tools with correct API parameters

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService, makeAuthenticatedRequest } from '../services/auth';
import { DataFormatters } from '../services/formatters';

/**
 * Get all department IDs for payroll queries
 * The Planday payroll API requires departmentIds as a mandatory parameter
 */
async function getAllDepartmentIds(): Promise<number[]> {
  try {
    const response = await makeAuthenticatedRequest('https://openapi.planday.com/hr/v1.0/departments');
    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as any;
    return data.data?.map((dept: any) => dept.id) || [];
  } catch (error) {
    console.error('Error fetching departments for payroll:', error);
    return [];
  }
}

export function registerPayrollTools(server: McpServer) {
  // Get detailed payroll data with cost breakdown
  server.tool(
    "get-payroll-data",
    {
      startDate: z.string().describe("Start date in YYYY-MM-DD format (e.g., '2024-06-01')"),
      endDate: z.string().describe("End date in YYYY-MM-DD format (e.g., '2024-06-07')"),
      departmentIds: z.array(z.number()).optional().describe("Specific department IDs to include (if not provided, includes all departments)"),
      includeDetails: z.boolean().optional().describe("Include detailed breakdown per shift and employee (default: false for summary only)"),
      onlyApproved: z.boolean().optional().describe("Only include approved shifts for final payroll processing (default: false shows ALL scheduled shifts for budget planning)")
    },
    async ({ startDate, endDate, departmentIds, includeDetails = false, onlyApproved = false }) => {
      try {
        const accessToken = await authService.getValidAccessToken();
        if (!accessToken) {
          return {
            content: [{
              type: "text",
              text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
            }]
          };
        }

        // Get department IDs - required by the API
        let deptIds = departmentIds;
        if (!deptIds || deptIds.length === 0) {
          deptIds = await getAllDepartmentIds();
          if (deptIds.length === 0) {
            return {
              content: [{
                type: "text",
                text: "❌ No departments found. Cannot fetch payroll data without department IDs."
              }]
            };
          }
        }

        // Build query parameters according to API spec
        const params = new URLSearchParams({
          from: startDate,  // API expects 'from', not 'startDate'
          to: endDate,      // API expects 'to', not 'endDate'
          departmentIds: deptIds.join(',') // Required: comma-separated list
        });

        // Add optional parameters
        if (onlyApproved) {
          params.append('shiftStatus', 'Approved'); // API expects 'shiftStatus', not 'status'
        }

        // Use correct payroll API URL
        const url = `https://openapi.planday.com/payroll/v1.0/payroll?${params.toString()}`;
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json() as any;

        // Check if data exists (API returns data directly, not wrapped in 'data' property)
        if (!data || (!data.shiftsPayroll?.length && !data.supplementsPayroll?.length && !data.salariedPayroll?.length)) {
          return {
            content: [{
              type: "text",
              text: `📊 No payroll data found for period ${startDate} to ${endDate}${onlyApproved ? ' (approved shifts only)' : ' (all scheduled shifts)'}`
            }]
          };
        }

        const formattedData = DataFormatters.formatAPIResponse(
          includeDetails ? "payroll-details" : "payroll-summary", 
          data
        );

        return {
          content: [{
            type: "text",
            text: formattedData + (onlyApproved ? '\n\n✅ *Showing approved shifts only - ready for payroll processing*' : '\n\n📋 *Showing all scheduled shifts - perfect for budget planning*')
          }]
        };

      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("retrieving payroll data", error)
          }]
        };
      }
    }
  );

  // Get payroll summary for quick cost overview
  server.tool(
    "get-payroll-summary",
    {
      startDate: z.string().describe("Start date in YYYY-MM-DD format (e.g., '2024-06-01')"),
      endDate: z.string().describe("End date in YYYY-MM-DD format (e.g., '2024-06-07')"),
      departmentIds: z.array(z.number()).optional().describe("Specific department IDs to include (if not provided, includes all departments)"),
      onlyApproved: z.boolean().optional().describe("Only include approved shifts for final payroll amounts (default: false shows ALL scheduled shifts for cost planning)")
    },
    async ({ startDate, endDate, departmentIds, onlyApproved = false }) => {
      try {
        const accessToken = await authService.getValidAccessToken();
        if (!accessToken) {
          return {
            content: [{
              type: "text",
              text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
            }]
          };
        }

        // Get department IDs - required by the API
        let deptIds = departmentIds;
        if (!deptIds || deptIds.length === 0) {
          deptIds = await getAllDepartmentIds();
          if (deptIds.length === 0) {
            return {
              content: [{
                type: "text",
                text: "❌ No departments found. Cannot fetch payroll data without department IDs."
              }]
            };
          }
        }

        // Build query parameters according to API spec
        const params = new URLSearchParams({
          from: startDate,  // API expects 'from'
          to: endDate,      // API expects 'to'
          departmentIds: deptIds.join(',') // Required parameter
        });

        // Add optional parameters
        if (onlyApproved) {
          params.append('shiftStatus', 'Approved');
        }

        // Use correct payroll API URL
        const url = `https://openapi.planday.com/payroll/v1.0/payroll?${params.toString()}`;
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json() as any;

        // Check if data exists
        if (!data || (!data.shiftsPayroll?.length && !data.supplementsPayroll?.length && !data.salariedPayroll?.length)) {
          return {
            content: [{
              type: "text",
              text: `📊 No payroll data found for period ${startDate} to ${endDate}${onlyApproved ? ' (approved shifts only)' : ' (all scheduled shifts)'}`
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse(
              "payroll-summary", 
              data
            ) + (onlyApproved ? '\n\n✅ *Showing approved shifts only - ready for payroll processing*' : '\n\n📋 *Showing all scheduled shifts - perfect for cost planning and budgeting*')
          }]
        };

      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("retrieving payroll summary", error)
          }]
        };
      }
    }
  );
} 