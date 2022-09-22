import { getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';

export function connectVoiceChannel(voiceChannel: VoiceBasedChannel) {
  const existingConnection = getVoiceConnection(voiceChannel.guild.id);

  if (existingConnection) {
    return existingConnection;
  }

  return joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator
  });
}
