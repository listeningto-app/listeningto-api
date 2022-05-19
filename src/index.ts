// Dotenv
import { join } from 'path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
expand(dotenv.config({ path: join(__dirname, "../.env") }));

// Imports
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import fileupload from 'express-fileupload';
import fs from 'fs';

// Inicialização do Banco de Dados
mongoose.connect(process.env.DB_URL_CONNECTION!);

// Inicialização do Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(join(__dirname, "../public")));

app.use(fileupload());

app.listen(8080, () => console.log("Conectado à porta 8080"));

// Inicialização do Logger
const logStream = fs.createWriteStream(join(__dirname, "../access.log"), { flags: "a" });
app.use(morgan("common", { stream: logStream }));

// Routes do Express
app.use("/user", require("./routes/user.route")); // Usuário
app.use("/music", require("./routes/music.route")); // Música
app.use("/album", require("./routes/album.route")); // Álbum
app.use("/playlist", require("./routes/playlist.route")); // Playlist
