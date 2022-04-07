import mongoose from 'mongoose';
import IUser from '../interfaces/user.interface';
import userModel from '../models/user.model';
import * as dbs from './database.service';

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
  let userDoc: string | mongoose.Document & IUser | null;

  // Busca no Redis
  userDoc = await dbs.redisGET(id);
  if (userDoc) return JSON.parse(userDoc);

  userDoc = await dbs.getDocumentById("UserModel", id);
  return userDoc.toObject();
}

// Operação UPDATE
async function _update(id: string, newData: IUser): Promise<IUser> {
  let userDoc: mongoose.Document & IUser = await dbs.getDocumentById("UserModel", id);

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
  let userDoc: mongoose.Document & IUser = await dbs.getDocumentById("UserModel", id);

  await userDoc.delete();
  await dbs.redisDEL(id);

  return;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete
}