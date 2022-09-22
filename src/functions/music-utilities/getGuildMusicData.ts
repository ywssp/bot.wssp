import { container } from '@sapphire/framework';
import { GuildMusicData } from '../../interfaces/GuildMusicData/GuildMusicData';

export function getGuildMusicData({
  guildId,
  create,
  interaction
}: {
  guildId: string;
  create: true;
  interaction: import('discord.js').CommandInteraction;
}): GuildMusicData;
export function getGuildMusicData(guildId: string): GuildMusicData | undefined;
export function getGuildMusicData(
  args:
    | string
    | {
        guildId: string;
        create: true;
        interaction: import('discord.js').CommandInteraction;
      }
): GuildMusicData | undefined {
  if (typeof args !== 'string') {
    const { guildId, interaction } = args;
    if (!container.guildMusicDataMap.has(guildId)) {
      container.guildMusicDataMap.set(
        guildId as string,
        new GuildMusicData(interaction.channelId)
      );
    }

    return container.guildMusicDataMap.get(guildId) as GuildMusicData;
  }

  return container.guildMusicDataMap.get(args);
}
