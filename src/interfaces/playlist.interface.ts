import type mongoose from 'mongoose'

interface IPlaylist {
  readonly _id?: mongoose.Types.ObjectId,
  createdBy?: string | mongoose.Types.ObjectId,
  name?: string,
  musics?: (string | mongoose.Types.ObjectId)[] | null,
  cover?: string,
  private?: boolean,
  readonly createdAt?: Date,
  readonly updatedAt?: Date
}

export default IPlaylist;