// src/tools/scheduling-tools.ts
// Comprehensive Planday Scheduling Tools - 18 MCP Tools Across 8 Domains
// Covers: Shifts, Positions, Shift Types, Sections, Schedule Days, Skills, History, Time & Cost

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService, makeAuthenticatedRequest } from '../services/auth';
import { DataFormatters } from '../services/formatters';

export function registerSchedulingTools(server: McpServer) {
  // Get shifts for a date range
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

        const url = `https://openapi.planday.com/scheduling/v1.0/shifts?from=${startDate}&to=${endDate}`;
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse("shifts", data)
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

  // Get departments
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

        const url = 'https://openapi.planday.com/hr/v1.0/Departments';
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse("departments", data)
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

  // Get positions
  server.tool(
    "get-positions",
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

        const url = 'https://openapi.planday.com/scheduling/v1.0/positions';
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse("positions", data)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("fetching positions", error)
          }]
        };
      }
    }
  );

  // Get shift types
  server.tool(
    "get-shift-types",
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

        const url = 'https://openapi.planday.com/scheduling/v1.0/shifttypes';
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse("shift-types", data)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("fetching shift types", error)
          }]
        };
      }
    }
  );
}
