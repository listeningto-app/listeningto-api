export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = "BadRequestError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = "NotFoundError";
  }
}

import type express from 'express';

export default function errorHandling(error: Error, res: express.Response) {
  let statusCode: number;

  switch(error.name) {
    case "BadRequestError": { 
      statusCode = 400;
      break;
    }
    case "ConflictError": {
      statusCode = 409;
      break;
    }
    case "UnauthorizedError": {
      statusCode = 401;
      break;
    }
    case "NotFoundError": {
      statusCode = 404;
      break;
    }
    default: {
      statusCode = 500;
      break;
    }
  }

  return res.status(statusCode).json({ message: statusCode == 500 ? "Internal server error" : error.message });
}