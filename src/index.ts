// src/index.ts - Updated with new payroll tools
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// Import all tool registration functions
import { registerAuthTools } from "./tools/auth-tools.ts";
import { registerEmployeeTools } from "./tools/employee-tools.ts";
import { registerShiftTools } from "./tools/shift-tools.ts";
import { registerAbsenceTools } from "./tools/absence-tools.ts";
import { registerPayrollTools } from "./tools/payroll-tools.ts";

// Durable Object class for Cloudflare configuration
export class MyMCP {
  constructor(private state: DurableObjectState, private env: any) {}

  async fetch(request: Request): Promise<Response> {
    // This Durable Object is not actively used but required by wrangler config
    return new Response("MyMCP Durable Object", { status: 200 });
  }
}

// Create MCP server
const server = new McpServer({
  name: "planday-mcp-server",
  version: "2.0.0"
});

// Register all tool categories
registerAuthTools(server);      // Authentication & debug tools
registerEmployeeTools(server);  // HR management tools
registerShiftTools(server);     // Scheduling tools
registerAbsenceTools(server);   // Absence management tools
registerPayrollTools(server);   // Payroll & cost analysis tools

// Setup SSE transport and start server
const transport = new SSEServerTransport("/sse", {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  }
});

server.connect(transport).then(() => {
  console.log("🚀 Planday MCP Server running with 13 tools across 5 domains!");
  console.log("📊 New: Payroll cost analysis and labor expense tracking");
}).catch(console.error);

export default {
  fetch: transport.fetch.bind(transport)
};
