// src/tools/absence-tools.ts

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ensureAuthenticated } from '../services/auth';
import { getAbsenceRecords, getAbsenceRecord, getPendingAbsenceRequests } from '../services/api/absence-api';
import { getEmployeesByIds } from '../services/api/hr-api';
import { DataFormatters } from '../services/formatters';

export function registerAbsenceTools(server: McpServer) {
  // Get absence records tool
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
        await ensureAuthenticated();

        // Fetch absence records with filters
        const absenceRecords = await getAbsenceRecords({
          employeeId,
          startDate,
          endDate,
          status
        });

        if (!absenceRecords || absenceRecords.length === 0) {
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
        const employeeIds = [...new Set(absenceRecords.map(record => record.employeeId))];
        const employeesMap = await getEmployeesByIds(employeeIds);
        
        // Convert to name map for formatter
        const employeeNameMap = new Map<number, string>();
        employeesMap.forEach((employee, id) => {
          const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || `Employee ${id}`;
          employeeNameMap.set(id, fullName);
        });

        // Build filter description
        const filtersUsed = [
          employeeId && `Employee ID: ${employeeId}`,
          startDate && `Start: ${startDate}`,
          endDate && `End: ${endDate}`,
          status && `Status: ${status}`
        ].filter(Boolean).join(", ");

        const formatted = DataFormatters.formatAbsenceRecords(
          absenceRecords,
          employeeNameMap,
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
        await ensureAuthenticated();

        const absenceRecord = await getAbsenceRecord(recordId);
        
        if (!absenceRecord) {
          return {
            content: [{
              type: "text",
              text: `No absence record found with ID: ${recordId}`
            }]
          };
        }

        // Get employee name for this record
        const employeesMap = await getEmployeesByIds([absenceRecord.employeeId]);
        const employeeNameMap = new Map<number, string>();
        employeesMap.forEach((employee, id) => {
          const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || `Employee ${id}`;
          employeeNameMap.set(id, fullName);
        });

        const formatted = DataFormatters.formatAbsenceRecords(
          [absenceRecord],
          employeeNameMap,
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
        await ensureAuthenticated();

        // Fetch only pending requests using convenience function
        const pendingRequests = await getPendingAbsenceRequests();

        if (!pendingRequests || pendingRequests.length === 0) {
          return {
            content: [{
              type: "text",
              text: "✅ No pending absence requests found"
            }]
          };
        }

        // Get employee names for the records
        const employeeIds = [...new Set(pendingRequests.map(record => record.employeeId))];
        const employeesMap = await getEmployeesByIds(employeeIds);
        
        // Convert to name map for formatter
        const employeeNameMap = new Map<number, string>();
        employeesMap.forEach((employee, id) => {
          const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || `Employee ${id}`;
          employeeNameMap.set(id, fullName);
        });

        const formatted = DataFormatters.formatAbsenceRecords(
          pendingRequests,
          employeeNameMap,
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
