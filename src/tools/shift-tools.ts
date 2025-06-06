// src/tools/shift-tools.ts

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService } from '../services/auth.js';
import { plandayAPI } from '../services/planday-api.js';
import { DataFormatters } from '../services/formatters.js';

export function registerShiftTools(server: McpServer) {
  // Get shifts tool
  server.tool(
    "get-shifts",
    {
      startDate: z.string().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().describe("End date in YYYY-MM-DD format")
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

        // Fetch shifts data
        const shiftsResult = await plandayAPI.getShifts(accessToken, startDate, endDate);
        
        if (!shiftsResult.data || shiftsResult.data.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No shifts found for the period ${startDate} to ${endDate}`
            }]
          };
        }

        // Get unique IDs for batch lookups
        const employeeIds = [...new Set(shiftsResult.data.filter(shift => shift.employeeId).map(shift => shift.employeeId!))];
        const departmentIds = [...new Set(shiftsResult.data.map(shift => shift.departmentId).filter(Boolean) as number[])];
        const positionIds = [...new Set(shiftsResult.data.map(shift => shift.positionId).filter(Boolean) as number[])];

        // Fetch lookup data in parallel
        const [employeeMap, departmentMap, positionMap] = await Promise.all([
          plandayAPI.getEmployeeMap(accessToken, employeeIds),
          plandayAPI.getDepartmentMap(accessToken, departmentIds),
          plandayAPI.getPositions(accessToken, positionIds)
        ]);

        // Format using the formatter
        const formatted = DataFormatters.formatShifts(
          shiftsResult.data, 
          startDate, 
          endDate, 
          employeeMap, 
          departmentMap, 
          positionMap
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
            text: DataFormatters.formatError("fetching shifts", error)
          }]
        };
      }
    }
  );
}
