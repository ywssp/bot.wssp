'use strict';

import { EmbedBuilder, heading, hyperlink } from 'discord.js';

import { TrackInfo } from '../../../interfaces/Music/Queue System/TrackInfo';

/**
 * Creates an embed from a track.
 * @param baseEmbed The base embed to add the fields to. Do not set a description for this embed, as it will be overwritten.
 * @param track The track to create the embed from.
 * @returns The embed.
 */
export function createSimpleEmbedFromTrack(
  baseEmbed: EmbedBuilder,
  track: TrackInfo
) {
  let text = '';
  text += heading(hyperlink(track.title, track.url), 2);
  text += `\nBy ${track.getArtistHyperlinks()}`;

  if (track.album !== undefined) {
    text += `\nIn ${
      track.album.url
        ? hyperlink(track.album.name, track.album.url)
        : track.album.name
    }`;
  }

  text += `\n\nLength: ${
    typeof track.duration === 'string'
      ? track.duration
      : track.duration.toFormat('m:ss')
  }`;

  const embed = baseEmbed.setDescription(text);

  if (track.thumbnail) {
    embed.setThumbnail(track.thumbnail);
  }

  return embed;
}
