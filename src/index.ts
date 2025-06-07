// src/index.ts - Working version with auth + employee + scheduling + absence + payroll tools

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Import working tool files
import { registerAuthTools } from './tools/auth-tools';
import { registerEmployeeTools } from './tools/employee-tools';
import { registerSchedulingTools } from './tools/scheduling-tools';
import { registerAbsenceTools } from './tools/absence-tools';
import { registerPayrollTools } from './tools/payroll-tools';

// Define our Planday MCP agent
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Planday Integration",
		version: "1.0.0",
	});

	async init() {
		// Register working tools
		registerAuthTools(this.server);
		registerEmployeeTools(this.server);
		registerSchedulingTools(this.server);
		registerAbsenceTools(this.server);
		registerPayrollTools(this.server);
		
		console.log("🚀 Planday MCP Server working with auth + employees + scheduling + absence + payroll!");
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
