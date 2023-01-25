import { container } from '@sapphire/framework';
import { GuildMusicData } from '../../interfaces/GuildMusicData/GuildMusicData';

export function createGuildMusicData(
  guildId: string,
  channelId: string
): GuildMusicData {
  if (!container.guildMusicDataMap.has(guildId)) {
    container.guildMusicDataMap.set(guildId, new GuildMusicData(channelId));
  }
  return container.guildMusicDataMap.get(guildId) as GuildMusicData;
}

export function getGuildMusicData(guildId: string): GuildMusicData | undefined {
  return container.guildMusicDataMap.get(guildId);
}
