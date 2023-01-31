import { Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';
import { GuildMusicData } from '../interfaces/GuildMusicData/GuildMusicData';

import LRU from 'lru-cache';
import { Duration } from 'luxon';
import { TetrioUserInfo, TetrioUserRecords } from '../interfaces/TetrioAPI';
import { CachedYTVideoInfo } from '../interfaces/YTVideoInfo';
import { WebSocket } from 'ws';
import { RadioWebsocketUpdate } from '../interfaces/RadioWebsocketUpdate';
import { RadioStationNames } from '../interfaces/AvailableRadioStations';

export class ReadyListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: 'ready'
    });
  }

  public run(client: Client) {
    // Log the bot's start time
    const now = new Date();

    this.container.logger.info(
      `${client.user?.tag} has started in ${now.toUTCString()}`
    );

    // Setup the guild music data map
    this.container.guildMusicDataMap = new Map();

    // Setup the caches
    const ttlDuration = Duration.fromObject({ days: 7 }).as('milliseconds');

    this.container.caches = {
      videos: new LRU({
        max: 100,
        ttl: ttlDuration,
        ttlResolution: ttlDuration / 7
      }),
      tetrioUserInfos: new LRU({
        max: 50
      }),
      tetrioUserRecords: new LRU({
        max: 50
      })
    };

    this.container.radioWebsockets = {
      kpop: {
        connection: null,
        heartbeat: null,
        lastUpdate: null,
        guildIdSet: new Set()
      },
      jpop: {
        connection: null,
        heartbeat: null,
        lastUpdate: null,
        guildIdSet: new Set()
      }
    };
  }
}

type radioWebsocket = {
  connection: WebSocket | null;
  heartbeat: NodeJS.Timeout | null;
  lastUpdate: Exclude<RadioWebsocketUpdate, { op: 0 | 10 }>['d'] | null;
  guildIdSet: Set<string>;
};
declare module '@sapphire/pieces' {
  interface Container {
    guildMusicDataMap: Map<string, GuildMusicData>;
    caches: {
      videos: LRU<string, CachedYTVideoInfo>;
      tetrioUserInfos: LRU<string, TetrioUserInfo>;
      tetrioUserRecords: LRU<string, TetrioUserRecords>;
    };
    radioWebsockets: Record<RadioStationNames, radioWebsocket>;
  }
}
