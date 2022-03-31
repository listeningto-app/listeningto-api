import type mongoose from 'mongoose';

interface IUser {
  readonly _id?: mongoose.Types.ObjectId,
  username?: string,
  email?: string,
  password?: string,
  profilePic?: string,
  verifiedArtist?: boolean,
  readonly createdAt?: Date,
  readonly updatedAt?: Date
}

export default IUser;