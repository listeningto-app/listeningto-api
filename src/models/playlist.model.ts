import mongoose from "mongoose";
import { IPlaylist } from "../interfaces/playlist.interface";

const PlaylistSchema = new mongoose.Schema<IPlaylist>({
  createdBy: {
    type: mongoose.Types.ObjectId,
    ref: "UserModel",
    immutable: true,
  },
  name: {
    type: String,
    required: [true, "O nome da playlist é obrigatório"]
  },
  musics: [{
    type: mongoose.Types.ObjectId,
    ref: "MusicModel",
  }],
  cover: String,
  private: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

export default mongoose.model("PlaylistModel", PlaylistSchema);
