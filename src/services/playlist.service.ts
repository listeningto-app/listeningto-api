import mongoose from "mongoose";
import IPlaylist from "../interfaces/playlist.interface";
import playlistModel from "../models/playlist.model";
import * as dbs from "./database.service";

// Operação CREATE
async function _create(PlaylistData: IPlaylist): Promise<IPlaylist> {
  const newPlaylist = new playlistModel(PlaylistData);
  await dbs.validate(newPlaylist);
  await newPlaylist.save();

  await dbs.redisSET(newPlaylist.id, JSON.stringify(newPlaylist));

  return newPlaylist.toObject();
}

// Operação READ
async function _read(id: string): Promise<IPlaylist> {
  let playlistDoc: string | (mongoose.Document & IPlaylist) | null;

  // Busca no Redis
  playlistDoc = await dbs.redisGET(id);
  if (playlistDoc) return JSON.parse(playlistDoc);

  playlistDoc = await dbs.getDocumentById("PlaylistModel", id);
  return playlistDoc.toObject();
}

// Operação UPDATE
async function _update(id: string, newData: IPlaylist): Promise<IPlaylist> {
  let playlistDoc: mongoose.Document & IPlaylist = await dbs.getDocumentById(
    "PlaylistModel",
    id
  );

  if (newData.name) playlistDoc.name = newData.name;
  if (newData.musics) playlistDoc.musics = newData.musics;
  if (newData.cover) playlistDoc.cover = newData.cover;
  if (typeof newData.private == "boolean")
    playlistDoc.private = newData.private;

  // Verificação e atualização no database
  await dbs.validate(playlistDoc);
  await playlistDoc.save();

  // Atualização no Redis
  await dbs.redisSET(id, JSON.stringify(playlistDoc));

  return playlistDoc.toObject();
}

// Operação DELETE
async function _delete(id: string): Promise<void> {
  let playlistDoc: mongoose.Document & IPlaylist = await dbs.getDocumentById(
    "PlaylistModel",
    id
  );

  await playlistDoc.delete();
  await dbs.redisDEL(id);

  return;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete,
};
