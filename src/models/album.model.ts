import mongoose from "mongoose";
import { IAlbum } from "../interfaces/album.interface";

const AlbumSchema = new mongoose.Schema<IAlbum>({
  author: {
    type: mongoose.Types.ObjectId,
    required: [true, "The album's author is required"],
    ref: "UserModel",
  },
  name: {
    type: String,
    required: [true, "The album's name is required"],
  },
  musics: [{
    type: mongoose.Types.ObjectId,
    ref: "MusicModel",
    required: [true, "An album must have at least one music related to it"],
  }],
  cover: {
    type: String,
    required: [true, "The album's cover is required"],
  },
}, { timestamps: true });

export default mongoose.model("AlbumModel", AlbumSchema);
