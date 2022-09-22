import { MessageEmbed } from 'discord.js';
import { SimpleVideoInfo } from '../../../interfaces/SimpleVideoInfo';

export function formatVideoEmbed(
  baseEmbed: MessageEmbed,
  video: SimpleVideoInfo,
  include?: {
    requester?: boolean;
  }
) {
  const embed = new MessageEmbed(baseEmbed).setFields([
    {
      name: 'Title',
      value: `[${video.title}](${video.url})`
    },
    {
      name: 'Channel',
      value: `[${video.channel.name}](${video.channel.url})`
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
      value: video.requester
    }
  ]);

  if (video.thumbnail) {
    embed.setThumbnail(video.thumbnail);
  }

  return embed;
}
