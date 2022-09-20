import { MessageEmbed } from 'discord.js';
import { SimpleVideoInfo } from '../../../interfaces/SimpleVideoInfo';

export function formatVideoEmbed(
  video: SimpleVideoInfo,
  baseEmbed: MessageEmbed,
  include?: {
    requester?: boolean;
  },
  override?: {
    title?: string;
    channel?: string;
    duration?: string;
  }
) {
  const checkOverride = (
    key: 'title' | 'channel' | 'duration',
    defaultString: string
  ) => {
    if (override !== undefined && override[key] !== undefined) {
      return override[key] as string;
    }
    return defaultString;
  };

  const embed = new MessageEmbed(baseEmbed).setFields([
    {
      name: 'Title',
      value: checkOverride('title', `[${video.title}](${video.url})`)
    },
    {
      name: 'Channel',
      value: checkOverride(
        'channel',
        `[${video.channel.name}](${video.channel.url})`
      )
    },
    {
      name: 'Length',
      value: checkOverride(
        'duration',
        typeof video.duration === 'string'
          ? video.duration
          : video.duration.toFormat('m:ss')
      )
    }
  ]);

  if (include?.requester) {
    embed.addField('Requested by', video.requester.toString());
  }

  if (video.thumbnail) {
    embed.setThumbnail(video.thumbnail);
  }

  return embed;
}
