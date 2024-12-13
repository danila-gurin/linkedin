'use client';

import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { ImageIcon, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';

const PostForm = () => {
  const ref = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { user } = useUser();

  const handlePostAction = async (formData: FormData) => {
    const formDataCopy = formData;
    ref.current?.reset();
    const text = formDataCopy.get('postInput') as string;
    if (!text.trim()) {
      throw new Error('Post cannot be empty');
    }

    setPreview(null);

    try {
      await createPostAction(formDataCopy);
    } catch (error) {
      console.error('error creating post', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };
  return (
    <div className="mb-2">
      <form
        action={(formData) => {
          // handle form submission with server action
          handlePostAction(formData);
          // toast notification based on promise above
        }}
        ref={ref}
        className="p-3 bg-white rounded-lg border"
      >
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src={user?.imageUrl} />

            <AvatarFallback>
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <input
            type="text"
            name="postInput"
            placeholder="Start writing a post"
            className="flex-1 outline-none rounded-full py-3 px-4 border"
          />

          <input
            ref={fileInputRef}
            type="file"
            name="image"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
          <button type="submit" hidden>
            Post
          </button>
        </div>

        {/* preview conditional check*/}
        {preview && (
          <div className="mt-5">
            <img src={preview} alt="preview" className="w-full object-cover" />
          </div>
        )}

        <div className="flex justify-end mt-2 space-x-2">
          <Button type="button" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="mr-2" size={16} color="currentColor" />
            {preview ? 'Change' : 'Add'} Image
          </Button>

          {/* add a remove preview button */}
          {preview && (
            <Button
              variant="outline"
              type="button"
              onClick={() => setPreview(null)}
            >
              <XIcon className="mr-2" size={16} color="currentColor" /> Remove
              Image
            </Button>
          )}
        </div>
      </form>
      <hr className="mt-2 border-gray-300" />
    </div>
  );
};
export default PostForm;
