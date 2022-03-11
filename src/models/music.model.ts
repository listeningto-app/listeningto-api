import mongoose from "mongoose";

import IMusic from "../interfaces/music.interface";

const musicSchema = new mongoose.Schema<IMusic>({
  author: {
    type: String,
    required: [true, "An author is required"],
    ref: 'UserModel'
  },
  name: {
    type: String,
    required: [true, "A name for the music is required"],
  },
  album: {
    type: String,
    ref: 'AlbumModel'
  },
  file: String,
  cover: String,
  genre: {
    type: String
  },
  monthlyListeners: Number
});

export default mongoose.model("MusicModel", musicSchema);