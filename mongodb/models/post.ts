import mongoose, { Schema, Document, models, Model } from 'mongoose';

import { IComment, ICommentBase, Comment } from './comment';
import path from 'path';
import { IUser } from '../../src/types/User';

export interface IPostBase {
  user: IUser;
  text: string;
  imageUrl?: string;
  comments?: IComment[];
  likes?: string[];
}

export interface IPost extends IPostBase, Document {
  createdAt: Date;
  updatedAt: Date;
}
// define the document methods
interface IPostMethods {
  likePost(userId: string): Promise<void>;
  unlikePost(userId: string): Promise<void>;
  commentOnPost(comment: ICommentBase): Promise<void>;
  getAllComments(): Promise<IComment[]>;
  removePost(): Promise<void>;
}

interface IPostStatics {
  getAllPosts(): Promise<IPostDocument[]>;
}

export interface IPostDocument extends IPost, IPostMethods {}
interface IPostModel extends IPostStatics, Model<IPostDocument> {}

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
    comments: { type: [Schema.Types.ObjectId], ref: 'Comment' },
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
    this.comments.push(comment._id);
    await this.save();
  } catch (error) {
    console.error('Error commenting on the post', error);
  }
};

PostSchema.methods.getAllComments = async function () {
  try {
    await this.populate({
      path: 'comments',
      options: { sort: { createdAt: -1 } }, // sorts by newest first
    });
    return this.comments;
  } catch (error) {
    console.error('Error getting all comments', error);
  }
};

PostSchema.statics.getAllPosts = async function () {
  try {
    const posts = await this.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 } },
      })
      .lean(); // converts mongoose object to plain js object

    return posts.map((post: IPostDocument) => ({
      ...post,
      _id: post._id?.toString(),
      comments: post.comments?.map((comment: IComment) => ({
        ...comment,
        _id: comment._id?.toString(),
      })),
    }));
  } catch (error) {
    console.error('Error getting all posts', error);
  }
};

export const Post =
  (models.Post as IPostModel) ||
  mongoose.model<IPostDocument, IPostModel>('Post', PostSchema);
