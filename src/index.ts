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

	// Static storage for environment and session (simple approach)
	private static currentEnv?: Env;
	private static currentSessionId?: string;

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
					const result = await MyMCP.authenticatePlanday(refreshToken);
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
					const accessToken = await MyMCP.getValidAccessToken();
					if (!accessToken) {
						return {
							content: [{
								type: "text",
								text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
							}]
						};
					}

					const shifts = await MyMCP.fetchShifts(accessToken, startDate, endDate);
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
					const accessToken = await MyMCP.getValidAccessToken();
					if (!accessToken) {
						return {
							content: [{
								type: "text",
								text: "❌ Please authenticate with Planday first using the authenticate-planday tool"
							}]
						};
					}

					const employees = await MyMCP.fetchEmployees(accessToken, department);
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

	private static async authenticatePlanday(refreshToken: string): Promise<{success: boolean, portalName?: string, error?: string}> {
		if (!MyMCP.currentEnv || !MyMCP.currentSessionId) {
			throw new Error("Environment not initialized");
		}

		try {
			// Exchange refresh token for access token
			const tokenResponse = await fetch('https://id.planday.com/connect/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: MyMCP.currentEnv.PLANDAY_APP_ID,
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
					'X-ClientId': MyMCP.currentEnv.PLANDAY_APP_ID
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

			await MyMCP.currentEnv.PLANDAY_TOKENS.put(MyMCP.currentSessionId, JSON.stringify(tokenInfo));

			return { success: true, portalName };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	private static async getValidAccessToken(): Promise<string | null> {
		if (!MyMCP.currentEnv || !MyMCP.currentSessionId) return null;

		try {
			const storedData = await MyMCP.currentEnv.PLANDAY_TOKENS.get(MyMCP.currentSessionId);
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
					client_id: MyMCP.currentEnv.PLANDAY_APP_ID,
					grant_type: 'refresh_token',
					refresh_token: tokenInfo.refreshToken
				})
			});

			if (!tokenResponse.ok) return null;

			const tokenData = await tokenResponse.json();
			
			// Update stored token
			tokenInfo.accessToken = tokenData.access_token;
			tokenInfo.expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
			
			await MyMCP.currentEnv.PLANDAY_TOKENS.put(MyMCP.currentSessionId, JSON.stringify(tokenInfo));
			
			return tokenData.access_token;
		} catch (error) {
			return null;
		}
	}

	private static async fetchShifts(accessToken: string, startDate: string, endDate: string): Promise<string> {
		const response = await fetch(`https://openapi.planday.com/reports/v1/Shifts?startDate=${startDate}&endDate=${endDate}`, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'X-ClientId': MyMCP.currentEnv!.PLANDAY_APP_ID
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

	private static async fetchEmployees(accessToken: string, department?: string): Promise<string> {
		let url = 'https://openapi.planday.com/hr/v1/employees';
		if (department) {
			url += `?department=${encodeURIComponent(department)}`;
		}

		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'X-ClientId': MyMCP.currentEnv!.PLANDAY_APP_ID
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
			? `👥 Employees in ${department}:\n\n`
			: `👥 All Employees:\n\n`;
		
		data.data.forEach((employee: any, index: number) => {
			result += `${index + 1}. ${employee.firstName} ${employee.lastName}\n`;
			result += `   📧 ${employee.email || 'No email'}\n`;
			result += `   🏢 ${employee.departmentName || 'No department'}\n`;
			result += `   📋 ${employee.jobTitle || 'No job title'}\n`;
			result += '\n';
		});

		return result;
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// Set the environment and session for this request
		MyMCP.currentEnv = env;
		MyMCP.currentSessionId = request.headers.get('cf-ray') || Math.random().toString(36);
		
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
