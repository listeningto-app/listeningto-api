import type mongoose from 'mongoose';

interface IMusic {
  _id?: mongoose.Types.ObjectId,
  authors?: (mongoose.Types.ObjectId | string)[],
  name?: string,
  album?: mongoose.Types.ObjectId | string,
  file?: string,
  cover?: string,
  genre?: string,
  monthlyListeners?: number
}

export default IMusic;