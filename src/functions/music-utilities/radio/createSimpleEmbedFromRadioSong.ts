import { EmbedBuilder } from 'discord.js';

import { Duration } from 'luxon';

import { createRadioHyperlink } from './createRadioHyperlink';
import { parseRadioSongArtists } from './parseRadioSongArtists';
import { RadioSongInfo } from '../../../interfaces/Music/Radio/RadioSongInfo';

import { ColorPalette } from '../../../settings/ColorPalette';

export function createSimpleRadioSongEmbed(song: RadioSongInfo) {
  const embed = new EmbedBuilder()
    .setColor(ColorPalette.Info)
    .setTitle('Now Playing');

  if (song.albums[0] !== undefined && song.albums[0].image !== undefined) {
    embed.setThumbnail('https://cdn.listen.moe/covers/' + song.albums[0].image);
  }

  const artistText = parseRadioSongArtists(song).join(',\n');

  const albumText =
    song.albums.length > 0
      ? createRadioHyperlink(song.albums[0], 'albums')
      : 'Unknown Album';

  const lengthText = Duration.fromObject({
    seconds: song.duration
  }).toFormat('m:ss');

  embed.setDescription(
    `${song.title}

Length: ${lengthText}
Artists:
${artistText}
Album: ${albumText}`
  );

  return embed;
}
