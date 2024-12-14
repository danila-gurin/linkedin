'use client';

import { useEffect, useState } from 'react';
import { IPostDocument } from '../../mongodb/models/post';
import { SignedIn, useUser } from '@clerk/nextjs';
import { Button } from './ui/button';
import { MessageCircle, Repeat2, Send, ThumbsUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import CommentFeed from './CommentFeed';
import CommentForm from './CommentForm';
import { toast } from 'sonner';

function PostOptions({ post }: { post: IPostDocument }) {
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const { user } = useUser();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState<string[]>(post.likes || []); // Ensure likes is an array

  useEffect(() => {
    // Ensure likes is always treated as an array
    if (Array.isArray(likes) && user?.id && likes.includes(user.id)) {
      setLiked(true);
    }
  }, [likes, user]);

  const likeOrUnlikePost = async () => {
    if (!user?.id) {
      toast.error(`Failed to ${liked ? 'unlike' : 'like'} post`);

      console.error('User not logged in');
      return;
    }

    const originalLiked = liked;
    const originalLikes = likes;

    // Optimistic UI update
    setLiked(!liked);
    const newLikes = liked
      ? likes.filter((like) => like !== user.id)
      : [...likes, user.id];
    setLikes(newLikes);

    try {
      const endpoint = `/api/posts/${post._id}/${liked ? 'unlike' : 'like'}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIdTwo: user.id }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${liked ? 'unlike' : 'like'} post`);
      }

      // Fetch the updated likes
      const fetchLikesResponse = await fetch(`/api/posts/${post._id}/like`);
      if (!fetchLikesResponse.ok) {
        throw new Error('Failed to fetch updated likes');
      }

      const updatedLikes = await fetchLikesResponse.json();
      setLikes(updatedLikes.likes || []); // Ensure likes is an array
    } catch (error) {
      console.error(error);

      // Revert optimistic UI update on failure
      setLiked(originalLiked);
      setLikes(originalLikes);
    }
  };

  return (
    <div>
      <div className="flex justify-between p-4">
        <div>
          {likes.length > 0 && (
            <p className="text-xs text-gray-500 cursor-pointer hover:underline">
              {likes.length} {likes.length === 1 ? 'like' : 'likes'}
            </p>
          )}
        </div>
        <div>
          {post?.comments && post.comments.length > 0 && (
            <p
              onClick={() => setIsCommentOpen(!isCommentOpen)}
              className="text-xs text-gray-500 cursor-pointer hover:underline"
            >
              {post.comments.length} comments
            </p>
          )}
        </div>
      </div>

      <div className="flex p-2 justify-between px-2 border-t">
        <Button
          variant="ghost"
          className="postButton"
          onClick={likeOrUnlikePost}
        >
          <ThumbsUpIcon
            className={cn('mr-1', liked && 'text-[#4881c2] fill-[#4881c2]')}
          />{' '}
          Like
        </Button>

        <Button
          variant="ghost"
          className="postButton"
          onClick={() => setIsCommentOpen(!isCommentOpen)}
        >
          <MessageCircle
            className={cn(
              'mr-1',
              isCommentOpen && 'text-gray-600 fill-gray-600'
            )}
          />
          Comment
        </Button>

        <Button variant="ghost" className="postButton">
          <Repeat2 className="mr-1" />
          Repost
        </Button>

        <Button variant="ghost" className="postButton">
          <Send className="mr-1" />
          Send
        </Button>
      </div>

      {isCommentOpen && (
        <div className="p-4">
          <SignedIn>
            {' '}
            <CommentForm postId={post._id as string} />
          </SignedIn>

          <CommentFeed post={post} />
        </div>
      )}
    </div>
  );
}

export default PostOptions;
