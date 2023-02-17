import { EmbedBuilder } from 'discord.js';
import { TrackInfo } from '../../../interfaces/TrackInfo';
import { createEmbedFieldFromTrack } from './createEmbedFieldFromTrack';

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
