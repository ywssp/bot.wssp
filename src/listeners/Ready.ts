import { Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';
import { GuildMusicData } from '../interfaces/GuildMusicData';

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
  }
}

declare module '@sapphire/pieces' {
  interface Container {
    guildMusicDataMap: Map<string, GuildMusicData>;
  }
}
