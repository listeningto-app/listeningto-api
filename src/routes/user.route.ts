// Imports locais
import User from '../services/user.service';
import userModel from '../models/user.model';
import errorHandling, { BadRequestError, UnauthorizedError, NotFoundError } from '../services/errorHandling.service';
import jwtVerify from '../services/jwtVerify.service';
import IUser from '../interfaces/user.interface';
import fileHandling from '../services/fileHandling.service';

// Imports de libraries
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

// Operação GET - Obter usuário - Path /
router.get("/:id", async (req, res) => {
  try {
    let doc: string | null | mongoose.LeanDocument<IUser>; 
    const id: string | undefined = req.params.id;

    if (!id) throw new BadRequestError("An ID must be provided");

    // Busca no Redis
    doc = await redis.get(id);
    if (doc) {
      doc = JSON.parse(doc);
      return res.status(200).send(doc);
    }

    // Busca no database e inserção no Redis
    doc = await User.read(id);
    await redis.set(id, JSON.stringify(doc), "ex", 1800);

    // Resposta
    return res.status(200).json(doc);
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação POST - Criar usuário - Path /
router.post("/", async (req, res) => {
  try {
    const { username, email, password }: IUser = req.body;

    // Inserção no database
    const user = await User.create({ username: username, email: email, password: password });
    
    // Inserção no Redis
    await redis.set(user._id!.toString(), JSON.stringify(user), "ex", 1800);

    // Criação do JWT
    const token: string = jwt.sign({ id: user._id!.toString() }, process.env.JWT_SECRET!);

    // Resposta
    return res.status(201).json({ auth: token, user });
  } catch (e: any) { return errorHandling(e, res) }
});

// Operação PATCH - Atualizar usuário - Path /
router.patch("/", async (req, res) => {
  try {
    let toUpdate: IUser = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      profilePic: undefined
    }
    let auth: string | undefined = req.headers.authorization;

    // Verificação de auth
    if (!auth) throw new UnauthorizedError("An Authorization header must be provided with a auth token");
    auth = auth.split(" ")[1];
    const id = (await jwtVerify(auth)).id;

    // Inserção da profile pic
    const profilePic = req.files?.profilePic;
    if (profilePic) {
      const file = Array.isArray(profilePic) ? profilePic.shift()! : profilePic;
      toUpdate.profilePic = await fileHandling("Image", file);
    }

    // Atualização no database
    const user = await User.update(id, toUpdate);

    // Atualização / Inserção no Redis
    await redis.set(id, JSON.stringify(user));

    // Resposta
    return res.status(200).json(user);
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

    // Deletar do database
    await User.delete(id);

    // Deletar do Redis
    await redis.del(id);

    // Resposta
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
    const user = (await userModel.find({ $or: [{ username: username }, { email: email }] })).shift();
    if (!user) throw new NotFoundError("No user with the informed username/email address");

    // Comparar senhas
    const authenticated = await bcrypt.compare(password, user.password!);
    if (!authenticated) throw new UnauthorizedError("Password incorrect");

    // Criação do JWT
    const token: string = jwt.sign({ id: user._id!.toString() }, process.env.JWT_SECRET!);

    // Resposta
    return res.status(200).json({ auth: token });
  } catch (e: any) { return errorHandling(e, res) }
});

module.exports = router;