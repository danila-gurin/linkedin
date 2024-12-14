import { IPostDocument } from '../../mongodb/models/post';
import Post from './Post';

function PostFeed({ posts }: { posts: IPostDocument[] }) {
  return (
    <div className="space-y-2 pb-26">
      {posts.map((post) => (
        <Post key={post._id?.toString()} post={post} />
      ))}
    </div>
  );
}
export default PostFeed;
