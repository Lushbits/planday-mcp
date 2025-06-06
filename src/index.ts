import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface PlandayTokens {
	refreshToken: string;
	accessToken?: string;
	portalId?: string;
	expiresAt?: string;
}

// Define our Planday MCP agent
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Planday Integration",
		version: "1.0.0",
	});

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

		// Debug tool - test session access
		this.server.tool(
			"debug-env",
			{},
			async () => {
				try {
					// @ts-ignore - Check global session
					const sessionExists = !!globalThis.plandaySession;
					const sessionData = globalThis.plandaySession;
					
					return {
						content: [{
							type: "text",
							text: `Debug info:
- Session exists: ${sessionExists}
- Session data: ${sessionData ? JSON.stringify(sessionData, null, 2) : 'null'}
- Hardcoded APP_ID: 4b79b7b4-932a-4a3b-9400-dcc24ece299e`
						}]
					};
				} catch (error) {
					return {
						content: [{
							type: "text", 
							text: `Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`
						}]
					};
				}
			}
		);

		// Debug API responses - see raw data structure
		this.server.tool(
			"debug-api-response",
			{
				endpoint: z.enum(["shifts", "employees"]).describe("Which API endpoint to debug"),
				startDate: z.string().optional().describe("For shifts: start date (YYYY-MM-DD)"),
				endDate: z.string().optional().describe("For shifts: end date (YYYY-MM-DD)")
			},
			async ({ endpoint, startDate, endDate }) => {
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

					let url: string;
					if (endpoint === "shifts") {
						const start = startDate || "2024-01-01";
						const end = endDate || "2024-01-31";
						url = `https://openapi.planday.com/scheduling/v1.0/shifts?from=${start}&to=${end}`;
					} else {
						url = 'https://openapi.planday.com/hr/v1.0/Employees';
					}

					const response = await fetch(url, {
						headers: {
							'Authorization': `Bearer ${accessToken}`,
							'X-ClientId': "4b79b7b4-932a-4a3b-9400-dcc24ece299e"
						}
					});

					if (!response.ok) {
						return {
							content: [{
								type: "text",
								text: `❌ API Error: ${response.status} ${response.statusText}`
							}]
						};
					}

					const data = await response.json();
					
					return {
						content: [{
							type: "text",
							text: `🔍 Raw API Response for ${endpoint}:\n\n${JSON.stringify(data, null, 2)}`
						}]
					};
				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `❌ Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`
						}]
					};
				}
			}
		);
	}

	private async authenticatePlanday(refreshToken: string): Promise<{success: boolean, portalName?: string, error?: string}> {
		try {
			// Test token exchange
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
				return { success: false, error: `Token exchange failed: ${tokenResponse.status}` };
			}

			const tokenData = await tokenResponse.json();

			// Store session data in globalThis
			// @ts-ignore
			globalThis.plandaySession = {
				refreshToken: refreshToken,
				accessToken: tokenData.access_token,
				expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
				portalId: "authenticated"
			};

			return { success: true, portalName: "Token exchange successful - session stored in memory" };
		} catch (error) {
			return { success: false, error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}` };
		}
	}

	private async getValidAccessToken(): Promise<string | null> {
		try {
			// @ts-ignore - Get session from globalThis
			const sessionData: PlandayTokens | undefined = globalThis.plandaySession;
			
			if (!sessionData || !sessionData.refreshToken) {
				return null;
			}
			
			// Check if token is still valid (with 5 minute buffer)
			if (sessionData.expiresAt && new Date(sessionData.expiresAt).getTime() > Date.now() + 300000) {
				return sessionData.accessToken || null;
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
					refresh_token: sessionData.refreshToken
				})
			});

			if (!tokenResponse.ok) return null;

			const tokenData = await tokenResponse.json();
			
			// Update session data
			sessionData.accessToken = tokenData.access_token;
			sessionData.expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
			
			// @ts-ignore - Update global session
			globalThis.plandaySession = sessionData;
			
			return tokenData.access_token;
		} catch (error) {
			return null;
		}
	}

	private async fetchShifts(accessToken: string, startDate: string, endDate: string): Promise<string> {
		const response = await fetch(`https://openapi.planday.com/scheduling/v1.0/shifts?from=${startDate}&to=${endDate}`, {
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

		// Collect unique employee and department IDs to minimize API calls
		const employeeIds = [...new Set(data.data.filter((shift: any) => shift.employeeId).map((shift: any) => shift.employeeId))];
		const departmentIds = [...new Set(data.data.map((shift: any) => shift.departmentId).filter(Boolean))];

		// Fetch employee and department data in parallel
		const [employeeMap, departmentMap] = await Promise.all([
			this.fetchEmployeeNames(accessToken, employeeIds),
			this.fetchDepartmentNames(accessToken, departmentIds)
		]);

		// Format the shifts data with resolved names
		let result = `📅 Shifts from ${startDate} to ${endDate} (${data.data.length} shifts found):\n\n`;
		
		data.data.forEach((shift: any, index: number) => {
			// Format dates nicely
			const startTime = shift.startDateTime ? new Date(shift.startDateTime).toLocaleString() : 'No start time';
			const endTime = shift.endDateTime ? new Date(shift.endDateTime).toLocaleString() : 'No end time';
			
			// Get names from maps
			const employeeName = shift.employeeId ? employeeMap.get(shift.employeeId) || `Employee ID: ${shift.employeeId}` : 'Unassigned';
			const departmentName = shift.departmentId ? departmentMap.get(shift.departmentId) || `Department ID: ${shift.departmentId}` : 'No department';
			
			result += `${index + 1}. ${employeeName}\n`;
			result += `   🏢 ${departmentName}\n`;
			result += `   ⏰ ${startTime} - ${endTime}\n`;
			result += `   📊 Status: ${shift.status || 'Unknown'}\n`;
			result += `   📅 Date: ${shift.date}\n`;
			if (shift.positionId) {
				result += `   💼 Position ID: ${shift.positionId}\n`;
			}
			result += '\n';
		});

		return result;
	}

	// Helper method to fetch employee names by IDs
	private async fetchEmployeeNames(accessToken: string, employeeIds: number[]): Promise<Map<number, string>> {
		const employeeMap = new Map<number, string>();
		
		if (employeeIds.length === 0) return employeeMap;

		try {
			// Note: This might need to be done in batches if there are many employees
			// For now, fetch all employees and filter
			const response = await fetch('https://openapi.planday.com/hr/v1.0/Employees', {
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'X-ClientId': "4b79b7b4-932a-4a3b-9400-dcc24ece299e"
				}
			});

			if (response.ok) {
				const employeeData = await response.json();
				if (employeeData.data) {
					employeeData.data.forEach((employee: any) => {
						if (employeeIds.includes(employee.id)) {
							const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || `Employee ${employee.id}`;
							employeeMap.set(employee.id, fullName);
						}
					});
				}
			}
		} catch (error) {
			console.error('Error fetching employee names:', error);
		}

		return employeeMap;
	}

	// Helper method to fetch department names by IDs
	private async fetchDepartmentNames(accessToken: string, departmentIds: number[]): Promise<Map<number, string>> {
		const departmentMap = new Map<number, string>();
		
		if (departmentIds.length === 0) return departmentMap;

		try {
			const response = await fetch('https://openapi.planday.com/hr/v1.0/Departments', {
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'X-ClientId': "4b79b7b4-932a-4a3b-9400-dcc24ece299e"
				}
			});

			if (response.ok) {
				const departmentData = await response.json();
				if (departmentData.data) {
					departmentData.data.forEach((department: any) => {
						if (departmentIds.includes(department.id)) {
							departmentMap.set(department.id, department.name || `Department ${department.id}`);
						}
					});
				}
			}
		} catch (error) {
			console.error('Error fetching department names:', error);
		}

		return departmentMap;
	}

	private async fetchEmployees(accessToken: string, department?: string): Promise<string> {
		let url = 'https://openapi.planday.com/hr/v1.0/Employees';
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
