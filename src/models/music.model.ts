import mongoose from "mongoose";
import { IMusic } from "../interfaces/music.interface";

const MusicSchema = new mongoose.Schema<IMusic>({
  authors: [{
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Um autor é obrigatório"],
    ref: "UserModel",
  }],
  name: {
    type: String,
    required: [true, "O nome da música é obrigatório"],
  },
  file: String,
  cover: String,
  timesPlayed: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model("MusicModel", MusicSchema);
