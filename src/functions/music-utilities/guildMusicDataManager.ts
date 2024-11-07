'use strict';

import { container } from '@sapphire/framework';
import { GuildMusicData } from '../../interfaces/Music/GuildMusicData/GuildMusicData';

/**
 * Creates a GuildMusicData for the guild if it doesn't exist.
 * @param guildId The id of the guild to create the GuildMusicData for.
 * @param textUpdateChannel The channel to send the update messages to.
 * @returns The GuildMusicData for the guild.
 */
export function createGuildMusicData(
  guildId: string,
  voiceChannel: ConstructorParameters<typeof GuildMusicData>[0],
  textUpdateChannel: ConstructorParameters<typeof GuildMusicData>[1]
): GuildMusicData {
  if (!container.guildMusicDataMap.has(guildId)) {
    container.guildMusicDataMap.set(
      guildId,
      new GuildMusicData(voiceChannel, textUpdateChannel)
    );
  }
  return container.guildMusicDataMap.get(guildId) as GuildMusicData;
}

/**
 * Gets the GuildMusicData for the guild.
 * @param guildId The id of the guild to get the GuildMusicData for.
 * @returns The GuildMusicData for the guild.
 */
export function getGuildMusicData(guildId: string): GuildMusicData | undefined {
  return container.guildMusicDataMap.get(guildId);
}

/**
 * Deletes the GuildMusicData of the guild from the map.
 * @param guildId The id of the guild to delete the GuildMusicData for.
 */
export function deleteGuildMusicData(guildId: string): void {
  container.guildMusicDataMap.delete(guildId);
}
