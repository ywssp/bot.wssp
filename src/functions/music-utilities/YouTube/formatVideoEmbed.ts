import { APIEmbed, EmbedBuilder, hyperlink } from 'discord.js';
import { QueuedTrack } from '../../../interfaces/YTVideoInfo';

export function formatVideoEmbed(baseEmbed: APIEmbed, video: QueuedTrack) {
  const embed = new EmbedBuilder(baseEmbed).setFields([
    {
      name: 'Title',
      value: hyperlink(video.title, video.url)
    },
    {
      name: 'Channel',
      value:
        video.uploader.url !== undefined
          ? hyperlink(video.uploader.name, video.uploader.url)
          : video.uploader.name
    },
    {
      name: 'Duration',
      value:
        typeof video.duration === 'string'
          ? video.duration
          : video.duration.toFormat('m:ss')
    },
    {
      name: 'Requested by',
      value: video.requestedBy
    }
  ]);

  if (video.thumbnail) {
    embed.setThumbnail(video.thumbnail);
  }

  return embed;
}
