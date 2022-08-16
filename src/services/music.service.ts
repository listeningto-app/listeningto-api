import mongoose from "mongoose";
import MusicModel from "../models/music.model";
import AlbumModel from "../models/album.model";
import { IMusic, IPopulatedMusic } from "../interfaces/music.interface";
import { NotFoundError } from "./errorHandling.service";
import { IAlbum } from "../interfaces/album.interface";
import IUser from "../interfaces/user.interface";

// Populate music
async function _populate(musicDoc: mongoose.Document<unknown, any, IMusic> & IMusic): Promise<IPopulatedMusic> {
  const populatedDoc: IPopulatedMusic = await (await musicDoc.populate<{ authors: IUser[] }>("authors")).toObject();
  populatedDoc.authors.forEach((author, index) => {
    delete populatedDoc.authors[index].email;
  });

  return populatedDoc;
}

// Operação CREATE
async function _create(MusicData: IMusic): Promise<mongoose.Document<unknown, any, IMusic> & IMusic> {
  const newMusic = new MusicModel(MusicData);
  await newMusic.validate();
  await newMusic.save();

  return newMusic;
}

// Operação READ
async function _read(id: string): Promise<mongoose.Document<unknown, any, IMusic> & IMusic> {
  const musicDoc = await MusicModel.findById(id);
  if (!musicDoc) throw new NotFoundError("Music not found");

  return musicDoc;
}

// Operação UPDATE
async function _update(id: string, newData: IMusic): Promise<mongoose.Document<unknown, any, IMusic> & IMusic> {
  const musicDoc = await MusicModel.findById(id);
  if (!musicDoc) throw new NotFoundError("Music not found");

  if (newData.name) musicDoc.name = newData.name;
  if (newData.cover) musicDoc.cover = newData.cover;
  if (newData.authors) musicDoc.authors = newData.authors;

  // Verificação e atualização no database
  await musicDoc.validate();
  await musicDoc.save();

  return musicDoc;
}

// Operação DELETE
async function _delete(id: string): Promise<void> {
  const musicDoc = await MusicModel.findById(id);
  if (!musicDoc) throw new NotFoundError("Music not found");

  // Deletar referência do álbum à música
  await AlbumModel.updateOne({ musics: id }, { $pullAll: { musics: [id] } });

  await musicDoc.delete();
  return;
}

async function _getAlbum(id: string): Promise<mongoose.Document<unknown, any, IAlbum> & IAlbum | null> {
  const albumDoc = await AlbumModel.findOne({ musics: id });
  return albumDoc;
}

export = {
  populate: _populate,
  create: _create,
  read: _read,
  update: _update,
  delete: _delete,
  getAlbum: _getAlbum
};
