import axios from 'axios';

export interface B2AuthorizationOptions {
  applicationKeyId: string;
  applicationKey: string;
}

export interface B2UploadTokenOptions {
  bucketId: string;
  authorizationToken: string;
}

export class BackblazeB2Client {
  private baseUrl = 'https://api.backblazeb2.com/b2api/v2';
  private cachedAuthResponse: {
    authorizationToken: string;
    apiUrl: string;
    downloadUrl: string;
    accountId: string;
  } | null = null;

  constructor(private options: B2AuthorizationOptions) {}

  async authorize(): Promise<{
    accountId: string;
    authorizationToken: string;
    apiUrl: string;
    downloadUrl: string;
  }> {
    try {
      // Use cached response if available to prevent unnecessary API calls
      if (this.cachedAuthResponse) {
        return this.cachedAuthResponse;
      }

      const response = await axios.get(`${this.baseUrl}/b2_authorize_account`, {
        auth: {
          username: this.options.applicationKeyId,
          password: this.options.applicationKey,
        },
      });

      // Cache the authorization response
      this.cachedAuthResponse = response.data;

      return response.data;
    } catch (error) {
      console.error('B2 Authorization Failed:', error);
      throw error;
    }
  }

  async getAuthorizationToken(): Promise<string> {
    const authResponse = await this.authorize();
    return authResponse.authorizationToken;
  }

  async getUploadUrl(options: B2UploadTokenOptions): Promise<{
    uploadUrl: string;
    authorizationToken: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/b2_get_upload_url`,
        { bucketId: options.bucketId },
        {
          headers: {
            Authorization: options.authorizationToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get upload URL:', error);
      throw error;
    }
  }

  // Example usage method
  async uploadFile(bucketId: string, fileName: string, fileContent: Buffer) {
    try {
      // First, get the authorization token
      const authorizationToken = await this.getAuthorizationToken();

      // Then get the upload URL for the specific bucket
      const uploadUrlResponse = await this.getUploadUrl({
        bucketId,
        authorizationToken,
      });

      // Upload the file (you'd need to implement SHA1 hash and other B2 upload requirements)
      const uploadResponse = await axios.post(
        uploadUrlResponse.uploadUrl,
        fileContent,
        {
          headers: {
            Authorization: uploadUrlResponse.authorizationToken,
            'X-Bz-File-Name': encodeURIComponent(fileName),
            'Content-Type': 'b2/x-auto',
            // You'd need to add SHA1 of the file here
          },
        }
      );

      return uploadResponse.data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }
}

// Example of how to use the client
async function exampleUsage() {
  const client = new BackblazeB2Client({
    applicationKeyId: process.env.B2_APPLICATION_KEY_ID || '',
    applicationKey: process.env.B2_APPLICATION_KEY || '',
  });

  try {
    // Get the authorization token directly
    const authToken = await client.getAuthorizationToken();
    console.log('Authorization Token:', authToken);

    // You can use the token for further operations
    // For example, getting an upload URL
    const uploadUrlResponse = await client.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID || '',
      authorizationToken: authToken,
    });

    console.log('Upload URL obtained');
  } catch (error) {
    console.error('B2 Operation failed:', error);
  }
}
