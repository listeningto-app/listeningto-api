import type mongoose from "mongoose";

interface IMusic {
  readonly _id?: mongoose.Types.ObjectId;
  authors?: (mongoose.Types.ObjectId | string)[];
  name?: string;
  file?: string;
  cover?: string;
  genre?: string;
  monthlyListeners?: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export default IMusic;
