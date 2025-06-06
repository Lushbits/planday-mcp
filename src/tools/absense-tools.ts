// src/tools/absence-tools.ts

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService } from '../services/auth.js';
import { plandayAPI } from '../services/planday-api.js';
import { DataFormatters } from '../services/formatters.js';

export function registerAbsenceTools(server: McpServer) {
  // Get absence records tool below
  server.tool(
    "get-absence-records",
    {
      employeeId: z.number().optional().describe("Filter by specific employee ID"),
      startDate: z.string().optional().describe("Filter by start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("Filter by end date (YYYY-MM-DD)"),
      status: z.enum(["Pending", "Approved", "Declined", "Cancelled"]).optional().describe("Filter by status")
    },
    async ({ employeeId, startDate, endDate, status }) => {
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

        // Fetch absence records with filters
        const result = await plandayAPI.getAbsenceRecords(accessToken, {
          employeeId,
          startDate,
          endDate,
          status
        });

        if (!result.data || result.data.length === 0) {
          const filtersUsed = [
            employeeId && `Employee ID: ${employeeId}`,
            startDate && `Start: ${startDate}`,
            endDate && `End: ${endDate}`,
            status && `Status: ${status}`
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

        // Get employee names for the records
        const employeeIds = [...new Set(result.data.map(record => record.employeeId))];
        const employeeMap = await plandayAPI.getEmployeeMap(accessToken, employeeIds);

        // Build filter description
        const filtersUsed = [
          employeeId && `Employee ID: ${employeeId}`,
          startDate && `Start: ${startDate}`,
          endDate && `End: ${endDate}`,
          status && `Status: ${status}`
        ].filter(Boolean).join(", ");

        const formatted = DataFormatters.formatAbsenceRecords(
          result.data,
          employeeMap,
          filtersUsed
        );

        return {
          content: [{
            type: "text",
            text: formatted
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

        const result = await plandayAPI.getAbsenceRecord(accessToken, recordId);
        
        if (!result.data) {
          return {
            content: [{
              type: "text",
              text: `No absence record found with ID: ${recordId}`
            }]
          };
        }

        // Get employee name for this record
        const employeeMap = await plandayAPI.getEmployeeMap(accessToken, [result.data.employeeId]);

        const formatted = DataFormatters.formatAbsenceRecords(
          [result.data],
          employeeMap,
          `Record ID: ${recordId}`
        );

        return {
          content: [{
            type: "text",
            text: formatted
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

  // Get pending absence requests (common use case)
  server.tool(
    "get-pending-absence-requests",
    {},
    async () => {
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

        // Fetch only pending requests
        const result = await plandayAPI.getAbsenceRecords(accessToken, {
          status: "Pending"
        });

        if (!result.data || result.data.length === 0) {
          return {
            content: [{
              type: "text",
              text: "✅ No pending absence requests found"
            }]
          };
        }

        // Get employee names for the records
        const employeeIds = [...new Set(result.data.map(record => record.employeeId))];
        const employeeMap = await plandayAPI.getEmployeeMap(accessToken, employeeIds);

        const formatted = DataFormatters.formatAbsenceRecords(
          result.data,
          employeeMap,
          "Status: Pending (Awaiting Approval)"
        );

        return {
          content: [{
            type: "text",
            text: formatted
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("fetching pending absence requests", error)
          }]
        };
      }
    }
  );
}
