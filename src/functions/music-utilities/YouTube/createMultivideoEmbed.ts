import { MessageEmbed } from 'discord.js';
import { SimpleYTVideoInfo } from '../../../interfaces/SimpleYTVideoInfo';
import { formatVideoField } from './formatVideoField';

export function createMultiVideoEmbed(
  baseEmbed: MessageEmbed,
  videoList: SimpleYTVideoInfo[]
): MessageEmbed {
  const embed = new MessageEmbed(baseEmbed).setFields(
    videoList.slice(0, 9).map((video) => formatVideoField(video))
  );

  if (videoList.length > 9) {
    embed.addFields({
      name: '\u200b',
      value: `And ${videoList.length - 9} more...`
    });
  }

  return embed;
}
