import { EmbedBuilder } from 'discord.js';

import { Duration } from 'luxon';

import { createClickableRadioLink } from './CreateClickableRadioLink';
import { parseArtists } from './ParseRadioArtists';
import { RadioSongInfo } from '../../../interfaces/RadioSongInfo';

import { ColorPalette } from '../../../settings/ColorPalette';

export function formatSongEmbed(song: RadioSongInfo) {
  const embed = new EmbedBuilder()
    .setColor(ColorPalette.info)
    .setTitle('Now Playing')
    .addFields([
      {
        name: 'Title',
        value: song.title
      },
      {
        name: 'Artist' + (song.artists.length > 1 ? 's' : ''),

        value: parseArtists(song).join(',\n')
      }
    ]);
  if (song.albums.length > 0) {
    const album = song.albums[0];
    embed.addFields({
      name: 'Album',
      value: createClickableRadioLink(album, 'albums')
    });

    if (album.image) {
      embed.setThumbnail('https://cdn.listen.moe/covers/' + album.image);
    }
  }

  embed.addFields({
    name: 'Duration',
    value: Duration.fromObject({
      seconds: song.duration
    }).toFormat('m:ss')
  });

  return embed;
}