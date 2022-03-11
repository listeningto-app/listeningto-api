import jwtToken from '../interfaces/jwtToken.interface';
import { UnauthorizedError } from './errorHandling.service';

import jwt from 'jsonwebtoken';

import { join } from 'path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
expand(dotenv.config({ path: join(__dirname, "../../.env") }));

export default async function jwtVerify(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwtToken;
    return decoded;
  } catch (e: any) {
    throw new UnauthorizedError("Auth token invalid");
  }
}