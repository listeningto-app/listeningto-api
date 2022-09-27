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
  cover: {
    type: String,
    default: "/images/1/2bc42b242b5d423f77a700a4e2bb12df.png"
  },
  private: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String]
  }
}, { timestamps: true });

export default mongoose.model("PlaylistModel", PlaylistSchema);
