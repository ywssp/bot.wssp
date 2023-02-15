import { EmbedField, hyperlink } from 'discord.js';
import { QueuedYTVideoInfo } from '../../../interfaces/YTVideoInfo';

export function formatVideoField(
  video: QueuedYTVideoInfo,
  prefix?: string
): EmbedField {
  let name = '';
  if (prefix) {
    name += prefix + ' ';
  }

  name += video.title;

  let value = '';
  value += `${hyperlink('Link', video.url)} | `;

  if (typeof video.duration === 'string') {
    value += video.duration;
  } else {
    value += video.duration.toFormat('m:ss');
  }

  const channelString =
    video.channel.url !== undefined
      ? hyperlink(video.channel.name, video.channel.url)
      : video.channel.name;

  value += ` | By ${channelString}`;

  return {
    name,
    value,
    inline: false
  };
}
