import mongoose from "mongoose";
import { IPlaylist, IPopulatedPlaylist } from "../interfaces/playlist.interface";
import PlaylistModel from "../models/playlist.model";
import { NotFoundError } from "./errorHandling.service";

// Popular álbum
async function _populate(playlistDoc: mongoose.Document<unknown, any, IPlaylist> & IPlaylist): Promise<IPopulatedPlaylist> {
  const populatedDoc: IPopulatedPlaylist = (await PlaylistModel.findOne({ _id: playlistDoc._id }).populate({ path: "musics", populate: { path: "authors" } }).populate({ path: "author" }).exec())!.toObject();
  delete populatedDoc.createdBy.email;

  if (!populatedDoc.musics) return populatedDoc;

  populatedDoc.musics.forEach((music, index) => {
    populatedDoc.musics![index].authors.forEach((author, index2) => {
      delete populatedDoc.musics![index].authors[index2].email;
    });
  });

  return populatedDoc;
}

// Operação CREATE
async function _create(PlaylistData: IPlaylist): Promise<mongoose.Document<unknown, any, IPlaylist> & IPlaylist> {
  const newPlaylist = new PlaylistModel(PlaylistData);
  await newPlaylist.validate();
  await newPlaylist.save();

  return newPlaylist;
}

// Operação READ
async function _read(id: string): Promise<mongoose.Document<unknown, any, IPlaylist> & IPlaylist> {
  const playlistDoc = await PlaylistModel.findById(id);
  if (!playlistDoc) throw new NotFoundError("Playlist não encontrada");

  return playlistDoc;
}

// Operação UPDATE
async function _update(id: string, newData: IPlaylist): Promise<mongoose.Document<unknown, any, IPlaylist> & IPlaylist> {
  const playlistDoc = await PlaylistModel.findById(id);
  if (!playlistDoc) throw new NotFoundError("Playlist não encontrada");

  if (newData.name) playlistDoc.name = newData.name;
  if (newData.musics) playlistDoc.musics = newData.musics;
  if (newData.cover) playlistDoc.cover = newData.cover;
  if (typeof newData.private == "boolean") playlistDoc.private = newData.private;

  // Verificação e atualização no database
  await playlistDoc.validate();
  await playlistDoc.save();

  return playlistDoc;
}

// Operação DELETE
async function _delete(id: string): Promise<void> {
  const playlistDoc = await PlaylistModel.findById(id);
  if (!playlistDoc) throw new NotFoundError("Playlist não encontrada");
  
  await playlistDoc.delete();

  return;
}

export = {
  populate: _populate,
  create: _create,
  read: _read,
  update: _update,
  delete: _delete,
};
