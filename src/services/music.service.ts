import mongoose from "mongoose";
import musicModel from "../models/music.model";
import albumModel from "../models/album.model";
import IMusic from "../interfaces/music.interface";
import * as dbs from "./database.service";
import IAlbum from "../interfaces/album.interface";

// Operação CREATE
async function _create(MusicData: IMusic): Promise<IMusic> {
  const newMusic = new musicModel(MusicData);
  await dbs.validate(newMusic);
  await newMusic.save();

  await dbs.redisSET(newMusic.id, JSON.stringify(newMusic));

  return newMusic.toObject();
}

// Operação READ
async function _read(id: string): Promise<IMusic> {
  let musicDoc: string | (mongoose.Document & IMusic) | null;

  // Busca no Redis
  musicDoc = await dbs.redisGET(id);
  if (musicDoc) return JSON.parse(musicDoc);

  musicDoc = await dbs.getDocumentById("MusicModel", id);
  return musicDoc.toObject();
}

// Operação UPDATE
async function _update(id: string, newData: IMusic): Promise<IMusic> {
  let musicDoc: mongoose.Document & IMusic = await dbs.getDocumentById(
    "MusicModel",
    id
  );

  if (newData.name) musicDoc.name = newData.name;
  if (newData.cover) musicDoc.cover = newData.cover;
  if (newData.authors) musicDoc.authors = newData.authors;
  if (newData.genre) musicDoc.genre = newData.genre;

  // Verificação e atualização no database
  await dbs.validate(musicDoc);
  await musicDoc.save();

  // Atualização no Redis
  await dbs.redisSET(id, JSON.stringify(musicDoc));

  return musicDoc.toObject();
}

// Operação DELETE
async function _delete(id: string): Promise<void> {
  let musicDoc = await dbs.getDocumentById("MusicModel", id);
  await musicDoc.delete();
  await dbs.redisDEL(id);

  return;
}

async function _getAlbum(id: string): Promise<IAlbum> {
  const albumDoc = await albumModel.find({ musics: id }).lean();
  return albumDoc as IAlbum;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete,
  getAlbum: _getAlbum
};
