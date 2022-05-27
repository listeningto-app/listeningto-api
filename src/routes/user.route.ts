// Imports locais
import userService from '../services/user.service';
import userModel from '../models/user.model';
import errorHandling, { BadRequestError, UnauthorizedError, NotFoundError } from '../services/errorHandling.service';
import authCheck from '../services/auth.service';
import IUser from '../interfaces/user.interface';
import fileHandling from '../services/fileHandling.service';

// Imports de libraries
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Import e inicialização do Express
import express from "express";
const router = express.Router();

// Operação GET - Obter usuário - Path /:id
router.get("/:id", async (req, res) => {
  try {
    const userDoc = await userService.read(req.params.id);
    return res.status(200).json(userDoc);
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação POST - Criar usuário - Path /
router.post("/", async (req, res) => {
  try {
    const { username, email, password }: IUser = req.body;

    // Inserção no database
    const userDoc: IUser = await userService.create({ username: username, email: email, password: password });

    // Criação do JWT
    const token = jwt.sign({ id: userDoc._id!.toString() }, process.env.JWT_SECRET!);

    return res.status(201).json({ auth: token, user: userDoc });
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação PATCH - Atualizar usuário - Path /
router.patch("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    let toUpdate: IUser = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    }

    // Inserção da profile pic
    const profilePic = req.files?.profilePic;
    if (profilePic) {
      const file = Array.isArray(profilePic) ? profilePic.shift()! : profilePic;
      toUpdate.profilePic = await fileHandling("Image", file);
    }

    // Atualização no database
    const userDoc = await userService.update(id, toUpdate);

    return res.status(200).json({ user: userDoc });
  } catch (e: any) { return errorHandling(e, res) };
});

// Operação DELETE - Deletar usuário - Path /
router.delete("/", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const id = (await authCheck(auth)).id;

    await userService.delete(id);
    return res.status(204).end();
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação POST - Login do usuário - Path /login
router.post("/login", async (req, res) => {
  try {
    const { password }: IUser = req.body;
    const email_or_username: string | null = req.body.email_or_username;

    // Checar input
    if (!email_or_username) throw new BadRequestError("An email address or a username is required");
    if (!password) throw new BadRequestError("A password is required");

    // Checar database
    const userDoc = (await userModel.find({ $or: [{ username: email_or_username }, { email: email_or_username }] })).shift();
    if (!userDoc) throw new NotFoundError("No user with the informed username/email address");

    // Comparar senhas
    const authenticated = await bcrypt.compare(password, userDoc.password!);
    if (!authenticated) throw new UnauthorizedError("Password incorrect");

    // Criação do JWT
    const token: string = jwt.sign({ id: userDoc.id }, process.env.JWT_SECRET!);

    return res.status(200).json({ auth: token, user: userDoc });
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação GET - Obter playlists do usuário - Path /:id/playlists
router.get("/:id/playlists", async (req, res) => {
  try {
    const id = req.params.id;
    const playlists = await userService.playlists(id);

    return res.status(200).json({ playlists: playlists });
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação GET - Obter músicas do usuário - Path /:id/musics
router.get("/:id/musics", async (req, res) => {
  try {
    const id = req.params.id;
    const musics = await userService.musics(id);

    return res.status(200).json({ musics: musics });
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação GET - Obter álbuns do usuário - Path /:id/albuns
router.get("/:id/albuns", async (req, res) => {
  try {
    const id = req.params.id;
    const albuns = await userService.albuns(id);

    return res.status(200).json({ albuns: albuns });
  } catch (e: any) { return errorHandling(e, res) }
});

module.exports = router;