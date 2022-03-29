import mongoose from "mongoose";
import musicModel from "../models/music.model";
import IMusic from "../interfaces/music.interface";
import { NotFoundError, BadRequestError } from "./errorHandling.service";

// Import e criação do client do Redis
import ioredis from 'ioredis';
const redis = new ioredis(process.env.REDIS_PORT, {
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD
});

async function _getMusicById(id: mongoose.Types.ObjectId | string) {
  // Busca no database
  let musicDoc = await musicModel.findById(id);
  if (!musicDoc) throw new NotFoundError("User not found");

  // Inserção no Redis
  await redis.set(musicDoc.id, JSON.stringify(musicDoc.toObject()), "ex", 1800);
  return musicDoc;
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

  await redis.set(newMusic.id, JSON.stringify(newMusic.toObject()), "ex", 1800);

  return newMusic.toObject();
}

// Operação READ
async function _read(id: mongoose.Types.ObjectId | string) {
  let musicDoc: string | mongoose.Document<unknown, any, IMusic> & IMusic | null;
  // Busca no Redis
  musicDoc = await redis.get(id.toString());
  if (musicDoc) return JSON.parse(musicDoc);

  musicDoc = await _getMusicById(id);
  return musicDoc.toObject();
}

// Operação UPDATE
async function _update(id: mongoose.Types.ObjectId | string, newData: IMusic) {
  let music = await _getMusicById(id);

  if (newData.name) music.name = newData.name;
  if (newData.cover) music.cover = newData.cover;
  if (newData.album) music.album = newData.album;
  if (newData.authors) music.authors = newData.authors;
  if (newData.genre) music.genre = newData.genre;

  // Verificação e atualização no database
  await _validate(music);
  await music.save();

  // Atualização no Redis
  await redis.set(music.id, JSON.stringify(music), "ex", 1800);
  return music.toObject();
}

// Operação DELETE
async function _delete(id: mongoose.Types.ObjectId | string) {
  let music = await _getMusicById(id);
  await music.delete();
  await redis.del(id.toString());

  return;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete
}