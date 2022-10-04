import { EmbedFieldData } from 'discord.js';
import { SimpleYTVideoInfo } from '../../../interfaces/SimpleYTVideoInfo';

export function formatVideoField(
  video: SimpleYTVideoInfo,
  prefix?: string
): EmbedFieldData {
  return {
    name: `${prefix ? prefix + ' ' : ''}${video.title}`,
    value: `[Link](${video.url}) | ${
      typeof video.duration === 'string'
        ? video.duration
        : video.duration.toFormat('m:ss')
    } | By [${video.channel.name}](${video.channel.url})`
  };
}
