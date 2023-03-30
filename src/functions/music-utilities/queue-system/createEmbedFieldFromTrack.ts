import { EmbedField, hyperlink } from 'discord.js';
import { TrackInfo } from '../../../interfaces/Music/GuildMusicData/Queue System/TrackInfo';

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

  const linkString = hyperlink('Link', track.url);

  const uploaderString =
    track.uploader.url !== undefined
      ? hyperlink(track.uploader.name, track.uploader.url)
      : track.uploader.name;

  let durationString: string;
  if (typeof track.duration === 'string') {
    durationString = track.duration;
  } else {
    durationString = track.duration.toFormat('m:ss');
  }

  const value = `${linkString} | By ${uploaderString} | ${durationString}`;

  return {
    name,
    value,
    inline: false
  };
}
