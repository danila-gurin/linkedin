import { NextResponse } from 'next/server';

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import connectDB from '../../../../../../mongodb/db';
import { Post } from '../../../../../../mongodb/models/post';
import { ICommentBase } from '../../../../../../mongodb/models/comment';
import { IUser } from '@/types/User';

export async function GET(
  request: Request,
  { params }: { params: { post_id: string } }
) {
  try {
    await connectDB(); // connect to the DB
    const post = await Post.findById(params.post_id);
    if (!post) {
      return NextResponse.json(
        { error: 'comments not found' },
        { status: 404 }
      );
    }
    const comments = await post.getAllComments();
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json(
      { error: 'error occured while fetching posts' },
      { status: 500 }
    );
  }
}

export interface AddCommentRequestBody {
  user: IUser;
  text: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  await connectDB(); // connect to the DB

  const { user, text }: AddCommentRequestBody = await request.json();
  try {
    const post = await Post.findById((await params).post_id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const comment: ICommentBase = {
      user,
      text,
    };
    await post.commentOnPost(comment);
    return NextResponse.json(
      { message: 'Comment added successfully', comment },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'error occured while fetching posts' },
      { status: 500 }
    );
  }
}
