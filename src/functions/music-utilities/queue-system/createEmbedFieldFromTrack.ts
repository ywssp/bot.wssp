import { EmbedField, hyperlink } from 'discord.js';
import { QueuedTrackInfo } from '../../../interfaces/TrackInfo';

export function createEmbedFieldFromTrack(
  track: QueuedTrackInfo,
  prefix?: string
): EmbedField {
  let name = '';
  if (prefix) {
    name += prefix + ' ';
  }

  name += track.title;

  let value = '';
  value += `${hyperlink('Link', track.url)} | `;

  if (typeof track.duration === 'string') {
    value += track.duration;
  } else {
    value += track.duration.toFormat('m:ss');
  }

  const channelString =
    track.uploader.url !== undefined
      ? hyperlink(track.uploader.name, track.uploader.url)
      : track.uploader.name;

  value += ` | By ${channelString}`;

  return {
    name,
    value,
    inline: false
  };
}
