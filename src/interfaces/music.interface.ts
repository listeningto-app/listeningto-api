import type mongoose from 'mongoose';

interface IMusic {
  _id?: mongoose.Types.ObjectId,
  author?: mongoose.Types.ObjectId,
  name?: string,
  album?: mongoose.Types.ObjectId,
  file?: string,
  cover?: string,
  genre?: string,
  monthlyListeners?: number
}

export default IMusic;