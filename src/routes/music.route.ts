// Imports locais
import fileHandling from '../services/fileHandling.service';
import errorHandling, { BadRequestError, UnauthorizedError, NotFoundError } from '../services/errorHandling.service';
import Music from '../services/music.service';
import jwtVerify from '../services/jwtVerify.service'
import IMusic from '../interfaces/music.interface';
import userModel from '../models/user.model';

// Imports de libraries
import mongoose from 'mongoose';

// Dotenv
import { join } from 'path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
expand(dotenv.config({ path: join(__dirname, "../../.env") }));

// Import e inicialização do Express
import express from "express";
const router = express.Router();

// Operação GET - Obter música - Path /
router.get("/:id", async (req, res) => {
  try {
    let doc: mongoose.LeanDocument<IMusic>; 
    const id: string | undefined = req.params.id;

    if (!id) throw new BadRequestError("An ID must be provided");

    // Busca do usuário
    doc = await Music.read(id);

    // Resposta
    return res.status(200).json(doc);
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação POST - Criar música - Path /
router.post("/", async (req, res) => {
  // TODO: Checagem de álbum

  try {
    let auth: string | undefined = req.headers.authorization;

    // Verificação de auth
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

    let { name, album, genre }: IMusic = req.body;
    const file = req.files?.file;
    const cover = req.files?.cover;

    if (!file) throw new BadRequestError("The music file is required");
    if (!album && !cover) throw new BadRequestError("If the music does not refeers to an album, a cover is required");

    let authors: (string | mongoose.Types.ObjectId)[] = [];
    authors.unshift(id);
    if (req.body.authors) authors.push(...(Array.isArray(req.body.authors) ? req.body.authors : [req.body.authors]));

    // Remoção de duplicatas de autores
    let uniqueAuthors = authors.filter((item, pos) => {
      return authors.indexOf(item) == pos;
    });

    // Checagem de autores
    for(let i in uniqueAuthors) {
      let doc = await userModel.findById(uniqueAuthors[i]).catch(() => { throw new BadRequestError(`Id ${uniqueAuthors[i]} is not valid`) });
      if (!doc) throw new NotFoundError("Author not found");

      uniqueAuthors[i] = new mongoose.Types.ObjectId(uniqueAuthors[i]);
    }

    // Inserção de cover e arquivo da música
    const coverPath = cover ? await fileHandling("Image", Array.isArray(cover) ? cover.shift()! : cover) : undefined;
    const filePath = await fileHandling("Music", Array.isArray(file) ? file.shift()! : file);

    // Inserção no database
    const objForCreation: IMusic = {
      name: name,
      authors: uniqueAuthors,
      album: album,
      file: filePath,
      cover: coverPath,
      genre: genre
    }

    const music = await Music.create(objForCreation);

    // Resposta
    return res.status(201).json(music);
  } catch (e: any) { errorHandling(e, res) }
});

// Operação PATCH - Atualizar música - Path /
router.patch("/:id", async (req, res) => {
  // TODO: Atualização de álbum

  try {
    let auth = req.headers.authorization;
    // Verificação de auth
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

    const music = await Music.read(req.params.id);
    if (music.authors![0].toString() != id) throw new UnauthorizedError("You are not the original creator of the music");

    let toUpdate: IMusic = {
      name: req.body.name,
      authors: req.body.authors,
      genre: req.body.genre,
      album: req.body.album
    }

    // Atualização de autores
    if (toUpdate.authors) {
      toUpdate.authors = Array.isArray(toUpdate.authors) ? toUpdate.authors : [toUpdate.authors];
      
      // Remoção de duplicatas de autores
      let uniqueAuthors = toUpdate.authors.filter((item, pos) => {
        return toUpdate.authors!.indexOf(item) == pos;
      });

      // Checagem de autores
      for(let i in uniqueAuthors) {
        let doc = await userModel.findById(uniqueAuthors[i]).catch(() => { throw new BadRequestError(`Id ${uniqueAuthors[i]} is not valid`) });
        if (!doc) throw new NotFoundError("Author not found");

        uniqueAuthors[i] = new mongoose.Types.ObjectId(uniqueAuthors[i]);
      }

      let authors = music.authors!;

      // Inserção ou remoção de autores
      for(let i in uniqueAuthors) {
        if (uniqueAuthors[i].toString() == id) throw new BadRequestError("You cannot remove yourself from the authors");

        const index = authors.findIndex(aid => aid.toString() === uniqueAuthors[i].toString());
        if (index === -1) authors.push(uniqueAuthors[i])
        else authors.splice(index, 1);
      }

      toUpdate.authors = authors;
    }

    // Atualização de álbum
    // if (toUpdate.album) {

    // }

    // Atualização de cover
    if (req.files?.cover) {
      const cover = req.files?.cover
      toUpdate.cover = await fileHandling("Image", Array.isArray(cover) ? cover.shift()! : cover);
    }

    const updatedMusic = await Music.update(req.params.id, toUpdate);
    return res.status(200).json(updatedMusic);
  } catch (e: any) { errorHandling(e, res) }
});

// Operação DELETE - Deletar música - Path /
router.delete("/:id", async (req, res) => {
  try {
    let auth = req.headers.authorization;
    // Verificação de auth
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

    const music = await Music.read(req.params.id);
    if (music.authors!.shift()!.toString() != id) throw new UnauthorizedError("You are not the original creator of the music");

    await Music.delete(req.params.id);
    return res.status(204).end();
  } catch (e: any) { errorHandling(e, res) }
});

module.exports = router;