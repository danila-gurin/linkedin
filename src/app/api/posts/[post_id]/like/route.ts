import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import connectDB from '../../../../../../mongodb/db';
import { Post } from '../../../../../../mongodb/models/post';

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
    const likes = post.likes;
    return NextResponse.json({ likes });
  } catch (error) {
    return NextResponse.json(
      { error: 'error occured while fetching likes' },
      { status: 500 }
    );
  }
}

export interface LikePostRequestBody {
  userIdTwo: string;
}

export async function POST(
  request: Request,
  { params }: { params: { post_id: string } }
) {
  await connectDB(); // connect to the DB
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const { userIdTwo }: LikePostRequestBody = await request.json();
  try {
    const post = await Post.findById(params.post_id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    await post.likePost(userIdTwo);

    return NextResponse.json({ message: 'Post liked successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'error occured while fetching posts' },
      { status: 500 }
    );
  }
}
