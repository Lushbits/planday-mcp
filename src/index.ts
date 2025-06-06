import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface PlandayTokens {
	refreshToken: string;
	accessToken?: string;
	portalId?: string;
	expiresAt?: string;
}

interface Env {
	PLANDAY_TOKENS: KVNamespace;
	PLANDAY_APP_ID: string;
}

// Define our Planday MCP agent
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Planday Integration",
		version: "1.0.0",
	});

	// Global storage for environment variables
	private static globalEnv?: Env;

	// Set the global environment (called from fetch handler)
	static setEnvironment(env: Env) {
		MyMCP.globalEnv = env;
	}

	async init() {
		// Planday authentication tool - customers provide their refresh token
		this.server.tool(
			"authenticate-planday",
			{ 
				refreshToken: z.string().describe("Your Planday refresh token from API Access settings")
			},
			async ({ refreshToken }) => {
				try {
					// Validate and store the token
					const result = await this.authenticatePlanday(refreshToken);
					return {
						content: [{
							type: "text",
							text: result.success 
								? `✅ Successfully connected to Planday portal: ${result.portalName}`
								: `❌ Authentication failed: ${result.error}`
						}]
					};
				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
						}]
					};
				}
			}
		);

		// Get shifts tool
		this.server.tool(
			"get-shifts",
			{
				startDate: z.string().describe("Start date in YYYY-MM-DD format"),
				endDate: z.string().describe("End date in YYYY-MM-DD format")
			},
			async ({ startDate, endDate }) => {
				try {
					const accessToken = await this.getValidAccessToken();
					if (!accessToken) {
						return {
							content: [{
								type: "text",
								text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
							}]
						};
					}

					const shifts = await this.fetchShifts(accessToken, startDate, endDate);
					return {
						content: [{
							type: "text",
							text: shifts
						}]
					};
				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `❌ Error fetching shifts: ${error instanceof Error ? error.message : 'Unknown error'}`
						}]
					};
				}
			}
		);

		// Get employees tool
		this.server.tool(
			"get-employees",
			{
				department: z.string().optional().describe("Filter by department name (optional)")
			},
			async ({ department }) => {
				try {
					const accessToken = await this.getValidAccessToken();
					if (!accessToken) {
						return {
							content: [{
								type: "text",
								text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
							}]
						};
					}

					const employees = await this.fetchEmployees(accessToken, department);
					return {
						content: [{
							type: "text",
							text: employees
						}]
					};
				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `❌ Error fetching employees: ${error instanceof Error ? error.message : 'Unknown error'}`
						}]
					};
				}
			}
		);
	}

	private async authenticatePlanday(refreshToken: string, env: Env): Promise<{success: boolean, portalName?: string, error?: string}> {
		try {
			// Use a fixed session key for simplicity (in real app, this would be user-specific)
			const sessionId = "default-session";

			// Exchange refresh token for access token
			const tokenResponse = await fetch('https://id.planday.com/connect/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: "4b79b7b4-932a-4a3b-9400-dcc24ece299e",
					grant_type: 'refresh_token',
					refresh_token: refreshToken
				})
			});

			if (!tokenResponse.ok) {
				return { success: false, error: `Invalid refresh token: ${tokenResponse.status}` };
			}

			const tokenData = await tokenResponse.json();
			const accessToken = tokenData.access_token;

			// Get portal information
			const portalResponse = await fetch('https://openapi.planday.com/portal/v1/Portal', {
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'X-ClientId': "4b79b7b4-932a-4a3b-9400-dcc24ece299e"
				}
			});

			if (!portalResponse.ok) {
				return { success: false, error: `Cannot access portal: ${portalResponse.status}` };
			}

			const portalData = await portalResponse.json();
			const portalId = portalData.id;
			const portalName = portalData.name;

			// Store tokens for this session
			const tokenInfo: PlandayTokens = {
				refreshToken,
				accessToken,
				portalId,
				expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
			};

			await env.PLANDAY_TOKENS.put(sessionId, JSON.stringify(tokenInfo));

			return { success: true, portalName };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	private async getValidAccessToken(env: Env): Promise<string | null> {
		const sessionId = "default-session";
		
		try {
			const storedData = await env.PLANDAY_TOKENS.get(sessionId);
			if (!storedData) return null;

			const tokenInfo: PlandayTokens = JSON.parse(storedData);
			
			// Check if token is still valid (with 5 minute buffer)
			if (tokenInfo.expiresAt && new Date(tokenInfo.expiresAt).getTime() > Date.now() + 300000) {
				return tokenInfo.accessToken || null;
			}

			// Refresh the token
			const tokenResponse = await fetch('https://id.planday.com/connect/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: "4b79b7b4-932a-4a3b-9400-dcc24ece299e",
					grant_type: 'refresh_token',
					refresh_token: tokenInfo.refreshToken
				})
			});

			if (!tokenResponse.ok) return null;

			const tokenData = await tokenResponse.json();
			
			// Update stored token
			tokenInfo.accessToken = tokenData.access_token;
			tokenInfo.expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
			
			await env.PLANDAY_TOKENS.put(sessionId, JSON.stringify(tokenInfo));
			
			return tokenData.access_token;
		} catch (error) {
			return null;
		}
	}

	private async fetchShifts(accessToken: string, startDate: string, endDate: string, env: Env): Promise<string> {
		const response = await fetch(`https://openapi.planday.com/reports/v1/Shifts?startDate=${startDate}&endDate=${endDate}`, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'X-ClientId': "4b79b7b4-932a-4a3b-9400-dcc24ece299e"
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch shifts: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		
		if (!data.data || data.data.length === 0) {
			return `No shifts found for the period ${startDate} to ${endDate}`;
		}

		// Format the shifts data nicely
		let result = `📅 Shifts from ${startDate} to ${endDate}:\n\n`;
		
		data.data.forEach((shift: any, index: number) => {
			result += `${index + 1}. ${shift.employeeName || 'Unknown Employee'}\n`;
			result += `   📍 ${shift.departmentName || 'No department'}\n`;
			result += `   ⏰ ${shift.startTime} - ${shift.endTime}\n`;
			result += `   📊 Status: ${shift.status || 'Unknown'}\n`;
			if (shift.breakMinutes) {
				result += `   ☕ Break: ${shift.breakMinutes} minutes\n`;
			}
			result += '\n';
		});

		return result;
	}

	private async fetchEmployees(accessToken: string, department: string | undefined): Promise<string> {
		let url = 'https://openapi.planday.com/hr/v1.0/employees';
		if (department) {
			url += `?department=${encodeURIComponent(department)}`;
		}

		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'X-ClientId': "4b79b7b4-932a-4a3b-9400-dcc24ece299e"
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		
		if (!data.data || data.data.length === 0) {
			return department 
				? `No employees found in department: ${department}`
				: 'No employees found';
		}

		// Format the employees data nicely
		let result = department 
			? `👥 Employees in ${department} (${data.data.length} found):\n\n`
			: `👥 All Employees (${data.data.length} found):\n\n`;
		
		data.data.forEach((employee: any, index: number) => {
			result += `${index + 1}. ${employee.firstName} ${employee.lastName}\n`;
			result += `   👤 ID: ${employee.id}\n`;
			result += `   📧 Email: ${employee.email || 'No email'}\n`;
			result += `   📱 Phone: ${employee.cellPhone || 'No phone'}\n`;
			result += `   🏢 Primary Dept ID: ${employee.primaryDepartmentId || 'None'}\n`;
			result += `   👤 Username: ${employee.userName || 'No username'}\n`;
			result += `   📅 Hired: ${employee.hiredDate || 'Unknown'}\n`;
			if (employee.deactivationDate) {
				result += `   ❌ Deactivated: ${employee.deactivationDate}\n`;
			}
			result += '\n';
		});

		return result;
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		console.log('=== FETCH HANDLER DEBUG ===');
		console.log('env.PLANDAY_APP_ID:', env.PLANDAY_APP_ID);
		console.log('env.PLANDAY_TOKENS exists:', !!env.PLANDAY_TOKENS);
		
		// Set global environment for all MCP operations
		MyMCP.setEnvironment(env);
		console.log('Global environment set');
		
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
