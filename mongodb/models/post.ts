import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { IUser } from '../../types/User';
import { IComment, ICommentBase, Comment } from './comment';

export interface IPostBase {
  user: IUser;
  text: string;
  imageUrl?: string;
  comments?: IComment[];
  likes?: string[];
}

export interface IPost extends Document, IPostBase {
  createdAt: Date;
  updatedAt: Date;
}
// define the document methods
interface IPostMethods {
  likePost(userId: string): Promise<void>;
  unlikePost(userId: string): Promise<void>;
  commentOnPost(comment: IComment): Promise<void>;
  getAllComments(): Promise<IComment[]>;
  removePost(): Promise<void>;
}

interface IPostStatics {
  getAllPosts(): Promise<IPostDocument[]>;
}

export interface IPostDocument extends IPost, IPostMethods {}
interface IPostModel extends Model<IPostDocument>, IPostStatics {}

const PostSchema = new Schema<IPostDocument>(
  {
    user: {
      userId: { type: String, required: true },
      userImage: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String },
    },
    text: { type: String, required: true },
    imageUrl: { type: String },
    comments: { type: [Schema.Types.ObjectId], ref: 'Comment', default: [] },
    likes: { type: [String] },
  },
  { timestamps: true }
);

PostSchema.methods.likePost = async function (userId: string) {
  try {
    await this.updateOne({ $addToSet: { likes: userId } });
  } catch (error) {
    console.error('Error liking the post', error);
  }
};

PostSchema.methods.unlikePost = async function (userId: string) {
  try {
    await this.updateOne({ $pull: { likes: userId } });
  } catch (error) {
    console.error('Error unliking the post', error);
  }
};

PostSchema.methods.removePost = async function () {
  try {
    await this.model('Post').deleteOne({ _id: this._id });
  } catch (error) {
    console.error('Error removing the post', error);
  }
};

PostSchema.methods.commentOnPost = async function (commentToAdd: ICommentBase) {
  try {
    const comment = await Comment.create(commentToAdd);
    this.comment.push(comment._id);
    await this.save();
  } catch (error) {
    console.error('Error commenting on the post', error);
  }
};
