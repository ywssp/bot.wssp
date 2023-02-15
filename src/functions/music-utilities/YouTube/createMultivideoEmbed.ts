import { EmbedBuilder } from 'discord.js';
import { QueuedTrack } from '../../../interfaces/YTVideoInfo';
import { formatVideoField } from './formatVideoField';

export function createMultiVideoEmbed(
  baseEmbed: EmbedBuilder,
  videoList: QueuedTrack[]
): EmbedBuilder {
  const embed = new EmbedBuilder(baseEmbed.data).setFields(
    videoList.slice(0, 9).map((video) => formatVideoField(video))
  );

  if (videoList.length > 9) {
    embed.addFields({
      name: '\u200b',
      value: `And ${videoList.length - 9} more...`
    });
  }

  return embed;
}
