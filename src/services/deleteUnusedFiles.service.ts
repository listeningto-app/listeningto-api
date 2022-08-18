import fs from 'fs'
import glob from 'glob'
import UserModel from '../models/user.model'
import MusicModel from '../models/music.model'
import AlbumModel from '../models/album.model'
import PlaylistModel from '../models/playlist.model'

async function deleteUnusedFiles() {
  // Obter todos os arquivos em public
  let files = glob.sync("public/**/*", { nodir: true });

  // Remover o '../public' da string
  files.forEach((file, index) => {
    file = file.slice(6);
    files[index] = file;
  });

  // Remover os arquivos padrões da array, como a foto de perfil padrão
  files = files.filter((f) => f !== '/images/1/ac1ae8c497a46b4263f35bb0f60d8fc0.png'); // Foto de perfil padrão

  // Checar no database por referências
  for (const file of files) {
    console.log(`Checking: ${file}`);

    // Checagem em usuário
    const userDoc = await UserModel.exists({ profilePic: file });
    if (userDoc) continue;

    // Checagem em música
    const musicDoc = await MusicModel.exists({ $or: [{ file: file }, { cover: file }] });
    if (musicDoc) continue;

    // Checagem em álbum
    const albumDoc = await AlbumModel.exists({ cover: file });
    if (albumDoc) continue;

    // Checagem em playlist
    const playlistDoc = await PlaylistModel.exists({ cover: file });
    if (playlistDoc) continue;

    console.log(`Deleting: ${file}`);
    fs.unlink(`public${file}`, (err) => {
      if (err) throw err;
    });
  }
}

export default deleteUnusedFiles;