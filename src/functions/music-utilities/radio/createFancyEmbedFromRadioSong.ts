'use strict';

import { EmbedBuilder } from 'discord.js';

import { Duration } from 'luxon';

import { RadioSongInfo } from '../../../interfaces/Music/Radio/RadioSongInfo';
import { ColorPalette } from '../../../settings/ColorPalette';
import { createRadioHyperlink } from './createRadioHyperlink';
import { parseRadioSongArtists } from './parseRadioSongArtists';

export function createFancyRadioSongEmbed(song: RadioSongInfo) {
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
    value:
      song.duration !== 0
        ? Duration.fromObject({
            seconds: song.duration
          }).toFormat('m:ss')
        : 'Unknown'
  });

  return embed;
}
