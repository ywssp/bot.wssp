import { EmbedBuilder } from 'discord.js';

import { Duration } from 'luxon';

import { createRadioHyperlink } from './createRadioHyperlink';
import { parseRadioSongArtists } from './parseRadioSongArtists';
import { RadioSongInfo } from '../../../interfaces/Music/Radio/RadioSongInfo';

import { ColorPalette } from '../../../settings/ColorPalette';

export function createRadioSongEmbed(song: RadioSongInfo) {
  const embed = new EmbedBuilder()
    .setColor(ColorPalette.Info)
    .setTitle('Now Playing')
    .addFields([
      {
        name: 'Title',
        value: song.title
      },
      {
        name: 'Artist' + (song.artists.length > 1 ? 's' : ''),

        value: parseRadioSongArtists(song).join(',\n')
      }
    ]);

  if (song.albums.length > 0) {
    const album = song.albums[0];
    embed.addFields({
      name: 'Album',
      value: createRadioHyperlink(album, 'albums')
    });

    if (album.image) {
      embed.setThumbnail('https://cdn.listen.moe/covers/' + album.image);
    }
  }

  embed.addFields({
    name: 'Length',
    value: Duration.fromObject({
      seconds: song.duration
    }).toFormat('m:ss')
  });

  return embed;
}
