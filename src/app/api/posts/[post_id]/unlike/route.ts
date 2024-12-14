import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import connectDB from '../../../../../../mongodb/db';
import { Post } from '../../../../../../mongodb/models/post';

export interface UnlikePostRequestBody {
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

  const { userIdTwo }: UnlikePostRequestBody = await request.json();
  try {
    const post = await Post.findById(params.post_id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    await post.unlikePost(userIdTwo);

    return NextResponse.json({ message: 'Post unliked successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'error occured while fetching posts' },
      { status: 500 }
    );
  }
}
