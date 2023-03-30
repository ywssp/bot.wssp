import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

client.login(process.env.BOT_TOKEN);

declare module '@sapphire/framework' {
  interface Preconditions {
    InVoiceChannel: never;
    IsPlaying: never;
    OwnerOnly: never;
    HasGuildMusicData: never;
  }
}

import { RadioStationNames } from './interfaces/Music/Radio/AvailableRadioStations';
import { GuildMusicData } from './interfaces/Music/GuildMusicData/GuildMusicData';
import { TetrioUserInfo, TetrioUserRecords } from './interfaces/APIs/TetrioAPI';
import { CachedTrackInfo } from './interfaces/Music/GuildMusicData/Queue System/TrackInfo';
import { RadioWebsocketUpdate } from './interfaces/Music/Radio/RadioWebsocketUpdate';
import type WebSocket from 'ws';
import LRU from 'lru-cache';
declare module '@sapphire/pieces' {
  interface Container {
    guildMusicDataMap: Map<string, GuildMusicData>;
    caches: {
      youtubeTracks: LRU<string, CachedTrackInfo>;
      soundcloudTracks: LRU<string, CachedTrackInfo>;
      tetrioUserInfos: LRU<string, TetrioUserInfo>;
      tetrioUserRecords: LRU<string, TetrioUserRecords>;
    };
    radioWebsockets: Record<
      RadioStationNames,
      {
        connection: WebSocket | null;
        heartbeat: NodeJS.Timeout | null;
        lastUpdate: Exclude<RadioWebsocketUpdate, { op: 0 | 10 }>['d'] | null;
        guildIdSet: Set<string>;
      }
    >;
  }
}
