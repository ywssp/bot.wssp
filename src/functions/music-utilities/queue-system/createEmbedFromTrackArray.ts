'use strict';

import { EmbedBuilder } from 'discord.js';
import { TrackInfo } from '../../../interfaces/Music/Queue System/TrackInfo';
import { createEmbedFieldFromTrack } from './createEmbedFieldFromTrack';

/**
 * Creates an embed from an array of tracks. Uses the createEmbedFieldFromTrack function.
 * @param baseEmbed The base embed to add the fields to.
 * @param trackArray The array of tracks to create the embed from.
 * @returns The embed.
 * @see createEmbedFieldFromTrack
 */
export function createEmbedFromTrackArray(
  baseEmbed: EmbedBuilder,
  trackArray: TrackInfo[]
): EmbedBuilder {
  const embed = baseEmbed.setFields(
    trackArray.slice(0, 9).map((track) => createEmbedFieldFromTrack(track))
  );

  if (trackArray.length > 9) {
    embed.addFields({
      name: '\u200b',
      value: `And ${trackArray.length - 9} more...`
    });
  }

  return embed;
}
