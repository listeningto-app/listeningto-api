import mongoose from 'mongoose';
import IUser from '../interfaces/user.interface';
import userModel from '../models/user.model';
import { NotFoundError, BadRequestError } from './errorHandling.service';

// Função para uso interno nas operações READ e DELETE
async function _getUserById(id: mongoose.Types.ObjectId | string) {
  const userDoc = await userModel.findById(id);

  if (userDoc) return userDoc;
  throw new NotFoundError("User not found");
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
  
  await _validate(user);
  await user.save();
  return user.toObject();
}

// Operação DELETE
async function _delete(id: mongoose.Types.ObjectId | string) {
  let user = await _getUserById(id);
  await user.delete();

  return;
}

export = {
  create: _create,
  read: _read,
  update: _update,
  delete: _delete
}