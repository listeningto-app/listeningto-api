import type mongoose from "mongoose";
import IUser from './user.interface';
import { IMusic } from './music.interface';

export interface IAlbum {
  readonly _id?: mongoose.Types.ObjectId;
  author?: mongoose.Types.ObjectId | IUser;
  name?: string;
  musics?: (mongoose.Types.ObjectId | string | IMusic)[];
  cover?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface IPopulatedAlbum {
  readonly _id: mongoose.Types.ObjectId;
  author: IUser;
  name: string;
  musics: [{
    readonly _id: mongoose.Types.ObjectId;
    authors: IUser[];
    name: string;
    file: string;
    cover: string;
    timesPlayed: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  }];
  cover: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
