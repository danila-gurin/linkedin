import axios from 'axios';

class BackblazeB2TokenManager {
  private static baseUrl = 'https://api.backblazeb2.com/b2api/v2';
  private static cachedToken: string;
  private static cachedTokenExpiry: number | null = null;

  // Token is typically valid for 24 hours
  private static TOKEN_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  static async getAuthorizationToken(): Promise<string> {
    // Check if we have a valid cached token
    if (
      this.cachedToken &&
      this.cachedTokenExpiry &&
      Date.now() < this.cachedTokenExpiry
    ) {
      return this.cachedToken;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/b2_authorize_account`, {
        auth: {
          username: process.env.B2_APPLICATION_KEY_ID || '',
          password: process.env.B2_APPLICATION_KEY || '',
        },
      });

      // Cache the new token and its expiry time
      this.cachedToken = response.data.authorizationToken;
      this.cachedTokenExpiry = Date.now() + this.TOKEN_EXPIRATION_TIME;

      return this.cachedToken;
    } catch (error) {
      console.error('B2 Authorization Failed:', error);
      throw error;
    }
  }
}

export default BackblazeB2TokenManager;
