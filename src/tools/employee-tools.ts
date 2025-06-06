// src/tools/employee-tools.ts

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService } from '../services/auth.js';
import { plandayAPI } from '../services/planday-api.js';
import { DataFormatters } from '../services/formatters.js';

export function registerEmployeeTools(server: McpServer) {
  // Get employees tool
  server.tool(
    "get-employees",
    {
      department: z.string().optional().describe("Filter by department name (optional)")
    },
    async ({ department }) => {
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

        const result = await plandayAPI.getEmployees(accessToken, department);
        const formatted = DataFormatters.formatEmployees(result.data, department);
        
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
            text: DataFormatters.formatError("fetching employees", error)
          }]
        };
      }
    }
  );

  // Get departments tool
  server.tool(
    "get-departments",
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

        const result = await plandayAPI.getDepartments(accessToken);
        const formatted = DataFormatters.formatDepartments(result.data);
        
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
            text: DataFormatters.formatError("fetching departments", error)
          }]
        };
      }
    }
  );
}
