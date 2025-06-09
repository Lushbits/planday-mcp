// src/tools/absence-tools.ts - Fixed absence tools with correct API endpoints

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService, makeAuthenticatedRequest } from '../services/auth';
import { DataFormatters } from '../services/formatters';

export function registerAbsenceTools(server: McpServer) {
  // Get absence records tool
  server.tool(
    "get-absence-records",
    "Get comprehensive time-off records with filtering by employee, date range, and approval status. Shows vacation days, sick leave, and other absence types with approval workflow status. Perfect for questions like: 'Who is out this week?', 'Show all vacation requests', 'Find sick leave records for May'",
    {
      employeeId: z.number().optional().describe("Filter by specific employee ID"),
      startDate: z.string().optional().describe("Filter by start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("Filter by end date (YYYY-MM-DD)"),
      statuses: z.array(z.enum(["Declined", "Approved"])).optional().describe("Filter by status array - only 'Declined' and 'Approved' are supported")
    },
    async ({ employeeId, startDate, endDate, statuses }) => {
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

        // Build query parameters according to API spec
        const params = new URLSearchParams();
        if (employeeId) params.append('employeeId', employeeId.toString());
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (statuses && statuses.length > 0) {
          // API expects statuses as multiple parameters, not array
          statuses.forEach(status => params.append('statuses', status));
        }

        // Use correct absence API URL
        const url = `https://openapi.planday.com/absence/v1.0/absencerecords${params.toString() ? '?' + params.toString() : ''}`;
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json() as any;

        if (!data.data || data.data.length === 0) {
          const filtersUsed = [
            employeeId && `Employee ID: ${employeeId}`,
            startDate && `Start: ${startDate}`,
            endDate && `End: ${endDate}`,
            statuses && `Statuses: ${statuses.join(', ')}`
          ].filter(Boolean).join(", ");

          return {
            content: [{
              type: "text",
              text: filtersUsed 
                ? `No absence records found with filters: ${filtersUsed}`
                : 'No absence records found'
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse("absence-records", data)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("fetching absence records", error)
          }]
        };
      }
    }
  );

  // Get specific absence record by ID
  server.tool(
    "get-absence-record",
    "Get detailed information for one specific absence request including dates, reason, approval status, and employee details. Shows complete absence record with all workflow information. Perfect for questions like: 'Tell me about absence request #123', 'Show details of Sarah's vacation request', 'Get specific time-off record info'",
    {
      recordId: z.number().describe("The ID of the absence record to retrieve")
    },
    async ({ recordId }) => {
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

        // Use correct absence API URL for individual record
        const url = `https://openapi.planday.com/absence/v1.0/absencerecords/${recordId}`;
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            return {
              content: [{
                type: "text",
                text: `No absence record found with ID: ${recordId}`
              }]
            };
          }
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json() as any;

        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse("absence-record", data)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError(`fetching absence record ${recordId}`, error)
          }]
        };
      }
    }
  );

  // Get approved absence requests
  server.tool(
    "get-approved-absence-requests",
    "Get all approved time-off requests for staffing and coverage planning. Shows confirmed absences that need scheduling consideration with employee names and dates. Perfect for questions like: 'Who is approved to be out next week?', 'Show confirmed vacation days', 'What approved time-off affects our schedule?'",
    {
      startDate: z.string().optional().describe("Filter by start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("Filter by end date (YYYY-MM-DD)")
    },
    async ({ startDate, endDate }) => {
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

        // Build query parameters for approved requests
        const params = new URLSearchParams();
        params.append('statuses', 'Approved');
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const url = `https://openapi.planday.com/absence/v1.0/absencerecords?${params.toString()}`;
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json() as any;

        if (!data.data || data.data.length === 0) {
          return {
            content: [{
              type: "text",
              text: "✅ No approved absence requests found"
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse("approved-absence-requests", data)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("fetching approved absence requests", error)
          }]
        };
      }
    }
  );

  // Get declined absence requests
  server.tool(
    "get-declined-absence-requests",
    "Get all declined time-off requests for review and employee communication. Shows rejected absence requests with dates and employees for follow-up discussions. Perfect for questions like: 'Which vacation requests were denied?', 'Show declined time-off for this month', 'Who had rejected absence requests?'",
    {
      startDate: z.string().optional().describe("Filter by start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("Filter by end date (YYYY-MM-DD)")
    },
    async ({ startDate, endDate }) => {
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

        // Build query parameters for declined requests
        const params = new URLSearchParams();
        params.append('statuses', 'Declined');
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const url = `https://openapi.planday.com/absence/v1.0/absencerecords?${params.toString()}`;
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json() as any;

        if (!data.data || data.data.length === 0) {
          return {
            content: [{
              type: "text",
              text: "✅ No declined absence requests found"
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse("declined-absence-requests", data)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("fetching declined absence requests", error)
          }]
        };
      }
    }
  );
} 