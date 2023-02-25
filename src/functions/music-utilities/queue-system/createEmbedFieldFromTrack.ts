import { EmbedField, hyperlink } from 'discord.js';
import { TrackInfo } from '../../../interfaces/Music/Queue System/TrackInfo';

/**
 * Creates an embed field from a track.
 * @param track The track to create the embed field from.
 * @param prefix The prefix to add to the track title.
 * @returns The embed field.
 */
export function createEmbedFieldFromTrack(
  track: TrackInfo,
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

  const uploaderString =
    track.uploader.url !== undefined
      ? hyperlink(track.uploader.name, track.uploader.url)
      : track.uploader.name;

  value += ` | By ${uploaderString}`;

  return {
    name,
    value,
    inline: false
  };
}
