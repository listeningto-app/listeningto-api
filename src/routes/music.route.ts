// Imports locais
import fileHandling from '../services/fileHandling.service';
import errorHandling, { BadRequestError, UnauthorizedError, NotFoundError } from '../services/errorHandling.service';
import Music from '../services/music.service';
import musicModel from '../models/music.model';
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

// Import e criação do client do Redis
import ioredis from 'ioredis';
const redis = new ioredis(process.env.REDIS_PORT, {
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD
});

// Import e inicialização do Express
import express from "express";
const router = express.Router();

// Operação GET - Obter música - Path /
router.get("/:id", async (req, res) => {
  try {
    let doc: string | null | mongoose.LeanDocument<IMusic>; 
    const id: string | undefined = req.params.id;

    if (!id) throw new BadRequestError("An ID must be provided");

    // Busca no Redis
    doc = await redis.get(id);
    if (doc) {
      doc = JSON.parse(doc);
      return res.status(200).send(doc);
    }

    // Busca no database e inserção no Redis
    doc = await Music.read(id);
    await redis.set(id, JSON.stringify(doc), "ex", 1800);

    // Resposta
    return res.status(200).json(doc);
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação POST - Criar música - Path /
router.post("/", async (req, res) => {
  try {
    let auth: string | undefined = req.headers.authorization;

    // Verificação de auth
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

    let authors: (string | mongoose.Types.ObjectId)[] = [];
    authors.unshift(id);
    if (req.body.authors) authors.push(req.body.authors);

    const { name, album, genre }: IMusic = req.body;
    const file = req.files?.file;
    const cover = req.files?.cover;

    if (!file) throw new BadRequestError("The music file is required");
    if (!album && !cover) throw new BadRequestError("If the music does not refeers to an album, a cover is required");

    // Checagem de autores
    authors.forEach(async (aid, index) => {
      let doc = await userModel.findById(aid);
      if (!doc) throw new NotFoundError("Author not found");
      
      authors[index] = new mongoose.Types.ObjectId(aid);
    });

    // Inserção de cover e arquivo da música
    const coverPath = cover ? await fileHandling("Image", Array.isArray(cover) ? cover.shift()! : cover) : undefined;
    const filePath = await fileHandling("Music", Array.isArray(file) ? file.shift()! : file);

    // Inserção no database
    const objForCreation: IMusic = {
      name: name,
      authors: authors,
      album: album,
      file: filePath,
      cover: coverPath,
      genre: genre
    }

    const music = await Music.create(objForCreation);

    // Inserção no Redis
    await redis.set(music._id!.toString(), JSON.stringify(music), "ex", 1800);

    // Resposta
    return res.status(201).json(music);
  } catch (e: any) { errorHandling(e, res) }
});

// Operação PATCH - Atualizar música - Path /
router.patch("/:id", async (req, res) => {
  try {
    let auth = req.headers.authorization;
    // Verificação de auth
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

    const music = await Music.read(req.params.id);
    if (music.authors!.shift() != new mongoose.Types.ObjectId(id)) throw new UnauthorizedError("You are not the original creator of the music");

    const toUpdate: IMusic = {
      name: req.body.name,
      authors: req.body.authors,
      genre: req.body.genre,
      album: req.body.album
    }

    if (toUpdate.authors) {
      toUpdate.authors.forEach((author, index) => {
        if ()
      });
    }

    if (toUpdate.album) {

    }

    const newMusic = await Music.update(req.params.id, toUpdate);
  } catch (e: any) { errorHandling(e, res) }
});

// Operação DELETE - Deletar música - Path /
router.delete("/:id", async (req, res) => {
  try {

  } catch (e: any) { errorHandling(e, res) }
});

module.exports = router;