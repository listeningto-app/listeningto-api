import type mongoose from "mongoose";
import IUser from './user.interface'

export interface IMusic {
  readonly _id?: mongoose.Types.ObjectId;
  authors?: (mongoose.Types.ObjectId | string | IUser)[];
  name?: string;
  file?: string;
  cover?: string;
  duration?: number;
  views?: number;
  tags?: string[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface IPopulatedMusic {
  readonly _id: mongoose.Types.ObjectId;
  authors: IUser[];
  name: string;
  file: string;
  cover: string;
  duration: number;
  views: number;
  tags?: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
