import type mongoose from "mongoose";

interface IAlbum {
  readonly _id?: mongoose.Types.ObjectId;
  author?: mongoose.Types.ObjectId;
  name?: string;
  musics?: (mongoose.Types.ObjectId | string)[];
  cover?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export default IAlbum;
