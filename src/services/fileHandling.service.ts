import { BadRequestError, ConflictError } from './errorHandling.service';

import fs from 'fs';
import { join } from 'path';
import userModel from '../models/user.model';
import musicModel from '../models/music.model';
import IUser from '../interfaces/user.interface';

import type fileupload from 'express-fileupload';

async function fileHandling(FileType: string, file: fileupload.UploadedFile) {
  let relativePath: string = "";
  const filename = `${file.md5}.${file.name.split(".").pop()}`;

  switch (FileType) {
    case "Image": {
      const acceptedFileFormats = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
      if (!acceptedFileFormats.find(e => e == file.mimetype)) throw new BadRequestError("The file must have one of the following formats: image/jpeg, image/png, image/svg+xml, image/webp");

      // Buscar por arquivo com mesma hash e extensão
      const existentFile = (await userModel.find({ profilePic: { $regex: filename } })).shift();
      if (existentFile) {
        return existentFile.profilePic;
      }

      // Encontrar diretório para escrever
      const lastDir = (fs.readdirSync(join(__dirname, '../../', 'public', 'images'))).pop()!;
      const files = fs.readdirSync(join(__dirname, '../../', 'public', 'images', lastDir));

      if (files.length < 10000) {
        relativePath = `/images/${lastDir}`;
        break;
      }
      
      // Criar novo diretório
      const newDir = (parseInt(lastDir) + 1).toString();
      relativePath = `images/${newDir}`
      fs.mkdirSync(join(__dirname, '../../', 'public', relativePath));

      break;
    }
    case "Music": {
      const acceptedFileFormats = ["audio/webm", "audio/wav", "audio/ogg", "audio/mpeg"];
      if (!acceptedFileFormats.find(e => e == file.mimetype)) throw new BadRequestError("The file must have one of the following formats: audio/webm, audio/wav, audio/ogg");

      // Buscar por arquivo com mesma hash e extensão
      const existentFile = await musicModel.findOne({ file: { $regex: filename } });
      if (existentFile) {
        let doc = await existentFile.populate<{ authors: IUser[] }>('authors');
        throw new ConflictError(`This music already exists: ${doc.authors[0].username} - ${doc.name}`);
      }

      // Encontrar diretório para escrever
      const lastDir = (fs.readdirSync(join(__dirname, '../../', 'public', 'musics'))).pop()!;
      const files = fs.readdirSync(join(__dirname, '../../', 'public', 'musics', lastDir));

      if (files.length < 10000) {
        relativePath = `/musics/${lastDir}`;
        break;
      }
      
      // Criar novo diretório
      const newDir = (parseInt(lastDir) + 1).toString();
      relativePath = `/musics/${newDir}`
      fs.mkdirSync(join(__dirname, '../../', 'public', relativePath));

      break;
    }
  }

  file.mv(join(__dirname, '../../', 'public', relativePath, filename), (err) => {
    if (err) throw err;
  });

  return `${relativePath}/${filename}`;
}

export default fileHandling;