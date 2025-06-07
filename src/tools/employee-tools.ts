// src/tools/employee-tools.ts

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ensureAuthenticated } from '../services/auth.ts';
import { getEmployees, getDepartments } from '../services/api/hr-api.ts';
import { DataFormatters } from '../services/formatters.ts';

export function registerEmployeeTools(server: McpServer) {
  // Get employees tool
  server.tool(
    "get-employees",
    {
      department: z.string().optional().describe("Filter by department name (optional)")
    },
    async ({ department }) => {
      try {
        await ensureAuthenticated();

        const employees = await getEmployees(department);
        const formatted = DataFormatters.formatEmployees(employees, department);
        
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
        await ensureAuthenticated();

        const departments = await getDepartments();
        const formatted = DataFormatters.formatDepartments(departments);
        
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
