import { APIEmbed, EmbedBuilder, hyperlink } from 'discord.js';
import { QueuedYTVideoInfo } from '../../../interfaces/YTVideoInfo';

export function formatVideoEmbed(
  baseEmbed: APIEmbed,
  video: QueuedYTVideoInfo
) {
  const embed = new EmbedBuilder(baseEmbed).setFields([
    {
      name: 'Title',
      value: hyperlink(video.title, video.url)
    },
    {
      name: 'Channel',
      value: hyperlink(video.channel.name, video.channel.url)
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
