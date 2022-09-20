import { container } from '@sapphire/framework';
import { GuildMusicData } from '../../interfaces/GuildMusicData/GuildMusicData';

export function getGuildMusicData({
  guildId,
  textChannelId,
  create
}: {
  guildId: string;
  textChannelId: string;
  create: true;
}): GuildMusicData;
export function getGuildMusicData({
  guildId,
  create
}: {
  guildId: string;
  create: false;
}): GuildMusicData | undefined;
export function getGuildMusicData({
  guildId,
  textChannelId,
  create
}: {
  guildId: string;
  textChannelId?: string;
  create: boolean;
}) {
  if (create) {
    if (!container.guildMusicDataMap.has(guildId)) {
      container.guildMusicDataMap.set(
        guildId as string,
        new GuildMusicData(textChannelId as string)
      );
    }

    return container.guildMusicDataMap.get(guildId) as GuildMusicData;
  }

  return container.guildMusicDataMap.get(guildId);
}
