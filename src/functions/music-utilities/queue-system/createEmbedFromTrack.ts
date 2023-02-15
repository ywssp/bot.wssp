import { EmbedBuilder, hyperlink } from 'discord.js';
import { QueuedTrackInfo } from '../../../interfaces/TrackInfo';

export function createEmbedFromTrack(
  baseEmbed: EmbedBuilder,
  track: QueuedTrackInfo
) {
  const embed = baseEmbed.setFields([
    {
      name: 'Title',
      value: hyperlink(track.title, track.url)
    },
    {
      name: 'Channel',
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
    },
    {
      name: 'Requested by',
      value: track.requestedBy
    }
  ]);

  if (track.thumbnail) {
    embed.setThumbnail(track.thumbnail);
  }

  return embed;
}
