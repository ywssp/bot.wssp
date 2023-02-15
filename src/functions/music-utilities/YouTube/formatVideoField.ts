import { EmbedField, hyperlink } from 'discord.js';
import { QueuedTrack } from '../../../interfaces/YTVideoInfo';

export function formatVideoField(
  video: QueuedTrack,
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
    video.uploader.url !== undefined
      ? hyperlink(video.uploader.name, video.uploader.url)
      : video.uploader.name;

  value += ` | By ${channelString}`;

  return {
    name,
    value,
    inline: false
  };
}
