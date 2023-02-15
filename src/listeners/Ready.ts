import { Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';

import LRU from 'lru-cache';
import { Duration } from 'luxon';

import play from 'play-dl';

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

    // Setup the SoundCloud client ID
    play.getFreeClientID().then((id) => {
      play.setToken({
        soundcloud: {
          client_id: id
        }
      });
    });

    // Setup the guild music data map
    this.container.guildMusicDataMap = new Map();

    // Setup the caches
    const ttlDuration = Duration.fromObject({ days: 7 }).as('milliseconds');

    this.container.caches = {
      tracks: new LRU({
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
