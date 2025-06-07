// src/index.ts - Full version with all tools including payroll
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Import all tool registration functions
import { registerAuthTools } from './tools/auth-tools.ts';
import { registerHRTools } from './tools/hr-tools.ts';
import { registerSchedulingTools } from './tools/scheduling-tools.ts'; // COMPREHENSIVE SCHEDULING
import { registerAbsenceTools } from './tools/absence-tools.ts';
import { registerPayrollTools } from './tools/payroll-tools.ts';

// Define our Planday MCP agent
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Planday Integration",
		version: "2.0.0",
	});

	async init() {
		// Register all tool categories
		registerAuthTools(this.server);          // Authentication & debug tools
		registerHRTools(this.server);            // HR management tools
		registerSchedulingTools(this.server);    // COMPREHENSIVE SCHEDULING (18 tools across 8 domains)
		registerAbsenceTools(this.server);       // Absence management tools
		registerPayrollTools(this.server);       // Payroll & cost analysis tools
		
		console.log("🚀 Planday MCP Server initialized with COMPREHENSIVE HR & SCHEDULING!");
		console.log("👥 ENHANCED: Complete HR management suite - 25 tools across 7 domains:");
		console.log("  • Employee Management (12 tools): CRUD, activate/deactivate, history, custom fields");
		console.log("  • Departments (5 tools): create, read, update, delete, assign employees");
		console.log("  • Employee Groups (5 tools): organize workforce categories");
		console.log("  • Skills & Types (4 tools): competency tracking & employment classification");
		console.log("📅 COMPREHENSIVE: Complete scheduling suite - 18 tools across 8 domains:");
		console.log("  • Full workforce lifecycle from hire to payroll approval");
		console.log("  • Total: 49 tools across 5 business domains (Auth, HR, Scheduling, Absence, Payroll)");
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
