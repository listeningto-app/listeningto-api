// Imports locais
import userService from '../services/user.service';
import userModel from '../models/user.model';
import errorHandling, { BadRequestError, UnauthorizedError, NotFoundError } from '../services/errorHandling.service';
import jwtVerify from '../services/jwtVerify.service';
import IUser from '../interfaces/user.interface';
import fileHandling from '../services/fileHandling.service';

// Imports de libraries
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Import e inicialização do Express
import express from "express";
const router = express.Router();

// Operação GET - Obter usuário - Path /
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

    return res.status(201).json({ auth: token, userDoc });
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação PATCH - Atualizar usuário - Path /
router.patch("/", async (req, res) => {
  try {
    let auth: string | undefined = req.headers.authorization;

    // Verificação de auth
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

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

    return res.status(200).json(userDoc);
  } catch (e: any) { return errorHandling(e, res) };
});

// Operação DELETE - Deletar usuário - Path /
router.delete("/", async (req, res) => {
  try {
    let auth: string | undefined = req.headers.authorization;

    // Verificação de auth
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

    await userService.delete(id);
    return res.status(204).end();
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação POST - Login do usuário - Path /login
router.post("/login", async (req, res) => {
  try {
    const { username, email, password }: IUser = req.body;

    // Checar input
    if (!username && !email) throw new BadRequestError("An email address or a username is required");
    if (!password) throw new BadRequestError("A password is required");

    // Checar database
    const userDoc = (await userModel.find({ $or: [{ username: username }, { email: email }] })).shift();
    if (!userDoc) throw new NotFoundError("No user with the informed username/email address");

    // Comparar senhas
    const authenticated = await bcrypt.compare(password, userDoc.password!);
    if (!authenticated) throw new UnauthorizedError("Password incorrect");

    // Criação do JWT
    const token: string = jwt.sign({ id: userDoc.id }, process.env.JWT_SECRET!);

    return res.status(200).json({ auth: token, userDoc });
  } catch (e: any) { return errorHandling(e, res) }
});

module.exports = router;