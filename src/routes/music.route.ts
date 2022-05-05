// Imports locais
import fileHandling from '../services/fileHandling.service';
import errorHandling, { BadRequestError, UnauthorizedError, NotFoundError } from '../services/errorHandling.service';
import musicService from '../services/music.service';
import authCheck from '../services/auth.service'
import IMusic from '../interfaces/music.interface';
import userModel from '../models/user.model';
import albumModel from '../models/album.model';
import IAlbum from '../interfaces/album.interface';

// Imports de libraries
import mongoose from 'mongoose';

// Import e inicialização do Express
import express from "express";
const router = express.Router();

// Operação GET - Obter música - Path /
router.get("/:id", async (req, res) => {
  try {
    const musicDoc = await musicService.read(req.params.id);
    return res.status(200).json(musicDoc);
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação POST - Criar música - Path /
router.post("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    let { name, album, genre }: IMusic = req.body;
    const file = req.files?.file;
    const cover = req.files?.cover;

    if (!file) throw new BadRequestError("The music file is required");
    if (!album && !cover) throw new BadRequestError("If the music does not refeers to an album, a cover is required");

    const authors: (string | mongoose.Types.ObjectId)[] = [];
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
    let coverPath = album ? undefined : (cover ? await fileHandling("Image", Array.isArray(cover) ? cover.shift()! : cover) : undefined);
    const filePath = await fileHandling("Music", Array.isArray(file) ? file.shift()! : file);

    // Checagem de álbum
    if (album) {
      const albumDoc: mongoose.Document & IAlbum | null = await albumModel.findById(album);
      if (!albumDoc) throw new NotFoundError("Album not found");

      if (albumDoc.author!.toString() != id) throw new UnauthorizedError("The creator of the album and the creator of the music must be the same");

      coverPath = albumDoc.cover;
      album = albumDoc._id;
    }

    // Inserção no database
    const objForCreation: IMusic = {
      name: name,
      authors: uniqueAuthors,
      album: album,
      file: filePath,
      cover: coverPath,
      genre: genre
    }

    const musicDoc = await musicService.create(objForCreation);
    return res.status(201).json(musicDoc);
  } catch (e: any) { errorHandling(e, res) }
});

// Operação PATCH - Atualizar música - Path /
router.patch("/:id", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    const musicDoc: IMusic = await musicService.read(req.params.id);
    if (musicDoc.authors![0].toString() != id) throw new UnauthorizedError("You are not the original creator of the music");

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

      const authors = musicDoc.authors!;

      // Inserção ou remoção de autores
      for(let i in uniqueAuthors) {
        if (uniqueAuthors[i].toString() == id) throw new BadRequestError("You cannot remove yourself from the authors");

        const index = authors.findIndex((aid) => aid.toString() === uniqueAuthors[i].toString());
        if (index === -1) { authors.push(uniqueAuthors[i]) } else { authors.splice(index, 1); }
      }

      toUpdate.authors = authors;
    }

    // Atualização de cover
    if (req.files?.cover) {
      const cover = req.files?.cover
      toUpdate.cover = await fileHandling("Image", Array.isArray(cover) ? cover.shift()! : cover);
    }

    // Atualização de álbum
    if (toUpdate.album) {
      // Checagem de álbum
      const albumDoc = await albumModel.findById(toUpdate.album);
      if (!albumDoc) throw new NotFoundError("Album not found");

      if (albumDoc.author!.toString() != id) throw new UnauthorizedError("The creator of the album and the creator of the music must be the same");

      toUpdate.cover = albumDoc.cover;
      toUpdate.album = albumDoc._id;   
    }

    const updatedMusic = await musicService.update(req.params.id, toUpdate);
    return res.status(200).json(updatedMusic);
  } catch (e: any) { errorHandling(e, res) }
});

// Operação DELETE - Deletar música - Path /
router.delete("/:id", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    const musicDoc = await musicService.read(req.params.id);
    if (musicDoc.authors!.shift()!.toString() != id) throw new UnauthorizedError("You are not the original creator of the music");

    await musicService.delete(req.params.id);
    return res.status(204).end();
  } catch (e: any) { errorHandling(e, res) }
});

module.exports = router;