// Esse arquivo cuida de funções que serão usadas em operações no database e no Redis

import ioredis from "ioredis";
const redis = new ioredis(parseInt(process.env.REDIS_PORT!), {
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
});

import mongoose from "mongoose";
import { BadRequestError, NotFoundError } from "./errorHandling.service";

// Obter documento de um model pelo ID
export async function getDocumentById(
  modelname: string,
  id: string
): Promise<mongoose.Document> {
  const doc = await mongoose.model(modelname).findById(id);
  if (!doc) throw new NotFoundError("Document not found");

  return doc;
}

// Validar documento do Mongoose
export async function validate(doc: mongoose.Document): Promise<void> {
  const errors = doc.validateSync();
  if (!errors) return;

  throw new BadRequestError(
    errors.errors[Object.keys(errors.errors)[0]].message
  );
}

// Inserir item no Redis
export async function redisSET(id: string, data: string): Promise<void> {
  await redis.set(id, data, "EX", 1800);
  return;
}

// Obter item do Redis
export async function redisGET(id: string): Promise<string | null> {
  return await redis.get(id);
}

// Remover item do Redis
export async function redisDEL(id: string): Promise<void> {
  await redis.del(id);
  return;
}
