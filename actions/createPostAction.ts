'use server';

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function createPostAction(formData: FormData) {
  // create a new post
  const user = await currentUser();
  if (!user) {
    redirect('/');
  }
  const postInput = formData.get('postInput') as string;
  const image = formData.get('image') as File;
  let imageUrl: string | undefined;

  if (!postInput) {
    throw new Error('Post input is required');
  }

  // define user

  //upload image if it exists

  // create post in database

  // revalidatePath '/' - home page
}
