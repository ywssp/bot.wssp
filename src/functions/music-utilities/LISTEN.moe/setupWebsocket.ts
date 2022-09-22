import { container } from '@sapphire/framework';
import { TextChannel } from 'discord.js';
import { Duration } from 'luxon';
import WebSocket from 'ws';
import { RadioWebsocketUpdate } from '../../../interfaces/RadioWebsocketUpdate';
import { getGuildMusicData } from '../getGuildMusicData';
import { formatSongEmbed } from './formatRadioSongEmbed';

export function setupRadioWebsocket(guildId: string, channel: 'jpop' | 'kpop') {
  const guildMusicData = getGuildMusicData(guildId);

  if (typeof guildMusicData === 'undefined') {
    return;
  }

  const websocketUrl =
    'wss://listen.moe' + (channel === 'kpop' ? '/kpop' : '') + '/gateway_v2';
  const websocket = new WebSocket(websocketUrl);

  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data as string) as RadioWebsocketUpdate;

    switch (data.op) {
      case 0: {
        websocket.send(JSON.stringify({ op: 9 }));

        const heartbeat = setInterval(() => {
          websocket.send(JSON.stringify({ op: 9 }));
        }, data.d.heartbeat);

        guildMusicData.radioData = {
          channel,
          websocket: {
            connection: websocket,
            heartbeat: heartbeat
          },
          lastUpdate: null,
          currentSong: undefined
        };
        break;
      }
      case 1:
        if (
          [
            'TRACK_UPDATE',
            'TRACK_UPDATE_REQUEST',
            'QUEUE_UPDATE',
            'NOTIFICATION'
          ].includes(data.t)
        ) {
          guildMusicData.radioData.currentSong = data.d.song;
          guildMusicData.radioData.lastUpdate = data;
          const textUpdateChannel = container.client.channels.cache.get(
            guildMusicData.textUpdateChannelId
          ) as TextChannel;

          if (guildMusicData.musicAnnounceStyle === 'full') {
            const embed = formatSongEmbed(data.d.song);

            textUpdateChannel.send({ embeds: [embed] });
          } else if (guildMusicData.musicAnnounceStyle === 'minimal') {
            textUpdateChannel.send(
              `Now playing: ${data.d.song.title} by ${data.d.song.artists
                .map((artist) => artist.name)
                .join(', ')} | ${Duration.fromObject({
                seconds: data.d.song.duration
              }).toFormat('mm:ss')}`
            );
          }
        }
        break;
      default:
        break;
    }
  };

  websocket.onclose = () => {
    clearInterval(
      guildMusicData.radioData?.websocket?.heartbeat as NodeJS.Timeout
    );
    guildMusicData.radioData.websocket = null;
    guildMusicData.radioData.lastUpdate = null;
    guildMusicData.radioData.currentSong = undefined;
    guildMusicData.radioData.channel = 'none';
  };

  websocket.onerror = (error) => {
    container.logger.error(error);
  };
}
