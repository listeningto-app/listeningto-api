import mongoose from "mongoose";
import IPlaylist from "../interfaces/playlist.interface";
import PlaylistModel from "../models/playlist.model";
import { NotFoundError } from "./errorHandling.service";

// Operação CREATE
async function _create(PlaylistData: IPlaylist): Promise<mongoose.Document<IPlaylist>> {
  const newPlaylist = new PlaylistModel(PlaylistData);
  await newPlaylist.validate();
  await newPlaylist.save();

  return newPlaylist;
}

// Operação READ
async function _read(id: string): Promise<mongoose.Document<IPlaylist>> {
  const playlistDoc = await PlaylistModel.findById(id);
  if (!playlistDoc) throw new NotFoundError("Playlist not found");

  return playlistDoc;
}

// Operação UPDATE
async function _update(id: string, newData: IPlaylist): Promise<mongoose.Document<IPlaylist>> {
  const playlistDoc = await PlaylistModel.findById(id);
  if (!playlistDoc) throw new NotFoundError("Playlist not found");

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
  if (!playlistDoc) throw new NotFoundError("Playlist not found");
  
  await playlistDoc.delete();

  return;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete,
};
