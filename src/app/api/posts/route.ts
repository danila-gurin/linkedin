import { NextResponse } from 'next/server';

import connectDB from '../../../../mongodb/db';
import { IPostBase, Post } from '../../../../mongodb/models/post';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { IUser } from '@/types/User';

export interface AddPostRequestBody {
  user: IUser;
  text: string;
  imageUrl?: string | null;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/');
  }
  await connectDB();

  try {
    const { user, text, imageUrl }: AddPostRequestBody = await request.json();

    const postData: IPostBase = {
      user,
      text,
      ...(imageUrl && { imageUrl }),
    };
    const post = await Post.create(postData);
    return NextResponse.json({ message: 'post successfully created', post });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating post' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await connectDB(); // connect to the DB
    const posts = await Post.getAllPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json(
      { error: 'error occured while fetching posts' },
      { status: 500 }
    );
  }
}
