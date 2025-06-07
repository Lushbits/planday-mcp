// src/services/auth.ts

export interface PlandayTokens {
  refreshToken: string;
  accessToken?: string;
  portalId?: string;
  expiresAt?: string;
}

export class AuthService {
  private static readonly SESSION_KEY = 'plandaySession';
  private static readonly BASE_URL = 'https://openapi.planday.com';
  private static readonly AUTH_URL = 'https://id.planday.com';
  private static readonly CLIENT_ID = '4b79b7b4-932a-4a3b-9400-dcc24ece299e';

  async authenticatePlanday(refreshToken: string): Promise<{
    success: boolean;
    portalName?: string;
    error?: string;
  }> {
    try {
      // Test token exchange using our internal method
      const tokenData = await this.exchangeRefreshToken(refreshToken);
      
      // Store session data in globalThis (same as your current implementation)
      this.setSession({
        refreshToken: refreshToken,
        accessToken: tokenData.access_token,
        expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        portalId: "authenticated"
      });
      
      return { 
        success: true, 
        portalName: "Token exchange successful - session stored in memory" 
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    try {
      const sessionData = this.getSession();
      
      if (!sessionData || !sessionData.refreshToken) {
        return null;
      }
      
      // Check if token is still valid (with 5 minute buffer)
      if (sessionData.expiresAt && new Date(sessionData.expiresAt).getTime() > Date.now() + 300000) {
        return sessionData.accessToken || null;
      }
      
      // Refresh the token using our internal method
      const tokenData = await this.exchangeRefreshToken(sessionData.refreshToken);
      
      // Update session data
      sessionData.accessToken = tokenData.access_token;
      sessionData.expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
      
      this.setSession(sessionData);
      
      return tokenData.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const session = this.getSession();
    return !!(session && session.refreshToken);
  }

  clearSession(): void {
    // @ts-ignore - Clear global session
    delete globalThis[AuthService.SESSION_KEY];
  }

  getSessionInfo(): PlandayTokens | null {
    return this.getSession();
  }

  // Token exchange method (moved from PlandayAPIService)
  async exchangeRefreshToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await fetch(`${AuthService.AUTH_URL}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: AuthService.CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Private methods
  private getSession(): PlandayTokens | undefined {
    // @ts-ignore - Get session from globalThis (same as your current implementation)
    return globalThis[AuthService.SESSION_KEY];
  }

  private setSession(sessionData: PlandayTokens): void {
    // @ts-ignore - Update global session (same as your current implementation)
    globalThis[AuthService.SESSION_KEY] = sessionData;
  }
}

// Export a singleton instance
export const authService = new AuthService();

// FUNCTIONS FOR NEW API FILES

/**
 * Make an authenticated request to Planday API
 * Used by the new domain-specific API files
 */
export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = await authService.getValidAccessToken();
  
  if (!accessToken) {
    throw new Error('No valid access token available. Please authenticate first.');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'X-ClientId': '4b79b7b4-932a-4a3b-9400-dcc24ece299e',
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Ensure user is authenticated before proceeding
 * Used by the new tool files
 */
export async function ensureAuthenticated(): Promise<void> {
  if (!authService.isAuthenticated()) {
    throw new Error('Not authenticated. Please use the authenticate-planday tool first.');
  }

  const accessToken = await authService.getValidAccessToken();
  if (!accessToken) {
    throw new Error('Unable to get valid access token. Please re-authenticate using the authenticate-planday tool.');
  }
}
