// Imports locais
import fileHandling from '../services/fileHandling.service';
import errorHandling, { BadRequestError, UnauthorizedError, NotFoundError } from '../services/errorHandling.service';
import authCheck from '../services/auth.service';

import IPlaylist from "../interfaces/playlist.interface";

import playlistModel from '../models/playlist.model';
import musicModel from '../models/music.model';

import playlistService from '../services/playlist.service';

// Imports de libraries
import mongoose from 'mongoose';

// Import e inicialização do Express
import express from "express";
const router = express.Router();

// Operação GET - Obter playlist - Path /
router.get("/:id", async (req, res) => {
  try {
    let playlistDoc = await playlistService.read(req.params.id);
    if (playlistDoc.private) throw new UnauthorizedError("The requested playlist is private");
  
    return res.status(200).json(playlistDoc);
  } catch(e: any) { return errorHandling(e, res) }
});

// Operação POST - Criar playlist - Path /
router.post("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    let { name }: IPlaylist = req.body;
    if (!name) throw new BadRequestError("A name for the playlist is required.");

    let objForCreation: IPlaylist = {
      createdBy: new mongoose.Types.ObjectId(id),
      name: name,
      musics: null,
      private: false
    }

    const playlistDoc = await playlistService.create(objForCreation);
    return res.status(201).json(playlistDoc);
  } catch(e: any) { return errorHandling(e, res) }
});

// Operação PATCH - Atualizar playlist - Path /
router.patch("/:id", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    const playlistDoc: IPlaylist = await playlistService.read(req.params.id);
    if (playlistDoc.createdBy!.toString() != id) throw new UnauthorizedError("You are not the creator of the playlist");

    let toUpdate: IPlaylist = {
      name: req.body.name,
      musics: req.body.musics,
      private: req.body.private
    }
    let cover = req.files?.cover;

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
        if (!doc) throw new NotFoundError("Music not found");
  
        uniqueMusics[i] = new mongoose.Types.ObjectId(uniqueMusics[i]);
      }

      // Inserção ou remoção de músicas
      let musics = playlistDoc.musics!;

      for(let i in uniqueMusics) {
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

    const updatedPlaylist = await playlistService.update(req.params.id, toUpdate);
    return res.status(200).json(updatedPlaylist);
  } catch(e: any) { return errorHandling(e, res) }
});

// Operação DELETE - Deletar playlist - Path /
router.delete("/:id", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    const playlistDoc = await playlistModel.findById(req.params.id);
    if (!playlistDoc) throw new NotFoundError("Playlist not found");
    if (playlistDoc.createdBy!.toString() != id) throw new UnauthorizedError("You are not the creator of the playlist");

    await playlistService.delete(req.params.id);
    return res.status(204).end();
  } catch (e: any) { return errorHandling(e, res) }
});

module.exports = router;