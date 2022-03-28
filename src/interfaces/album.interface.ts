import type mongoose from 'mongoose';

interface IAlbum {
    _id?: mongoose.Types.ObjectId,
    author?: mongoose.Types.ObjectId,
    name?: string,
    musics?: (mongoose.Types.ObjectId | string)[],
    createdAt?: Date,
    cover?: string 
}

export default IAlbum;