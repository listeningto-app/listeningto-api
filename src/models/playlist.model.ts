import mongoose from "mongoose";
import IPlaylist from "../interfaces/playlist.interface";

const PlaylistSchema = new mongoose.Schema<IPlaylist>({
  createdBy: {
    type: mongoose.Types.ObjectId,
    ref: "UserModel",
    immutable: true,
  },
  name: String,
  musics: [{
    type: mongoose.Types.ObjectId,
    ref: "MusicModel",
  }],
  cover: String,
  private: Boolean,
}, { timestamps: true });

export default mongoose.model("PlaylistModel", PlaylistSchema);
