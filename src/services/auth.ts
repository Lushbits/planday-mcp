// src/services/auth.ts

import { plandayAPI } from './planday-api.js';

export interface PlandayTokens {
  refreshToken: string;
  accessToken?: string;
  portalId?: string;
  expiresAt?: string;
}

export class AuthService {
  private static readonly SESSION_KEY = 'plandaySession';

  async authenticatePlanday(refreshToken: string): Promise<{
    success: boolean;
    portalName?: string;
    error?: string;
  }> {
    try {
      // Test token exchange using the API service
      const tokenData = await plandayAPI.exchangeRefreshToken(refreshToken);

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

      // Refresh the token using the API service
      const tokenData = await plandayAPI.exchangeRefreshToken(sessionData.refreshToken);
      
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
