import mongoose from "mongoose";
import { IAlbum, IPopulatedAlbum } from "../interfaces/album.interface";
import { IMusic, IPopulatedMusic } from "../interfaces/music.interface";
import { IPlaylist } from "../interfaces/playlist.interface";
import IUser from "../interfaces/user.interface";
import AlbumModel from "../models/album.model";
import MusicModel from "../models/music.model";
import PlaylistModel from "../models/playlist.model";
import UserModel from "../models/user.model";
import { BadRequestError, NotFoundError } from "./errorHandling.service";

// Operação CREATE
async function _create(UserData: IUser): Promise<mongoose.Document<unknown, any, IUser> & IUser> {
  const newUser = new UserModel(UserData);
  await newUser.validate().catch((e: any) => {
    throw new BadRequestError(e.message);
  });
  await newUser.save();

  return newUser;
}

// Operação READ
async function _read(id: string): Promise<mongoose.Document<unknown, any, IUser> & IUser> {
  const userDoc = await UserModel.findById(id);
  if (!userDoc) throw new NotFoundError("Usuário não encontrado");

  return userDoc;
}

// Operação UPDATE
async function _update(id: string, newData: IUser): Promise<mongoose.Document<unknown, any, IUser> & IUser> {
  const userDoc = await UserModel.findById(id);
  if (!userDoc) throw new NotFoundError("Usuário não encontrado");

  if (newData.username) userDoc.username = newData.username;
  if (newData.email) userDoc.email = newData.email;
  if (newData.password) userDoc.password = newData.password;
  if (newData.profilePic) userDoc.profilePic = newData.profilePic;

  // Verificação e atualização no database
  await userDoc.validate().catch((e: any) => {
    throw new BadRequestError(e.message);
  });;
  await userDoc.save();

  return userDoc;
}

// Operação DELETE
async function _delete(id: string): Promise<void> {
  const userDoc = await UserModel.findById(id);
  if (!userDoc) throw new NotFoundError("Usuário não encontrado");

  await userDoc.delete();
  return;
}

// Obter playlists do usuário
async function _playlists(id: string): Promise<IPlaylist[]> {
  let playlists: IPlaylist[] = [];

  const playlistDocs = await PlaylistModel.where("createdBy").equals(id);
  playlistDocs.forEach((doc) => playlists.push(doc.toObject()));

  return playlists;
}

// Obter músicas do usuário
async function _musics(id: string): Promise<IMusic[]> {
  const musics: IMusic[] = [];

  const musicDocs: IPopulatedMusic[] = await MusicModel.where("authors").equals(id).populate<{ authors: IUser[] }>("authors").lean();
  musicDocs.forEach((doc) => {
    doc.authors.forEach((author, index) => {
      delete doc.authors[index].email;
    });

    musics.push(doc);
  });

  return musics;
}

// Obter álbuns do usuário
async function _albums(id: string): Promise<IAlbum[]> {
  const albums: IAlbum[] = [];

  const albumDocs = await AlbumModel.find({ author: id }).populate({ path: "musics", populate: { path: "authors" } }).populate({ path: "author" }).exec();
  albumDocs.forEach((doc) => {
    const jsonDoc: IPopulatedAlbum = doc.toObject();
    delete jsonDoc.author.email;

    jsonDoc.musics.forEach((music, index) => {
      jsonDoc.musics![index].authors!.forEach((author, index2) => {
        delete jsonDoc.musics![index].authors![index2].email;
      });
    });

    albums.push(jsonDoc);
  });

  return albums;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete,
  playlists: _playlists,
  musics: _musics,
  albuns: _albums,
};
