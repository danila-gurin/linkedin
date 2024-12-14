'use server';

import { AddCommentRequestBody } from '@/app/api/posts/[post_id]/comments/route';

import { IUser } from '@/types/User';
import { currentUser } from '@clerk/nextjs/server';
import { Post } from '../mongodb/models/post';
import { ICommentBase } from '../mongodb/models/comment';
import { revalidatePath } from 'next/cache';

export default async function createCommentAction(
  postId: string,
  formData: FormData
) {
  const user = await currentUser();
  const commentInput = formData.get('commentInput') as string;
  if (!postId) {
    throw new Error('postId is required');
  }
  if (!commentInput) {
    throw new Error('comment input is required');
  }

  if (!user?.id) {
    throw new Error('User not found');
  }

  const userDB: IUser = {
    userId: user.id,
    userImage: user.imageUrl,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  };

  const body: AddCommentRequestBody = {
    text: commentInput,
    user: userDB,
  };

  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }
  const comment: ICommentBase = {
    user: userDB,
    text: commentInput,
  };

  try {
    await post.commentOnPost(comment);
  } catch (error) {
    throw new Error('Error creating comment');
  }
  revalidatePath('/');
}
