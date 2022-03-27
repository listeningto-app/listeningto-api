import mongoose from 'mongoose';
import IUser from '../interfaces/user.interface';
import userModel from '../models/user.model';
import { NotFoundError, BadRequestError } from './errorHandling.service';

// Import e criação do client do Redis
import ioredis from 'ioredis';
const redis = new ioredis(process.env.REDIS_PORT, {
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD
});

// Função para uso interno nas operações READ e DELETE
async function _getUserById(id: mongoose.Types.ObjectId | string) {
  let userDoc;

  // Busca no Redis
  userDoc = await redis.get(id.toString());
  if (userDoc) {
    let doc: mongoose.Document<unknown, any, IUser> & IUser = JSON.parse(userDoc);
    return doc;
  }

  // Busca no database
  userDoc = await userModel.findById(id);
  if (!userDoc) throw new NotFoundError("User not found");

  // Inserção no Redis
  await redis.set(userDoc.id, JSON.stringify(userDoc), "ex", 1800);
  return userDoc;
}

// Função para uso interno nas operações CREATE e UPDATE
async function _validate(doc: mongoose.Document<IUser>) {
  const errors = doc.validateSync();
  if (!errors) return;

  throw new BadRequestError(errors.errors[Object.keys(errors.errors)[0]].message);
}

// Operação CREATE
async function _create(UserData: IUser) {
  if (typeof UserData.username !== 'string') throw new BadRequestError("Username must be of type string");
  if (typeof UserData.email !== 'string') throw new BadRequestError("Email must be of type string");
  if (typeof UserData.password !== 'string') throw new BadRequestError("Password must be of type string");

  const newUser = new userModel(UserData);
  await _validate(newUser);
  await newUser.save();

  await redis.set(newUser.id, JSON.stringify(newUser), "ex", 1800);

  return newUser.toObject();
}

// Operação READ
async function _read(id: mongoose.Types.ObjectId | string) {
  let doc = await _getUserById(id);
  return doc.toObject();
}

// Operação UPDATE
async function _update(id: mongoose.Types.ObjectId | string, newData: IUser) {
  if (newData.username && typeof newData.username !== 'string') throw new BadRequestError("Username must be of type string");
  if (newData.email && typeof newData.email !== 'string') throw new BadRequestError("Email must be of type string");
  if (newData.password && typeof newData.password !== 'string') throw new BadRequestError("Password must be of type string");

  let user = await _getUserById(id);

  if (newData.username) user.username = newData.username;
  if (newData.email) user.email = newData.email;
  if (newData.password) user.password = newData.password;
  if (newData.profilePic) user.profilePic = newData.profilePic;
  
  // Verificação e atualização no database
  await _validate(user);
  await user.save();

  // Atualização no Redis
  await redis.set(user.id, JSON.stringify(user), "ex", 1800);

  return user.toObject();
}

// Operação DELETE
async function _delete(id: mongoose.Types.ObjectId | string) {
  let user = await _getUserById(id);
  await user.delete();
  await redis.del(id.toString());

  return;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete
}