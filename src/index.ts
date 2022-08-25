// Dotenv
import { join } from "path";
import dotenv from "dotenv";
dotenv.config({ path: join(__dirname, "../.env") });

// Imports
import express from "express";
import mongoose from "mongoose";
import fileupload from "express-fileupload";
import { CronJob } from 'cron';
import deleteUnusedFiles from './services/deleteUnusedFiles.service'

// Inicialização do Banco de Dados
mongoose.connect(process.env.DB_URL_CONNECTION!);

// Inicialização do Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(join(__dirname, "../public")));

app.use(fileupload());

app.listen(8080, () => console.log("Conectado à porta 8080"));

// Cronograma da limpeza de arquivos inutilizados
new CronJob("0 0 * * *", deleteUnusedFiles, null, true, "America/Sao_Paulo");

// Permitir CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  next();
});

// Routes do Express
app.use("/user", require("./routes/user.route")); // Usuário
app.use("/music", require("./routes/music.route")); // Música
app.use("/album", require("./routes/album.route")); // Álbum
app.use("/playlist", require("./routes/playlist.route")); // Playlist
