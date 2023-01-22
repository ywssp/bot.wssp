import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  loadMessageCommandListeners: true,
  defaultPrefix: process.env.PREFIX?.split('|')
});

client.login(process.env.TOKEN);

declare module '@sapphire/framework' {
  interface Preconditions {
    InVoiceChannel: never;
    IsPlaying: never;
    IsPlayingYoutube: never;
    OwnerOnly: never;
    HasGuildMusicData: never;
  }
}
