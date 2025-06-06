// src/index.ts - Corrected with .ts imports

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Import tool registration functions - using .ts extensions
import { registerAuthTools } from './tools/auth-tools.ts';
import { registerEmployeeTools } from './tools/employee-tools.ts';
import { registerShiftTools } from './tools/shift-tools.ts';
import { registerAbsenceTools } from './tools/absence-tools.ts';

// Define our Planday MCP agent
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Planday Integration",
		version: "1.0.0",
	});

	async init() {
		// Register all tool categories
		registerAuthTools(this.server);
		registerEmployeeTools(this.server);
		registerShiftTools(this.server);
		registerAbsenceTools(this.server);
		
		console.log("🚀 Planday MCP Server initialized with modular tools + absence management + shift types");
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
