import { Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';
import { GuildMusicData } from '../interfaces/GuildMusicData/GuildMusicData';

import LRU from 'lru-cache';
import { Duration } from 'luxon';
import { TetrioUserInfo, TetrioUserRecords } from '../interfaces/TetrioAPI';
import { CachedYTVideoInfo } from '../interfaces/YTVideoInfo';

export class ReadyListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: 'ready'
    });
  }

  public run(client: Client) {
    const now = new Date();

    this.container.logger.info(
      `${client.user?.tag} has started in ${now.toUTCString()}`
    );

    this.container.guildMusicDataMap = new Map();

    const ttlDuration = Duration.fromObject({ days: 7 }).as('milliseconds');

    this.container.videoCache = new LRU({
      max: 100,
      ttl: ttlDuration,
      ttlResolution: ttlDuration / 7
    });

    this.container.tetrioUserInfoCache = new LRU({
      max: 50
    });

    this.container.tetrioUserRecordCache = new LRU({
      max: 50
    });
  }
}

declare module '@sapphire/pieces' {
  interface Container {
    guildMusicDataMap: Map<string, GuildMusicData>;
    videoCache: LRU<string, CachedYTVideoInfo>;
    tetrioUserInfoCache: LRU<string, TetrioUserInfo>;
    tetrioUserRecordCache: LRU<string, TetrioUserRecords>;
  }
}
