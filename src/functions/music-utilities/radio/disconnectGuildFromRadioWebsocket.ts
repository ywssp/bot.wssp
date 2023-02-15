import { container } from '@sapphire/framework';
import { getGuildMusicData } from '../guildMusicDataManager';

export function disconnectGuildFromRadioWebsocket(guildId: string) {
  const guildMusicData = getGuildMusicData(guildId);

  if (guildMusicData === undefined) {
    return;
  }

  const guildRadioData = guildMusicData.radioData;

  if (guildRadioData.station !== 'none') {
    container.radioWebsockets[guildRadioData.station].guildIdSet.delete(
      guildId
    );

    if (
      container.radioWebsockets[guildRadioData.station].guildIdSet.size === 0
    ) {
      container.radioWebsockets[guildRadioData.station].connection?.close();
    }

    guildRadioData.station = 'none';
    guildRadioData.url = 'none';
  }
}
