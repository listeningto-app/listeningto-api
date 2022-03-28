import mongoose from "mongoose";
import IAlbum from "../interfaces/album.interface";
import albumModel from "../models/album.model";
import { NotFoundError, BadRequestError } from "./errorHandling.service";

// Import e criação do client do Redis
import ioredis from 'ioredis';
const redis = new ioredis(process.env.REDIS_PORT, {
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD
});

// Função para uso interno nas operações READ e DELETE
async function _getAlbumById(id: mongoose.Types.ObjectId | string) {
  let albumDoc;
  
  // Busca no Redis
  albumDoc = await redis.get(id.toString());
  if (albumDoc) {
    let doc: mongoose.Document<unknown, any, IAlbum> & IAlbum = JSON.parse(albumDoc);
    return doc;
  }
  
  // Busca no database
  albumDoc = await albumModel.findById(id);
  if (!albumDoc) throw new NotFoundError("User not found");
  
  // Inserção no Redis
  await redis.set(albumDoc.id, JSON.stringify(albumDoc), "ex", 1800);
  return albumDoc;
}

// Função para uso interno nas operações CREATE e UPDATE
async function _validate(doc: mongoose.Document<IAlbum>) {
  const errors = doc.validateSync();
  if (!errors) return;

  throw new BadRequestError(errors.errors[Object.keys(errors.errors)[0]].message);
}

// Operação CREATE
async function _create(AlbumData: IAlbum) {
  const newAlbum = new albumModel(AlbumData);
  await _validate(newAlbum);
  await newAlbum.save();

  await redis.set(newAlbum.id, JSON.stringify(newAlbum), "ex", 1800);

  return newAlbum.toObject();
}

// Operação READ
async function _read(id: mongoose.Types.ObjectId | string) {
  let doc = await _getAlbumById(id);
  return doc.toObject();
}

// Operação UPDATE
async function _update(newData: IAlbum, id: mongoose.Types.ObjectId | string) {
  let album = await _getAlbumById(id);

  if (newData.author) album.author = newData.author;
  if (newData.name) album.name = newData.name;
  if (newData.musics) album.musics = newData.musics;
  if (newData.cover) album.cover = newData.cover;
  
  // Verificação e atualização no database
  await _validate(album);
  await album.save();

  // Atualização no Redis
  await redis.set(album.id, JSON.stringify(album), "ex", 1800);

  return album.toObject();
}

// Operação DELETE
async function _delete(id: mongoose.Types.ObjectId | string) {
  let album = await _getAlbumById(id);
  await album.delete();
  await redis.del(id.toString());

  return;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete
}