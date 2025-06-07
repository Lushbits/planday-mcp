// src/tools/employee-tools.ts - Simple employee tools with correct MCP syntax

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService, makeAuthenticatedRequest } from '../services/auth';
import { DataFormatters } from '../services/formatters';

export function registerEmployeeTools(server: McpServer) {
  // Get all employees
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

        let url = 'https://openapi.planday.com/hr/v1.0/Employees';
        if (department) {
          url += `?department=${encodeURIComponent(department)}`;
        }

        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse("employees", data)
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

  // Get employee by ID
  server.tool(
    "get-employee-by-id",
    {
      employeeId: z.number().positive().describe("Employee ID to retrieve")
    },
    async ({ employeeId }) => {
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

        const url = `https://openapi.planday.com/hr/v1.0/Employees/${employeeId}`;
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse("employee", data)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError(`fetching employee ${employeeId}`, error)
          }]
        };
      }
    }
  );
} 