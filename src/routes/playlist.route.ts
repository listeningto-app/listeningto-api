import fileHandling from "../services/fileHandling.service";
import errorHandling, { BadRequestError, UnauthorizedError, NotFoundError } from "../services/errorHandling.service";
import authCheck from "../services/auth.service";
import { IPatchPlaylist, IPlaylist, IPopulatedPlaylist } from "../interfaces/playlist.interface";
import PlaylistModel from "../models/playlist.model";
import MusicModel from "../models/music.model";
import PlaylistService from "../services/playlist.service";
import mongoose from "mongoose";

// Import e inicialização do Express
import express from "express";
const router = express.Router();

// Operação GET - Buscar playlist - Path /search
router.get("/search", async (req, res) => {
  try {
    const query = req.query.query;
    let playlists: any;

    if (query) {
      const regex = new RegExp(query.toString(), "i");
      const docs = await PlaylistModel.find().populate("createdBy").exec();
      playlists = docs.filter((doc) => {
        const playlist = doc as unknown as IPopulatedPlaylist;

        const testAgainstName = playlist.name.match(regex);
        const testAgainstAuthor = playlist.createdBy.username!.match(regex);
        const testAgainstTags = playlist.tags?.find((tag) => tag.match(regex));

        return testAgainstName || testAgainstAuthor || testAgainstTags;
      });
    } else {
      playlists = await PlaylistModel.find();
    }

    return res.status(200).json(playlists);
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação GET - Obter playlist - Path /
router.get("/:id", async (req, res) => {
  try {
    let playlistDoc = await PlaylistService.populate(await PlaylistService.read(req.params.id));

    if (playlistDoc.private && !req.headers.authorization) throw new UnauthorizedError("A playlist requisitada é privada");

    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;
    if (playlistDoc.private && playlistDoc.createdBy!._id!.toString() != id) throw new UnauthorizedError("A playlist requisitada é privada");

    return res.status(200).json(playlistDoc);
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação POST - Criar playlist - Path /
router.post("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    let { name, tags }: IPlaylist = req.body;
    if (!name) throw new BadRequestError("Um nome para a playlist é obrigatório");

    const cover = req.files?.cover;
    const coverPath = cover ? await fileHandling("Image", Array.isArray(cover) ? cover.shift()! : cover) : undefined;

    // Remoção de duplicatas de tags
    let uniqueTags;
    if (tags) uniqueTags = tags.filter((item, pos) => {
      return tags!.indexOf(item) == pos;
    });

    let objForCreation: IPlaylist = {
      createdBy: new mongoose.Types.ObjectId(id),
      name: name,
      musics: null,
      private: false,
      cover: coverPath,
      tags: uniqueTags
    };

    const playlistDoc = await PlaylistService.populate(await PlaylistService.create(objForCreation));
    return res.status(201).json(playlistDoc);
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação PATCH - Atualizar playlist - Path /
router.patch("/:id", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    const playlistDoc: IPlaylist = await PlaylistService.read(req.params.id);
    if (playlistDoc.createdBy!.toString() != id) throw new UnauthorizedError("Você não é o criador da playlist");

    let toUpdate: IPatchPlaylist = {
      name: req.body.name,
      musics: req.body.musics,
      private: typeof req.body.private == "boolean" ? req.body.private : (req.body.private === 'true'),
      tags: req.body.tags,
      order: req.body.order
    };
    let cover = req.files?.cover;

    // Atualização de músicas
    if (toUpdate.musics) {
      toUpdate.musics = Array.isArray(toUpdate.musics) ? toUpdate.musics : [toUpdate.musics];

      // Remoção de duplicatas de músicas
      let uniqueMusics = toUpdate.musics.filter((item, pos) => {
        return toUpdate.musics!.indexOf(item) == pos;
      });

      // Checagem das músicas
      for (let i in uniqueMusics) {
        let doc = await MusicModel.findById(uniqueMusics[i]).catch(() => {
          throw new BadRequestError(`O ID ${uniqueMusics[i]} não é válido`);
        });
        if (!doc) throw new NotFoundError("Música não encontrada");
      }

      // Inserção ou remoção de músicas
      let musics: string[] = playlistDoc.musics ? [...(playlistDoc.musics as string[])] : [];

      for (let i in uniqueMusics) {
        const index = musics.findIndex((mid) => mid.toString() === uniqueMusics[i].toString());
        if (index == -1) {
          musics.push(uniqueMusics[i] as string)
        } else musics.splice(index, 1);
      }

      toUpdate.musics = musics;
    }

    // Atualização de cover
    if (cover) {
      const coverPath = await fileHandling("Image", Array.isArray(cover) ? cover.shift()! : cover);
      toUpdate.cover = coverPath;
    }

    // Mudança da ordem das músicas
    if (toUpdate.order) {
      let oldMusics = toUpdate.musics ? toUpdate.musics : playlistDoc.musics!;
      let newMusics: IPlaylist["musics"] = [];

      // Remoção de indexes duplicados
      let order = toUpdate.order.filter((item, pos) => {
        return toUpdate.order!.indexOf(item) == pos;
      });

      // Checagem do limite de valor dos indexes, e remoção daqueles fora dele
      order = order.filter((value) => {
        return value < oldMusics.length && value >= 0;
      });

      // Adicionar no final da ordem as músicas não referenciadas
      for (let i in oldMusics) {
        const existsIn = order.find((val) => { return val == parseInt(i) });

        if (typeof existsIn == 'undefined') {
          order.push(parseInt(i));
        }
      }

      // Reorganizar as músicas
      for (let i in order) {
        newMusics[i] = oldMusics[order[i]];
      }

      // Atualizar
      toUpdate.musics = newMusics;
    }

    // Atualização de tags
    if (toUpdate.tags) {
      toUpdate.tags = Array.isArray(toUpdate.tags) ? toUpdate.tags : [toUpdate.tags];

      // Remoção de duplicatas de tags
      let uniqueTags = toUpdate.tags.filter((item, pos) => {
        return toUpdate.tags!.indexOf(item) == pos;
      });
      
      let tags: string[] = playlistDoc.tags ? [...(playlistDoc.tags as string[])] : [];

      // Inserção ou remoção de autores
      for (let i in uniqueTags) {
        const index = tags.findIndex((tag) => tag == uniqueTags[i]);

        if (index == -1) tags.push(uniqueTags[i] as string);
        else tags.splice(index, 1);
      }

      toUpdate.tags = tags;
    }

    const updatedPlaylist: IPopulatedPlaylist = await PlaylistService.populate(await PlaylistService.update(req.params.id, toUpdate));
    return res.status(200).json(updatedPlaylist);
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação DELETE - Deletar playlist - Path /
router.delete("/:id", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    const playlistDoc = await PlaylistModel.findById(req.params.id);
    if (!playlistDoc) throw new NotFoundError("Playlist não encontrada");
    if (playlistDoc.createdBy!.toString() != id) throw new UnauthorizedError("Você não é o criador da playlist");

    await PlaylistService.delete(req.params.id);
    return res.status(204).end();
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

module.exports = router;
