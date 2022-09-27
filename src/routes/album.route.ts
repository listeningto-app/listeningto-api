import fileHandling from "../services/fileHandling.service";
import AlbumService from "../services/album.service";
import AlbumModel from "../models/album.model";
import authCheck from "../services/auth.service";
import { IAlbum, IPatchAlbum, IPopulatedAlbum } from "../interfaces/album.interface";
import errorHandling, { BadRequestError, NotFoundError, UnauthorizedError } from "../services/errorHandling.service";
import MusicModel from "../models/music.model";
import mongoose from "mongoose";

// Import e inicialização do Express
import express from "express";
const router = express.Router();

// Operação GET - Obter álbum - Path /
router.get("/:id", async (req, res) => {
  try {
    const albumDoc: IPopulatedAlbum = await AlbumService.populate(await AlbumService.read(req.params.id));
    return res.status(200).json(albumDoc);
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação POST - Criar álbum - Path /
router.post("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    let { name, musics }: IAlbum = req.body;
    const cover = req.files?.cover;

    if (!musics) throw new BadRequestError("Um álbum deve ter, no mínimo, uma (1) música relacionada a ele");

    musics = Array.isArray(musics) ? musics : [musics];

    // Remoção de duplicatas de músicas
    let uniqueMusics = musics.filter((item, pos) => {
      return musics!.indexOf(item) == pos;
    });

    // Checagem das músicas
    for (let i in uniqueMusics) {
      let musicDoc = await MusicModel.findById(uniqueMusics[i]).catch(() => {
        throw new BadRequestError(`O ID ${uniqueMusics[i]} não é válido`);
      });
      if (!musicDoc) throw new NotFoundError("Usuário não encontrado");
    }

    // Inserção do cover
    const coverPath = cover ? await fileHandling("Image", Array.isArray(cover) ? cover.shift()! : cover) : undefined;

    // Inserção no database
    const objForCreation: IAlbum = {
      author: new mongoose.Types.ObjectId(id),
      name: name,
      musics: uniqueMusics,
      cover: coverPath,
    };

    const albumDoc: IPopulatedAlbum = await AlbumService.populate(await AlbumService.create(objForCreation));
    return res.status(201).json(albumDoc);
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação PATCH - Atualizar álbum - Path /
router.patch("/:id", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    const albumDoc = await AlbumModel.findById(req.params.id);

    if (!albumDoc) throw new NotFoundError("Álbum não encontrado");
    if (albumDoc.author!.toString() != id) throw new UnauthorizedError("Você não é o criador do álbum");

    let toUpdate: IPatchAlbum = {
      name: req.body.name,
      musics: req.body.musics,
      tags: req.body.tags,
      order: req.body.order
    };
    const cover = req.files?.cover;

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
      let musics = albumDoc.musics!;

      for (let i in uniqueMusics) {
        const index = musics.findIndex((mid) => mid.toString() === uniqueMusics[i].toString());

        if (index === -1) musics.push(uniqueMusics[i]);
        else musics.splice(index, 1);
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
      let oldMusics = toUpdate.musics ? toUpdate.musics : albumDoc.musics!;
      let newMusics: IAlbum["musics"] = [];

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
        console.log(existsIn);

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
      const tags = albumDoc.tags!;

      // Inserção ou remoção de autores
      for (let i in uniqueTags) {
        const index = tags.findIndex((tag) => tag == tags[i]);

        if (index === -1) {
          tags.push(uniqueTags[i]);
        } else {
          tags.splice(index, 1);
        }
      }

      toUpdate.tags = tags;
    }

    const updatedAlbum: IPopulatedAlbum = await AlbumService.populate(await AlbumService.update(req.params.id, toUpdate));
    return res.status(200).json(updatedAlbum);
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação DELETE - Deletar álbum - Path /
router.delete("/:id", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    const albumDoc = await AlbumModel.findById(req.params.id);
    if (!albumDoc) throw new NotFoundError("Álbum não encontrado");
    if (albumDoc.author!.toString() != id) throw new UnauthorizedError("Você não é o criador do álbum");

    await AlbumService.delete(req.params.id);
    return res.status(204).end();
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

module.exports = router;
