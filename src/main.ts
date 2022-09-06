import { SapphireClient } from '@sapphire/framework';
import 'dotenv/config';

const client = new SapphireClient({
  intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'],
  loadMessageCommandListeners: true,
  defaultPrefix: process.env.PREFIX?.split('|')
});

client.login(process.env.TOKEN);

declare module '@sapphire/framework' {
  interface Preconditions {
    InVoiceChannel: never;
    IsPlaying: never;
    OwnerOnly: never;
  }
}
