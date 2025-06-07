// src/tools/auth-tools.ts

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authService, makeAuthenticatedRequest } from '../services/auth';
import { DataFormatters } from '../services/formatters';

export function registerAuthTools(server: McpServer) {
  // Main authentication tool
  server.tool(
    "authenticate-planday",
    { 
      refreshToken: z.string().describe("Your Planday refresh token from API Access settings")
    },
    async ({ refreshToken }) => {
      try {
        const result = await authService.authenticatePlanday(refreshToken);
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAuthenticationResult(result.success, result.portalName, result.error)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("authenticating", error)
          }]
        };
      }
    }
  );

  // Session debug tool
  server.tool(
    "debug-session",
    {},
    async () => {
      try {
        const sessionInfo = authService.getSessionInfo();
        const isAuth = authService.isAuthenticated();
        
        return {
          content: [{
            type: "text",
            text: `🔍 Session Debug:
- Is Authenticated: ${isAuth}
- Session Info: ${sessionInfo ? JSON.stringify(sessionInfo, null, 2) : 'null'}
- Services: ✅ AuthService, ✅ DataFormatters, ✅ Domain APIs loaded`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text", 
            text: DataFormatters.formatError("debugging session", error)
          }]
        };
      }
    }
  );

  // Environment debug tool
  server.tool(
    "debug-env",
    {},
    async () => {
      try {
        const sessionExists = authService.isAuthenticated();
        const sessionData = authService.getSessionInfo();
        
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatDebugInfo(sessionExists, sessionData)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text", 
            text: DataFormatters.formatError("debugging environment", error)
          }]
        };
      }
    }
  );

  // API debug tool
  server.tool(
    "debug-api-response",
    {
      endpoint: z.enum(["shifts", "employees", "departments"]).describe("Which API endpoint to debug"),
      startDate: z.string().optional().describe("For shifts: start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("For shifts: end date (YYYY-MM-DD)")
    },
    async ({ endpoint, startDate, endDate }) => {
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

        let url: string;
        if (endpoint === "shifts") {
          const start = startDate || "2024-01-01";
          const end = endDate || "2024-01-31";
          url = `https://openapi.planday.com/scheduling/v1.0/shifts?from=${start}&to=${end}`;
        } else if (endpoint === "employees") {
          url = 'https://openapi.planday.com/hr/v1.0/Employees';
        } else {
          url = 'https://openapi.planday.com/hr/v1.0/Departments';
        }

        // Use the new makeAuthenticatedRequest function directly
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatAPIResponse(endpoint, data)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: DataFormatters.formatError("debugging API", error)
          }]
        };
      }
    }
  );
}
