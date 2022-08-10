import mongoose from "mongoose";
import { IMusic } from "../interfaces/music.interface";

const MusicSchema = new mongoose.Schema<IMusic>({
  authors: [{
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "An author is required"],
    ref: "UserModel",
  }],
  name: {
    type: String,
    required: [true, "A name for the music is required"],
  },
  file: String,
  cover: String,
  timesPlayed: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model("MusicModel", MusicSchema);
