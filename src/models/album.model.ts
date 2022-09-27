import mongoose from "mongoose";
import { IAlbum } from "../interfaces/album.interface";

const AlbumSchema = new mongoose.Schema<IAlbum>({
  author: {
    type: mongoose.Types.ObjectId,
    required: [true, "O autor do álbum é obrigatório"],
    ref: "UserModel",
    immutable: true
  },
  name: {
    type: String,
    required: [true, "O nome do álbum é obrigatório"],
  },
  musics: [{
    type: mongoose.Types.ObjectId,
    required: [true, "Um álbum deve ter, no mínimo, uma (1) música relacionada a ele"],
    ref: "MusicModel",
  }],
  cover: {
    type: String,
    default: "/images/1/2bc42b242b5d423f77a700a4e2bb12df.png"
  },
  tags: {
    type: [String]
  }
}, { timestamps: true });

export default mongoose.model("AlbumModel", AlbumSchema);
