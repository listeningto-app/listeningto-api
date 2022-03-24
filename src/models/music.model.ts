import mongoose from "mongoose";

import IMusic from "../interfaces/music.interface";

const musicSchema = new mongoose.Schema<IMusic>({
  authors: {
    type: [mongoose.Schema.Types.ObjectId],
    required: [true, "An author is required"],
    ref: 'UserModel'
  },
  name: {
    type: String,
    required: [true, "A name for the music is required"],
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AlbumModel'
  },
  file: String,
  cover: String,
  genre: {
    type: String,
    enum: {
      values: ["Pop", "Dance", "Hip-hop", "R&B", "Latin", "Rock", "Metal", "Country", "Folk/Acoustic", "Classical", "Jazz", "Blues", "Easy Listening", "New Age", "World/Traditional Folk"],
      message: "Genre not supported"
    }
  },
  monthlyListeners: {
    type: Number,
    default: 0
  }
});

musicSchema.pre("save", async function (this: IMusic & mongoose.Document, next: Function) {
  const music = this;
  await music.populate('album');
  await music.populate('authors');

  next();
});

export default mongoose.model("MusicModel", musicSchema);