import type mongoose from "mongoose";

interface IUser {
  _id?: mongoose.Types.ObjectId;
  username?: string;
  email?: string;
  password?: string;
  profilePic?: string;
  verifiedArtist?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export default IUser;
