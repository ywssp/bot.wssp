'use strict';

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

  if (song.albums[0]?.image !== undefined) {
    embed.setThumbnail('https://cdn.listen.moe/covers/' + song.albums[0].image);
  }

  const artistText = parseRadioSongArtists(song).join(', ');

  const albumText =
    song.albums.length > 0
      ? '\nIn ' + createRadioHyperlink(song.albums[0], 'albums')
      : '';

  let lengthText = 'Unknown';
  if (song.duration !== 0) {
    lengthText = Duration.fromObject({
      seconds: song.duration
    }).toFormat('m:ss');
  }

  embed.setDescription(
    `${song.title}\nBy ${artistText}\n${albumText}\nLength: ${lengthText}`
  );

  return embed;
}
