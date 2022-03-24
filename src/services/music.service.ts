import mongoose from "mongoose";
import musicModel from "../models/music.model";
import IMusic from "../interfaces/music.interface";
import { NotFoundError, BadRequestError, UnauthorizedError } from "./errorHandling.service";

async function _getMusicById(id: mongoose.Types.ObjectId | string) {
  const doc = await musicModel.findById(id);

  if (doc) return doc;
  throw new NotFoundError("User not found");
}

async function _validate(doc: mongoose.Document<IMusic>) {
  const errors = doc.validateSync();
  if (!errors) return;

  throw new BadRequestError(errors.errors[Object.keys(errors.errors)[0]].message);
}

// Operação CREATE
async function _create(MusicData: IMusic) {
  if (typeof MusicData.name !== 'string') throw new BadRequestError("Music name must be of type string");

  const newMusic = new musicModel(MusicData);
  await _validate(newMusic);
  await newMusic.save();

  return newMusic.toObject();
}

// Operação READ
async function _read(id: mongoose.Types.ObjectId | string) {
  let doc = await _getMusicById(id);
  return doc.toObject();
}

// Operação UPDATE
async function _update(id: mongoose.Types.ObjectId | string, newData: IMusic) {
  let music = await _getMusicById(id);

  if (newData.name) music.name = newData.name;
  if (newData.cover) music.cover = newData.cover;
  if (newData.album) music.album = newData.album;
  
  await _validate(music);
  await music.save();
  return music.toObject();
}

// Operação DELETE
async function _delete(id: mongoose.Types.ObjectId | string) {
  let music = await _getMusicById(id);
  await music.delete();

  return;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete
}