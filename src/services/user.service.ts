import mongoose from "mongoose";
import IAlbum from "../interfaces/album.interface";
import IMusic from "../interfaces/music.interface";
import IPlaylist from "../interfaces/playlist.interface";
import IUser from "../interfaces/user.interface";
import albumModel from "../models/album.model";
import musicModel from "../models/music.model";
import playlistModel from "../models/playlist.model";
import userModel from "../models/user.model";
import * as dbs from "./database.service";

// Operação CREATE
async function _create(UserData: IUser): Promise<IUser> {
  const newUser = new userModel(UserData);
  await dbs.validate(newUser);
  await newUser.save();

  await dbs.redisSET(newUser.id, JSON.stringify(newUser));

  return newUser.toObject();
}

// Operação READ
async function _read(id: string): Promise<IUser> {
  let userDoc: string | (mongoose.Document & IUser) | null;

  // Busca no Redis
  userDoc = await dbs.redisGET(id);
  if (userDoc) return JSON.parse(userDoc);

  userDoc = await dbs.getDocumentById("UserModel", id);
  return userDoc.toObject();
}

// Operação UPDATE
async function _update(id: string, newData: IUser): Promise<IUser> {
  let userDoc: mongoose.Document & IUser = await dbs.getDocumentById(
    "UserModel",
    id
  );

  if (newData.username) userDoc.username = newData.username;
  if (newData.email) userDoc.email = newData.email;
  if (newData.password) userDoc.password = newData.password;
  if (newData.profilePic) userDoc.profilePic = newData.profilePic;

  // Verificação e atualização no database
  await dbs.validate(userDoc);
  await userDoc.save();

  // Atualização no Redis
  await dbs.redisSET(id, JSON.stringify(userDoc));

  return userDoc.toObject();
}

// Operação DELETE
async function _delete(id: string): Promise<void> {
  let userDoc: mongoose.Document & IUser = await dbs.getDocumentById(
    "UserModel",
    id
  );

  await userDoc.delete();
  await dbs.redisDEL(id);

  return;
}

// Obter playlists do usuário
async function _playlists(id: string): Promise<IPlaylist[]> {
  let playlists: IPlaylist[] = [];

  const playlistDocs = await playlistModel.where("createdBy").equals(id);
  playlistDocs.forEach((doc) => playlists.push(doc.toObject()));

  return playlists;
}

// Obter músicas do usuário
async function _musics(id: string) {
  let musics: IMusic[] = [];

  const musicDocs = await musicModel.where("authors").equals(id);
  musicDocs.forEach((doc) => musics.push(doc.toObject()));

  return musics;
}

// Obter álbuns do usuário
async function _albuns(id: string) {
  let albuns: IAlbum[] = [];

  const albumDocs = await albumModel.where("author").equals(id);
  albumDocs.forEach((doc) => albuns.push(doc.toObject()));

  return albuns;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete,
  playlists: _playlists,
  musics: _musics,
  albuns: _albuns,
};
