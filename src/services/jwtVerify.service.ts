import { UnauthorizedError } from './errorHandling.service';

import jwt from 'jsonwebtoken';

import { join } from 'path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
expand(dotenv.config({ path: join(__dirname, "../../.env") }));

interface jwtToken {
  id: string
}

export default async function jwtVerify(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as jwtToken;
  } catch (e: any) { throw new UnauthorizedError("Auth token invalid"); }
}