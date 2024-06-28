// Install source-map-support for easier debugging
import { install } from 'source-map-support';
install();

import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates
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
import {
  CachedAdaptedTrackInfo,
  CachedTrackInfo
} from './interfaces/Music/Queue System/TrackInfo';
import { RadioWebsocketUpdate } from './interfaces/Music/Radio/RadioWebsocketUpdate';
import type WebSocket from 'ws';
import LRU from 'lru-cache';

declare module '@sapphire/pieces' {
  interface Container {
    guildMusicDataMap: Map<string, GuildMusicData>;
    caches: {
      youtubeTracks: LRU<string, CachedTrackInfo>;
      soundcloudTracks: LRU<string, CachedTrackInfo>;
      ytMusicTracks: LRU<string, CachedTrackInfo>;
      spotifyTracks: LRU<string, CachedAdaptedTrackInfo>;
      tetrioUserInfos: LRU<string, TetrioUserInfo>;
      tetrioUserRecords: LRU<string, TetrioUserRecords>;
    };
    radioWebsockets: Record<
      RadioStationNames,
      {
        connection: WebSocket | null;
        firstUpdate: boolean;
        heartbeat: NodeJS.Timeout | null;
        lastUpdate: Exclude<RadioWebsocketUpdate, { op: 0 | 10 }>['d'] | null;
        guildIdSet: Set<string>;
      }
    >;
  }
}
