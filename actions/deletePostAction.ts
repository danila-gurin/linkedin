'use server';
import { currentUser } from '@clerk/nextjs/server';
import { Post } from '../mongodb/models/post';
import { revalidatePath } from 'next/cache';

export default async function deletePostAction(postId: string) {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error('User not found');
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }
  if (post.user.userId !== user.id) {
    throw new Error('User not authorized to delete this post');
  }

  try {
    await post.removePost();
    revalidatePath('/');
  } catch (error) {
    console.error('Delete post failed:', error);
    throw error;
  }
}
