import { EmbedBuilder, hyperlink } from 'discord.js';
import { TrackInfo } from '../../../interfaces/Music/Queue System/TrackInfo';

export function createEmbedFromTrack(
  baseEmbed: EmbedBuilder,
  track: TrackInfo
) {
  const embed = baseEmbed.setFields([
    {
      name: 'Title',
      value: hyperlink(track.title, track.url)
    },
    {
      name: 'Artist',
      value:
        track.uploader.url !== undefined
          ? hyperlink(track.uploader.name, track.uploader.url)
          : track.uploader.name
    },
    {
      name: 'Duration',
      value:
        typeof track.duration === 'string'
          ? track.duration
          : track.duration.toFormat('m:ss')
    }
  ]);

  if (track.thumbnail) {
    embed.setThumbnail(track.thumbnail);
  }

  return embed;
}
