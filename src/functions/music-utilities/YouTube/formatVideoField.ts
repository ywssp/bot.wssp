import { EmbedField } from 'discord.js';
import { QueuedYTVideoInfo } from '../../../interfaces/YTVideoInfo';

export function formatVideoField(
  video: QueuedYTVideoInfo,
  prefix?: string
): EmbedField {
  return {
    name: `${prefix ? prefix + ' ' : ''}${video.title}`,
    value: `[Link](${video.url}) | ${
      typeof video.duration === 'string'
        ? video.duration
        : video.duration.toFormat('m:ss')
    } | By [${video.channel.name}](${video.channel.url})`,
    inline: false
  };
}
