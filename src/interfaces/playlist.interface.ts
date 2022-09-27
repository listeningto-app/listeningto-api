import type mongoose from "mongoose";
import { IMusic } from "./music.interface";
import IUser from "./user.interface";

export interface IPlaylist {
  readonly _id?: mongoose.Types.ObjectId;
  createdBy?: string | mongoose.Types.ObjectId | IUser;
  name?: string;
  musics?: (string | mongoose.Types.ObjectId | IMusic)[] | null;
  cover?: string;
  tags?: string[];
  private?: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface IPatchPlaylist extends IPlaylist {
  order?: number[];
}

export interface IPopulatedPlaylist {
  readonly _id: mongoose.Types.ObjectId;
  createdBy: IUser;
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
  }] | null;
  cover: string;
  tags?: string[];
  private: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}