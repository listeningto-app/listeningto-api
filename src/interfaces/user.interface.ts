import type mongoose from "mongoose";

interface IUser {
  _id?: mongoose.Types.ObjectId;
  username?: string;
  email?: string;
  password?: string;
  profilePic?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default IUser;
