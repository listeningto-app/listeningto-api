import type mongoose from 'mongoose';

interface IUser {
  _id?: mongoose.Types.ObjectId,
  username?: string,
  email?: string,
  password?: string,
  profilePic?: string,
  readonly createdAt?: Date,
  verified?: boolean
}

export default IUser;