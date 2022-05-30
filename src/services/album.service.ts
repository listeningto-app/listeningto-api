import mongoose from "mongoose";
import IAlbum from "../interfaces/album.interface";
import albumModel from "../models/album.model";
import * as dbs from "./database.service";

// Operação CREATE
async function _create(AlbumData: IAlbum): Promise<IAlbum> {
  const newAlbum = new albumModel(AlbumData);
  await dbs.validate(newAlbum);
  await newAlbum.save();

  await dbs.redisSET(newAlbum.id, JSON.stringify(newAlbum));

  return newAlbum.toObject();
}

// Operação READ
async function _read(id: string): Promise<IAlbum> {
  let albumDoc: string | (mongoose.Document & IAlbum) | null;

  // Busca no Redis
  albumDoc = await dbs.redisGET(id);
  if (albumDoc) return JSON.parse(albumDoc);

  albumDoc = await dbs.getDocumentById("AlbumModel", id);
  return albumDoc.toObject();
}

// Operação UPDATE
async function _update(id: string, newData: IAlbum): Promise<IAlbum> {
  let albumDoc: mongoose.Document & IAlbum = await dbs.getDocumentById(
    "AlbumModel",
    id
  );

  if (newData.name) albumDoc.name = newData.name;
  if (newData.musics) albumDoc.musics = newData.musics;
  if (newData.cover) albumDoc.cover = newData.cover;

  // Verificação e atualização no database
  await dbs.validate(albumDoc);
  await albumDoc.save();

  // Atualização no Redis
  await dbs.redisSET(id, JSON.stringify(albumDoc));

  return albumDoc.toObject();
}

// Operação DELETE
async function _delete(id: string): Promise<void> {
  let albumDoc = await dbs.getDocumentById("AlbumModel", id);
  await albumDoc.delete();
  await dbs.redisDEL(id);

  return;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete,
};
