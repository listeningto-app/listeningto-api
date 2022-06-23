import { UnauthorizedError } from "./errorHandling.service";

import jwt from "jsonwebtoken";

interface jwtToken {
  id: string;
}

export default async function authCheck(token: string | undefined) {
  try {
    if (!token)
      throw new UnauthorizedError(
        "An Authorization header must be provided with a auth token"
      );
    token = token.split(" ")[1];

    return jwt.verify(token, process.env.JWT_SECRET!) as jwtToken;
  } catch (e: any) {
    throw new UnauthorizedError("Authorization token invalid");
  }
}
