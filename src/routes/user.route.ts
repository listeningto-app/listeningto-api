import UserService from "../services/user.service";
import UserModel from "../models/user.model";
import errorHandling, { BadRequestError, UnauthorizedError, NotFoundError } from "../services/errorHandling.service";
import authCheck from "../services/auth.service";
import IUser from "../interfaces/user.interface";
import fileHandling from "../services/fileHandling.service";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import IPlaylist from "../interfaces/playlist.interface";

// Import e inicialização do Express
import express from "express";
const router = express.Router();

// Operação GET - Obter usuário - Path /:id
router.get("/:id", async (req, res) => {
  try {
    const userDoc = (await UserService.read(req.params.id)).toObject();

    if (req.headers.authorization) {
      const token_id = (await authCheck(req.headers.authorization)).id;

      if (userDoc._id.toString() == token_id) {
        return res.status(200).json(userDoc);
      }
    }

    delete userDoc["email"];
    return res.status(200).json(userDoc);
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação POST - Criar usuário - Path /
router.post("/", async (req, res) => {
  try {
    const { username, email, password }: IUser = req.body;

    // Inserção no database
    const userDoc = (await UserService.create({
      username: username,
      email: email,
      password: password,
    })).toObject();

    // Criação do JWT
    const token = jwt.sign(
      { id: userDoc._id!.toString() },
      process.env.JWT_SECRET!
    );

    return res.status(201).json({ auth: token, user: userDoc });
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação PATCH - Atualizar usuário - Path /
router.patch("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    let toUpdate: IUser = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    };

    // Inserção da profile pic
    const profilePic = req.files?.profilePic;
    if (profilePic) {
      const file = Array.isArray(profilePic) ? profilePic.shift()! : profilePic;
      toUpdate.profilePic = await fileHandling("Image", file);
    }

    // Atualização no database
    const userDoc = (await UserService.update(id, toUpdate)).toObject();

    return res.status(200).json(userDoc);
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação DELETE - Deletar usuário - Path /
router.delete("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    await UserService.delete(id);
    return res.status(204).end();
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação POST - Login do usuário - Path /login
router.post("/login", async (req, res) => {
  try {
    const { email_or_username, password } = req.body;

    // Checar input
    if (!email_or_username || !password) throw new BadRequestError("Um endereço de email ou nome de usuário e uma senha são necessários");

    // Checar database
    const userDoc = await UserModel.findOne({ $or: [{ username: email_or_username }, { email: email_or_username }] });
    if (!userDoc) throw new NotFoundError("Não existe um usuário com o nome ou email informado");

    // Comparar senhas
    const authenticated = await bcrypt.compare(password, userDoc.password!);
    if (!authenticated) throw new UnauthorizedError("Senha incorreta");

    // Criação do JWT
    const token: string = jwt.sign({ id: userDoc.id }, process.env.JWT_SECRET!);

    return res.status(200).json({ auth: token, user: userDoc });
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação GET - Obter playlists do usuário - Path /:id/playlists
router.get("/:id/playlists", async (req, res) => {
  try {
    const id = req.params.id;
    const auth = req.headers.authorization;
    let playlists: IPlaylist[] = await UserService.playlists(id);

    if (auth) {
      const auth_id = (await authCheck(auth)).id;
      if (id == auth_id) return res.status(200).json({ playlists: playlists });
    }

    playlists = playlists.filter((pl) => {
      return pl.private == false;
    });

    return res.status(200).json({ playlists: playlists });
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação GET - Obter músicas do usuário - Path /:id/musics
router.get("/:id/musics", async (req, res) => {
  try {
    const id = req.params.id;
    const musics = await UserService.musics(id);

    return res.status(200).json({ musics: musics });
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

// Operação GET - Obter álbuns do usuário - Path /:id/albuns
router.get("/:id/albums", async (req, res) => {
  try {
    const id = req.params.id;
    const albuns = await UserService.albuns(id);

    return res.status(200).json({ albuns: albuns });
  } catch (e: any) {
    return errorHandling(e, res);
  }
});

module.exports = router;
