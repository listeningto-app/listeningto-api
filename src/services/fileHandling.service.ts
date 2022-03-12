import { BadRequestError } from './errorHandling.service';

import fs from 'fs';
import { join } from 'path';
import userModel from '../models/user.model';

import type fileupload from 'express-fileupload';

async function fileHandling(FileType: string, file: fileupload.UploadedFile) {
  let relativePath: string = "";

  switch (FileType) {
    case "Image": {
      const acceptedFileFormats = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
      if (!acceptedFileFormats.find(e => e == file.mimetype)) throw new BadRequestError("The file must have one of the following formats: image/jpeg, image/png, image/svg+xml, image/webp");

      // Buscar por arquivo com mesma hash e extensão
      const filename = `${file.md5}.${file.name.split(".").pop()}`;
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
  }

  const fileExtension = file.name.split(".").pop();
  const filename = `${file.md5}.${fileExtension}`;
  file.mv(join(__dirname, '../../', 'public', relativePath, filename), (err) => {
    if (err) throw err;
  });

  return `${relativePath}/${filename}`;
}

export default fileHandling;