import type mongoose from "mongoose";
import { IMusic } from "./music.interface";
import IUser from "./user.interface";

interface IPlaylist {
  readonly _id?: mongoose.Types.ObjectId;
  createdBy?: string | mongoose.Types.ObjectId | IUser;
  name?: string;
  musics?: (string | mongoose.Types.ObjectId | IMusic)[] | null;
  cover?: string;
  private?: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export default IPlaylist;
