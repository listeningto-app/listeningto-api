// Imports locais
import fileHandling from "../services/fileHandling.service";
import albumService from "../services/album.service";
import albumModel from "../models/album.model";
import jwtVerify from "../services/jwtVerify.service";
import IAlbum from "../interfaces/album.interface";
import errorHandling, { BadRequestError, NotFoundError, UnauthorizedError } from "../services/errorHandling.service";
import musicModel from "../models/music.model";

// Import de libraries
import mongoose from "mongoose";

// Import e inicialização do Express
import express from "express";
const router = express.Router();

// Operação GET - Obter álbum - Path /
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const album = await albumService.read(id);
    
    return res.status(200).json(album);
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação POST - Criar álbum - Path /
router.post("/", async (req, res) => {
  try {
    // Autorização
    let auth = req.headers.authorization;
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

    let { name, musics }: IAlbum = req.body;
    const cover = req.files?.cover;
    if (!cover) throw new BadRequestError("A cover file is required");
    if (!musics) throw new BadRequestError("An array with the musics from the album is required");

    // Remoção de duplicatas de músicas
    let uniqueMusics = musics.filter((item, pos) => {
      return musics!.indexOf(item) == pos;
    });

    // Checagem das músicas
    for(let i in uniqueMusics) {
      let doc = await musicModel.findById(uniqueMusics[i]).catch(() => { throw new BadRequestError(`Id ${uniqueMusics[i]} is not valid`) });
      if (!doc) throw new NotFoundError("Author not found");

      uniqueMusics[i] = new mongoose.Types.ObjectId(uniqueMusics[i]);
    }

    // Inserção do cover
    const coverPath = await fileHandling("Image", Array.isArray(cover) ? cover.shift()! : cover);

    // Inserção no database
    const objForCreation = {
      author: new mongoose.Types.ObjectId(id),
      name: name,
      musics: uniqueMusics,
      cover: coverPath
    }

    const doc = await albumService.create(objForCreation);

    // Resposta
    return res.status(201).json(doc);
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação PATCH - Atualizar álbum - Path /
router.patch("/:id", async (req, res) => {
  try {
    // Autorização
    let auth = req.headers.authorization;
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

    const albumDoc = await albumModel.findById(req.params.id);
    if (!albumDoc) throw new NotFoundError("Album not found");
    if (albumDoc.author!.toString() != id) throw new UnauthorizedError("You are not the creator of the album");

    let toUpdate: IAlbum = {
      name: req.body.name,
      musics: req.body.musics
    }
    const cover = req.files?.cover;

    // Atualização de músicas
    if (toUpdate.musics) {
      toUpdate.musics = Array.isArray(toUpdate.musics) ? toUpdate.musics : [toUpdate.musics];

      // Remoção de duplicatas de músicas
      let uniqueMusics = toUpdate.musics.filter((item, pos) => {
        return toUpdate.musics!.indexOf(item) == pos;
      });
  
      // Checagem das músicas
      for(let i in uniqueMusics) {
        let doc = await musicModel.findById(uniqueMusics[i]).catch(() => { throw new BadRequestError(`Id ${uniqueMusics[i]} is not valid`) });
        if (!doc) throw new NotFoundError("Author not found");
  
        uniqueMusics[i] = new mongoose.Types.ObjectId(uniqueMusics[i]);
      }

      // Inserção ou remoção de músicas
      let musics = albumDoc.musics!;

      for(let i in uniqueMusics) {
        if (uniqueMusics[i].toString() == id) throw new BadRequestError("You cannot remove yourself from the authors");

        const index = musics.findIndex((mid) => mid.toString() === uniqueMusics[i].toString());
        if (index === -1) musics.push(uniqueMusics[i])
        else musics.splice(index, 1);
      }

      toUpdate.musics = musics;
    }

    // Atualização de cover
    if (cover) {
      const coverPath = await fileHandling("Image", Array.isArray(cover) ? cover.shift()! : cover);
      toUpdate.cover = coverPath;
    }

    const updatedAlbum = await albumService.update(toUpdate, req.params.id);
    return res.status(200).json(updatedAlbum);
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação DELETE - Deletar álbum - Path /
router.delete("/:id", async (req, res) => {
  try {
    // Autorização
    let auth = req.headers.authorization;
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

    const albumDoc = await albumModel.findById(req.params.id);
    if (!albumDoc) throw new NotFoundError("Album not found");
    if (albumDoc.author!.toString() != id) throw new UnauthorizedError("You are not the creator of the album");

    await albumService.delete(req.params.id);
    return res.status(204).end();
  } catch (e: any) { return errorHandling(e, res) }
});