'use strict';

import { VoiceBasedChannel } from 'discord.js';
import {
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnection
} from '@discordjs/voice';

export function connectToVoiceChannel(
  voiceChannel: VoiceBasedChannel
): VoiceConnection {
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
