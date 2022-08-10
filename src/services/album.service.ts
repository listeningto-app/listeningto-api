import mongoose from "mongoose";
import { IAlbum, IPopulatedAlbum } from "../interfaces/album.interface";
import AlbumModel from "../models/album.model";
import { NotFoundError } from "./errorHandling.service";

// Populate album
async function _populate(albumDoc: mongoose.Document<unknown, any, IAlbum> & IAlbum): Promise<IPopulatedAlbum> {
  // Yeah, I need to find the document twice
  // Idk how to implement the nested populate without doing this
  const populatedDoc: IPopulatedAlbum = (await AlbumModel.findOne({ _id: albumDoc._id }).populate({ path: "musics", populate: { path: "authors" } }).populate({ path: "author" }).exec())!.toObject();
    delete populatedDoc.author.email;

    populatedDoc.musics.forEach((music, index) => {
      populatedDoc.musics[index].authors.forEach((author, index2) => {
        delete populatedDoc.musics[index].authors[index2].email;
      });
    });

  return populatedDoc;
}

// Operação CREATE
async function _create(AlbumData: IAlbum): Promise<mongoose.Document<IAlbum>> {
  const newAlbum = new AlbumModel(AlbumData);
  await newAlbum.validate();
  await newAlbum.save();

  return newAlbum;
}

// Operação READ
async function _read(id: string): Promise<mongoose.Document<IAlbum>> {
  const albumDoc = await AlbumModel.findById(id);
  if (!albumDoc) throw new NotFoundError("Album not found");

  return albumDoc;
}

// Operação UPDATE
async function _update(id: string, newData: IAlbum): Promise<mongoose.Document<IAlbum>> {
  const albumDoc = await AlbumModel.findById(id);
  if (!albumDoc) throw new NotFoundError("Album not found");

  if (newData.name) albumDoc.name = newData.name;
  if (newData.musics) albumDoc.musics = newData.musics;
  if (newData.cover) albumDoc.cover = newData.cover;

  // Verificação e atualização no database
  await albumDoc.validate();
  await albumDoc.save();

  return albumDoc;
}

// Operação DELETE
async function _delete(id: string): Promise<void> {
  const albumDoc = await AlbumModel.findById(id);
  if (!albumDoc) throw new NotFoundError("Album not found");

  await albumDoc.delete();

  return;
}

export = {
  populate: _populate,
  create: _create,
  read: _read,
  update: _update,
  delete: _delete,
};
