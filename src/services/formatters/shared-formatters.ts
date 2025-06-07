// src/services/formatters/shared-formatters.ts
// Shared Formatters - Common utility formatters for debug, error handling, and authentication

/**
 * Format debug session information for troubleshooting
 * Provides visibility into session state and configuration
 */
export function formatDebugInfo(sessionExists: boolean, sessionData: any): string {
  return `🔧 **Debug Session Information**:

📊 **Session Status**: ${sessionExists ? '✅ Active' : '❌ No session found'}
📋 **Session Data**: ${sessionData ? JSON.stringify(sessionData, null, 2) : 'null'}
🔑 **Hardcoded APP_ID**: 4b79b7b4-932a-4a3b-9400-dcc24ece299e

💡 **Troubleshooting Tips**:
- If no session exists, authenticate first using the authenticate-planday tool
- Session data shows token expiry and portal information
- APP_ID is hardcoded for simplified deployment`;
}

/**
 * Format raw API response data for debugging and inspection
 * Useful for troubleshooting API integration issues
 */
export function formatAPIResponse(endpoint: string, data: any): string {
  return `🔍 **Raw API Response from ${endpoint}**:\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
}

/**
 * Format error messages with context and user-friendly guidance
 * Provides clear error information without exposing sensitive details
 */
export function formatError(operation: string, error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return `❌ **Error ${operation}**: ${errorMessage}`;
}

/**
 * Format success messages with consistent styling
 * Used for positive feedback on operations
 */
export function formatSuccess(message: string): string {
  return `✅ **Success**: ${message}`;
}

/**
 * Format authentication results with detailed status information
 * Provides clear feedback on authentication state and next steps
 */
export function formatAuthenticationResult(success: boolean, portalName?: string, error?: string): string {
  if (success) {
    return `✅ **Authentication Successful!**
    
🏢 **Portal**: ${portalName || 'Unknown'}
🔐 **Status**: Authenticated and ready to use
⏰ **Token**: Valid with automatic refresh
    
💡 You can now use all Planday tools to query your workforce data!`;
  } else {
    return `❌ **Authentication Failed**
    
🚫 **Error**: ${error || 'Unknown authentication error'}
    
💡 **Next Steps**:
1. Verify your Planday refresh token is correct
2. Check that your Planday account has API access enabled
3. Ensure the token hasn't expired
4. Contact your Planday administrator if issues persist`;
  }
} 