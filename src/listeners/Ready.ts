import { Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';
import { GuildMusicData } from '../interfaces/GuildMusicData/GuildMusicData';

import type { SimpleYTVideoInfo } from '../interfaces/SimpleYTVideoInfo';

import LRU from 'lru-cache';
import { Duration } from 'luxon';

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

    const ttlDuration = Duration.fromObject({ days: 1 }).as('milliseconds');

    this.container.videoCache = new LRU({
      max: 100,
      ttl: ttlDuration,
      ttlResolution: ttlDuration
    });
  }
}

declare module '@sapphire/pieces' {
  interface Container {
    guildMusicDataMap: Map<string, GuildMusicData>;
    videoCache: LRU<string, SimpleYTVideoInfo>;
  }
}
