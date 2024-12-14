'use server';
import { currentUser } from '@clerk/nextjs/server';
import { Post } from '../mongodb/models/post';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { Buffer } from 'buffer';
import { revalidatePath } from 'next/cache';

// Verify required environment variables
const requiredEnvVars = [
  'B2_APPLICATION_KEY_ID',
  'B2_APPLICATION_KEY',
  'B2_BUCKET_NAME',
  'B2_BUCKET_ID',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const getB2Auth = async () => {
  try {
    const authResponse = await axios.get(
      'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
      {
        auth: {
          username: process.env.B2_APPLICATION_KEY_ID!,
          password: process.env.B2_APPLICATION_KEY!,
        },
      }
    );

    if (!authResponse.data.allowed?.capabilities?.includes('writeFiles')) {
      throw new Error('Application key lacks writeFiles permission');
    }

    return authResponse.data;
  } catch (error) {
    console.error('B2 Authentication failed:', error);
    throw new Error('Failed to authenticate with B2');
  }
};

const getUploadUrl = async (
  apiUrl: string,
  authToken: string,
  bucketId: string
) => {
  try {
    const response = await axios.post(
      `${apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId },
      {
        headers: {
          Authorization: authToken,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      'Failed to get upload URL:',
      error.response?.data || error.message
    );
    throw new Error('Failed to get upload URL');
  }
};

const uploadImageToB2 = async (image: File): Promise<string> => {
  try {
    const auth = await getB2Auth();
    const uploadUrl = await getUploadUrl(
      auth.apiUrl,
      auth.authorizationToken,
      process.env.B2_BUCKET_ID!
    );

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${randomUUID()}_${Date.now()}.png`;
    const sha1 = require('crypto')
      .createHash('sha1')
      .update(buffer)
      .digest('hex');

    // Upload file with proper error handling
    const uploadResponse = await axios.post(uploadUrl.uploadUrl, buffer, {
      headers: {
        Authorization: uploadUrl.authorizationToken,
        'X-Bz-File-Name': fileName, // Remove encodeURIComponent
        'Content-Type': 'image/png',
        'X-Bz-Content-Sha1': sha1,
        'Content-Length': buffer.length.toString(),
      },
    });

    // Construct the correct download URL
    const downloadUrl = `${auth.downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${fileName}`;
    console.log('Image uploaded successfully:', downloadUrl);
    return downloadUrl;
  } catch (error: any) {
    console.error(
      'Image upload failed:',
      error.response?.data || error.message
    );
    throw new Error('Failed to upload image to B2');
  }
};

export default async function createPostAction(formData: FormData) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('User not found');
    }

    const postInput = formData.get('postInput') as string;
    if (!postInput) {
      throw new Error('Post input is required');
    }

    const image = formData.get('image') as File;
    const userDB = {
      userId: user.id,
      userImage: user.imageUrl,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    };

    const postBody: any = {
      user: userDB,
      text: postInput,
    };

    if (image && image.size > 0) {
      const imageUrl = await uploadImageToB2(image);
      postBody.imageUrl = imageUrl;
    }

    const post = await Post.create(postBody);
    revalidatePath('/');
    return post;
  } catch (error: any) {
    console.error('Create post failed:', error.message);
    throw error;
  }
}
