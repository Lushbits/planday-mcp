// src/index.ts - Full version with all tools including payroll
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Import all tool registration functions
import { registerAuthTools } from './tools/auth-tools.ts';
import { registerEmployeeTools } from './tools/employee-tools.ts';
import { registerShiftTools } from './tools/shift-tools.ts';
import { registerAbsenceTools } from './tools/absence-tools.ts';
import { registerPayrollTools } from './tools/payroll-tools.ts'; // NEW!

// Define our Planday MCP agent
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Planday Integration",
		version: "2.0.0",
	});

	async init() {
		// Register all tool categories
		registerAuthTools(this.server);      // Authentication & debug tools
		registerEmployeeTools(this.server);  // HR management tools
		registerShiftTools(this.server);     // Scheduling tools
		registerAbsenceTools(this.server);   // Absence management tools
		registerPayrollTools(this.server);   // Payroll & cost analysis tools (NEW!)
		
		console.log("🚀 Planday MCP Server initialized with ALL tools: auth + employees + shifts + absence + payroll!");
		console.log("📊 NEW: Payroll cost analysis and labor expense tracking added!");
	}
}

// Export handler for Cloudflare Workers
export default {
	fetch(request: Request, env: any, ctx: ExecutionContext) {
		const url = new URL(request.url);
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}
		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}
		return new Response("Not found", { status: 404 });
	},
};
