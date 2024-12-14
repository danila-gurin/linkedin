import { NextResponse } from 'next/server';
import connectDB from '../../../../../mongodb/db';
import { Post } from '../../../../../mongodb/models/post';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: { post_id: string } }
) {
  await connectDB(); // connect to the DB
  try {
    const post = await Post.findById(params.post_id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: 'error occured while fetching posts' },
      { status: 500 }
    );
  }
}

export interface DeletePostRequestBody {
  userIdTwo: string;
}

export async function DELETE(
  request: Request,
  { params }: { params: { post_id: string } }
) {
  await connectDB(); // connect to the DB
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const { userIdTwo }: DeletePostRequestBody = await request.json();
  try {
    const post = await Post.findById(params.post_id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user.userId !== userIdTwo) {
      throw new Error('Unauthorized to delete this post');
    }
    await post.removePost();
    return NextResponse.json({ message: 'Post removed successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'error occured while fetching posts' },
      { status: 500 }
    );
  }
}
