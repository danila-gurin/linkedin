'use server';

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Post } from '../mongodb/models/post';

import { AddPostRequestBody } from '@/app/api/posts/route';
import { IUser } from '../src/types/User';

export default async function createPostAction(formData: FormData) {
  // create a new post
  const user = await currentUser();
  if (!user) {
    throw new Error('User not found');
  }
  const postInput = formData.get('postInput') as string;
  const image = formData.get('image') as File;
  let imageUrl: string | undefined;

  if (!postInput) {
    throw new Error('Post input is required');
  }

  // define user
  const userDB: IUser = {
    userId: user.id,
    userImage: user.imageUrl,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  };

  try {
    if (image.size > 0) {
      //upload image if it exists - MS Blob storage
      // create post in database with image
      const body: AddPostRequestBody = {
        user: userDB,
        text: postInput,
        // imageUrl: image_url,
      };
      await Post.create(body);
    } else {
      // create post in database without image
      const body: AddPostRequestBody = {
        user: userDB,
        text: postInput,
      };

      await Post.create(body);
    }
  } catch (error: any) {
    console.error('Error creating post', error);
  }

  // revalidatePath '/' - home page
}
