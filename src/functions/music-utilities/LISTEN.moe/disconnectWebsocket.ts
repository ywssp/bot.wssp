import { getGuildMusicData } from '../getGuildMusicData';

export function disconnectRadioWebsocket(guildId: string) {
  const guildMusicData = getGuildMusicData({
    guildId,
    create: false
  });

  if (typeof guildMusicData === 'undefined') {
    return;
  }

  if (guildMusicData.radioData.websocket !== null) {
    guildMusicData.radioData.websocket.connection.close();
    clearInterval(guildMusicData.radioData.websocket.heartbeat);
    guildMusicData.radioData.websocket = null;
  }

  guildMusicData.radioData.channel = 'none';
  guildMusicData.radioData.lastUpdate = null;
  guildMusicData.radioData.currentSong = undefined;
}
